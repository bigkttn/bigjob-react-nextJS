import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import {
  getEmbedding,
  getEmbeddings,
  cosineSimilarity,
  hashOf,
} from "@/lib/vectorSimilarity";

function normalizeText(text: string): string {
  return (text || "").toLowerCase().replace(/[-_]+/g, "").replace(/\s+/g, " ").trim();
}

function tokenizeText(text: string): string[] {
  const clean = normalizeText(text);
  return clean ? clean.split(" ").filter((t) => t.length > 0) : [];
}

const buildUserText = (u: any) =>
  [u.fullname, u.province, u.job_names_concat].filter(Boolean).join(" ").trim();

const MAX_LIVE_EMBED = 40;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get("q")?.trim() || "";
    const province = searchParams.get("province") || "";
    const work_type = searchParams.get("work_type") || "";
    const education = searchParams.get("education") || "";
    const minAge = searchParams.get("minAge") || "18";
    const maxAge = searchParams.get("maxAge") || "60";

    // Build SQL Filters
    const whereClauses: string[] = ["u.is_visible = 1", "u.role = 'seeker'"];
    const filterParams: any[] = [];

    if (province) {
      whereClauses.push("u.province = ?");
      filterParams.push(province);
    }

    if (work_type) {
      whereClauses.push("u.type_of_work LIKE ?");
      filterParams.push(`%${work_type}%`);
    }

    if (minAge && maxAge) {
      whereClauses.push("(u.age >= ? AND u.age <= ? OR u.age IS NULL)");
      filterParams.push(Number(minAge), Number(maxAge));
    }

    const havingClauses: string[] = [];
    if (education) {
      havingClauses.push("education_levels LIKE ?");
      filterParams.push(`%${education}%`);
    }

    const baseWhereSQL = `WHERE ${whereClauses.join(" AND ")}`;
    const havingSQL =
      havingClauses.length > 0 ? `HAVING ${havingClauses.join(" AND ")}` : "";

    // กรณีไม่มีคำค้นหา: ดึงตาม Filter
    if (!rawQuery) {
      const sql = `
        SELECT 
            u.uid, 
            u.fullname, 
            u.profile_image, 
            u.province, 
            u.age,
            u.created_at,
            GROUP_CONCAT(DISTINCT j.job_name SEPARATOR ', ') AS job_name,
            GROUP_CONCAT(DISTINCT ed.level SEPARATOR ', ') AS education_levels
         FROM User u
         LEFT JOIN JobTitle j ON j.user_id = u.uid
         LEFT JOIN education ed ON ed.user_id = u.uid
         ${baseWhereSQL}
         GROUP BY u.uid
         ${havingSQL}
         ORDER BY u.created_at DESC 
         LIMIT 30`;

      const [latestUsers]: any = await db.query(sql, filterParams);
      return NextResponse.json({ success: true, users: latestUsers });
    }

    const normalizedQuery = normalizeText(rawQuery);
    const queryTokens = tokenizeText(rawQuery);
    const likeParams = queryTokens.map((t) => `%${t}%`);

    const likeClause = queryTokens
      .map(
        () =>
          `(LOWER(u.fullname) LIKE ? OR LOWER(u.province) LIKE ? OR LOWER(j.job_name) LIKE ?)`
      )
      .join(" OR ");

    const searchParamsArray = likeParams.flatMap((p) => [p, p, p]);

    const combinedWhereSQL = `${baseWhereSQL} ${likeClause ? `AND (${likeClause})` : ""}`;
    const combinedParams = [...filterParams, ...searchParamsArray];

    let [candidates]: any = await db.query(
      `SELECT 
          u.uid, 
          u.fullname, 
          u.profile_image, 
          u.province, 
          u.age,
          u.created_at,
          u.embedding,
          u.embedding_hash,
          GROUP_CONCAT(DISTINCT j.job_name SEPARATOR ' ') AS job_names_concat,
          GROUP_CONCAT(DISTINCT j.job_name SEPARATOR ', ') AS job_name,
          GROUP_CONCAT(DISTINCT ed.level SEPARATOR ', ') AS education_levels
       FROM User u
       LEFT JOIN JobTitle j ON j.user_id = u.uid
       LEFT JOIN education ed ON ed.user_id = u.uid
       ${combinedWhereSQL}
       GROUP BY u.uid
       ${havingSQL}
       LIMIT 300`,
      combinedParams
    );

    // Fallback เมื่อ keyword ไม่พบ
    if (!candidates || candidates.length === 0) {
      [candidates] = await db.query(
        `SELECT 
            u.uid, 
            u.fullname, 
            u.profile_image, 
            u.province, 
            u.age,
            u.created_at,
            u.embedding,
            u.embedding_hash,
            GROUP_CONCAT(DISTINCT j.job_name SEPARATOR ' ') AS job_names_concat,
            GROUP_CONCAT(DISTINCT j.job_name SEPARATOR ', ') AS job_name,
            GROUP_CONCAT(DISTINCT ed.level SEPARATOR ', ') AS education_levels
         FROM User u
         LEFT JOIN JobTitle j ON j.user_id = u.uid
         LEFT JOIN education ed ON ed.user_id = u.uid
         ${baseWhereSQL} AND u.embedding IS NOT NULL
         GROUP BY u.uid
         ${havingSQL}
         ORDER BY u.created_at DESC 
         LIMIT 300`,
        filterParams
      );
    }

    if (!candidates?.length) return NextResponse.json({ success: true, users: [] });

    // Step 2: Query Embedding
    const queryVector = await getEmbedding(rawQuery);

    // Step 3: Embed Live สำหรับ Candidate ที่ยังไม่มี
    const needEmbed: { idx: number; text: string }[] = [];
    const vectors: (number[] | null)[] = candidates.map((u: any, idx: number) => {
      const text = buildUserText(u);
      if (u.embedding && u.embedding_hash === hashOf(text)) {
        try {
          return typeof u.embedding === "string"
            ? JSON.parse(u.embedding)
            : u.embedding;
        } catch {
          /* fallthrough */
        }
      }
      if (needEmbed.length < MAX_LIVE_EMBED) needEmbed.push({ idx, text });
      return null;
    });

    if (needEmbed.length) {
      const fresh = await getEmbeddings(needEmbed.map((n) => n.text));
      needEmbed.forEach((n, k) => {
        vectors[n.idx] = fresh[k];
        db.query(
          `UPDATE User SET embedding = ?, embedding_hash = ? WHERE uid = ?`,
          [JSON.stringify(fresh[k]), hashOf(n.text), candidates[n.idx].uid]
        ).catch((err) => {
          console.error("Async user embedding cache update failed:", err);
        });
      });
    }

    // Step 4: Scoring
    const scored = candidates.map((user: any, i: number) => {
      const cleanFullname = normalizeText(user.fullname);
      const cleanProvince = normalizeText(user.province);
      const cleanJobText = normalizeText(user.job_names_concat);

      let keywordScore = 0;
      if (cleanJobText.includes(normalizedQuery)) keywordScore += 0.7;
      if (cleanFullname.includes(normalizedQuery)) keywordScore += 0.8;
      if (cleanProvince.includes(normalizedQuery)) keywordScore += 0.6;

      queryTokens.forEach((t) => {
        if (cleanJobText.includes(t)) keywordScore += 0.3;
        if (cleanFullname.includes(t)) keywordScore += 0.3;
        if (cleanProvince.includes(t)) keywordScore += 0.2;
      });

      const vec = vectors[i];
      const vectorScore = vec ? cosineSimilarity(queryVector, vec) : 0;
      const vectorBonus = vectorScore > 0.45 ? (vectorScore - 0.45) * 1.2 : 0;

      return {
        uid: user.uid,
        fullname: user.fullname,
        profile_image: user.profile_image,
        province: user.province,
        job_name: user.job_name,
        age: user.age,
        created_at: user.created_at,
        matchScore: Number((keywordScore + vectorBonus).toFixed(4)),
      };
    });

    const users = scored
      .filter((u: any) => u.matchScore >= 0.25)
      .sort((a: any, b: any) => b.matchScore - a.matchScore)
      .slice(0, 100);

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error("User search error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}