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

const buildPostText = (p: any) =>
  [
    p.job_position,
    p.company_name,
    p.province,
    p.work_location,
    p.job_type,
    p.job_description,
    p.preferred_qualifications,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

const MAX_LIVE_EMBED = 40;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get("q")?.trim() || "";
    const job_type = searchParams.get("job_type") || "";
    const province = searchParams.get("province") || "";
    const status = searchParams.get("status") || "";

    // Build SQL Filter Conditions
    const filterClauses: string[] = [];
    const filterParams: any[] = [];

    if (job_type) {
      filterClauses.push("p.job_type = ?");
      filterParams.push(job_type);
    }

    if (province) {
      filterClauses.push("(p.province = ? OR p.work_location LIKE ?)");
      filterParams.push(province, `%${province}%`);
    }

    if (status) {
      if (status.toLowerCase() === "open") {
        filterClauses.push(
          "(p.application_dates >= NOW() OR p.application_dates IS NULL)"
        );
      } else if (status.toLowerCase() === "closed") {
        filterClauses.push("p.application_dates < NOW()");
      }
    }

    const filterSQL = filterClauses.length > 0 ? filterClauses.join(" AND ") : "";

    // กรณีไม่มีคำค้นหา: คืนค่ารายการล่าสุดตาม Filter
    if (!rawQuery) {
      const sql = `
        SELECT p.*, c.company_name, c.logo_image,
               CASE 
                 WHEN p.application_dates < NOW() THEN 'closed'
                 ELSE 'Open'  
               END AS status
        FROM posts p 
        LEFT JOIN company c ON p.company_id = c.company_id
        ${filterSQL ? `WHERE ${filterSQL}` : ""}
        ORDER BY p.created_at DESC LIMIT 30`;

      const [latest]: any = await db.query(sql, filterParams);
      return NextResponse.json({ success: true, posts: latest });
    }

    const normalizedQuery = normalizeText(rawQuery);
    const queryTokens = tokenizeText(rawQuery);
    const likeParams = queryTokens.map((t) => `%${t}%`);

    const likeClause = queryTokens
      .map(
        () =>
          `(LOWER(p.job_position) LIKE ? OR LOWER(c.company_name) LIKE ?
           OR LOWER(p.province) LIKE ? OR LOWER(p.work_location) LIKE ?
           OR LOWER(p.job_type) LIKE ? OR LOWER(p.job_description) LIKE ?)`
      )
      .join(" OR ");

    const searchParamsArray = likeParams.flatMap((p) => [p, p, p, p, p, p]);

    // รวม SQL Prefilter + UI Filters
    let combinedWhere = "";
    const finalParams: any[] = [];

    if (filterSQL && likeClause) {
      combinedWhere = `WHERE (${filterSQL}) AND (${likeClause})`;
      finalParams.push(...filterParams, ...searchParamsArray);
    } else if (filterSQL) {
      combinedWhere = `WHERE ${filterSQL}`;
      finalParams.push(...filterParams);
    } else if (likeClause) {
      combinedWhere = `WHERE ${likeClause}`;
      finalParams.push(...searchParamsArray);
    }

    let [candidates]: any = await db.query(
      `SELECT p.*, c.company_name, c.logo_image,
              CASE 
                WHEN p.application_dates < NOW() THEN 'closed'
                ELSE 'Open'  
              END AS status
       FROM posts p LEFT JOIN company c ON p.company_id = c.company_id
       ${combinedWhere}
       LIMIT 300`,
      finalParams
    );

    // Fallback เมื่อ keyword ไม่พบ: ค้นหา Semantic จากรายการที่ Filter ตรง และ indexed แล้ว
    if (!candidates || candidates.length === 0) {
      const fallbackWhere = filterSQL
        ? `WHERE (${filterSQL}) AND p.embedding IS NOT NULL`
        : "WHERE p.embedding IS NOT NULL";

      [candidates] = await db.query(
        `SELECT p.*, c.company_name, c.logo_image,
                CASE 
                  WHEN p.application_dates < NOW() THEN 'closed'
                  ELSE 'Open'  
                END AS status
         FROM posts p LEFT JOIN company c ON p.company_id = c.company_id
         ${fallbackWhere}
         ORDER BY p.created_at DESC LIMIT 300`,
        filterParams
      );
    }

    if (!candidates?.length) return NextResponse.json({ success: true, posts: [] });

    // Step 2: embed query
    const queryVector = await getEmbedding(rawQuery);

    // Step 3: Embed Candidate ที่ไม่มี Vector สดๆ (สูงสุด MAX_LIVE_EMBED)
    const needEmbed: { idx: number; text: string }[] = [];
    const vectors: (number[] | null)[] = candidates.map((p: any, idx: number) => {
      const text = buildPostText(p);
      if (p.embedding && p.embedding_hash === hashOf(text)) {
        try {
          return typeof p.embedding === "string"
            ? JSON.parse(p.embedding)
            : p.embedding;
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
          `UPDATE posts SET embedding = ?, embedding_hash = ? WHERE post_id = ?`,
          [JSON.stringify(fresh[k]), hashOf(n.text), candidates[n.idx].post_id]
        ).catch((err) => {
          console.error("Async post embedding cache update failed:", err);
        });
      });
    }

    // Step 4: Scoring
    const scored = candidates.map((post: any, i: number) => {
      const cleanPosition = normalizeText(post.job_position);
      const cleanCompany = normalizeText(post.company_name);
      const cleanProvince = normalizeText(post.province);
      const cleanLocation = normalizeText(post.work_location);
      const cleanType = normalizeText(post.job_type);
      const cleanDesc = normalizeText(post.job_description);

      let keywordScore = 0;
      if (cleanPosition.includes(normalizedQuery)) keywordScore += 0.8;
      if (cleanCompany.includes(normalizedQuery)) keywordScore += 0.6;
      if (
        cleanProvince.includes(normalizedQuery) ||
        cleanLocation.includes(normalizedQuery)
      )
        keywordScore += 0.5;
      if (cleanType.includes(normalizedQuery)) keywordScore += 0.4;
      if (cleanDesc.includes(normalizedQuery)) keywordScore += 0.3;

      queryTokens.forEach((t) => {
        if (cleanPosition.includes(t)) keywordScore += 0.3;
        if (cleanCompany.includes(t)) keywordScore += 0.2;
        if (cleanProvince.includes(t) || cleanLocation.includes(t))
          keywordScore += 0.2;
        if (cleanType.includes(t)) keywordScore += 0.15;
      });

      const vec = vectors[i];
      const vectorScore = vec ? cosineSimilarity(queryVector, vec) : 0;
      const vectorBonus = vectorScore > 0.45 ? (vectorScore - 0.45) * 1.2 : 0;

      return {
        ...post,
        embedding: undefined,
        matchScore: Number((keywordScore + vectorBonus).toFixed(4)),
      };
    });

    const posts = scored
      .filter((p: any) => p.matchScore >= 0.25)
      .sort((a: any, b: any) => b.matchScore - a.matchScore)
      .slice(0, 100);

    return NextResponse.json({ success: true, posts });
  } catch (error: any) {
    console.error("Search error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}