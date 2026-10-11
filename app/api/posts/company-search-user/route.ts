// บริษัทค้นหาผู้หางาน: ค้นด้วยคำสำคัญ แล้วเพิ่มคะแนนจากความคล้ายเชิงความหมาย (embedding)
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import {
  cosineSimilarity,
  getEmbedding,
  getEmbeddings,
  hashOf,
} from "@/lib/vectorSimilarity";

// ================= ค่าคงที่ =================

const MAX_CANDIDATES = 300; // จำนวนผู้หางานสูงสุดที่ดึงมาคิดคะแนน
const MAX_LIVE_EMBED = 40; // คำนวณ embedding ใหม่ได้ไม่เกินกี่คนต่อหนึ่งคำขอ
const MIN_SCORE = 0.25; // คะแนนขั้นต่ำที่จะแสดงในผลการค้นหา
const MAX_RESULTS = 100; // จำนวนผลลัพธ์สูงสุด

// ความคล้ายเชิงความหมายต้องเกิน 0.45 ถึงจะได้คะแนนเพิ่ม (ส่วนที่เกินคูณ 1.2)
const VECTOR_THRESHOLD = 0.45;
const VECTOR_WEIGHT = 1.2;

// ================= ชนิดข้อมูล =================

interface SeekerRow {
  uid: number;
  fullname: string | null;
  profile_image: string | null;
  province: string | null;
  age: number | null;
  created_at: string;
  job_name: string | null;
  education_levels: string | null;
  job_names_concat?: string | null;
  embedding?: number[] | null;
  embedding_hash?: string | null;
}

// ================= SQL ที่ใช้ร่วมกัน =================

const USER_COLUMNS = `
  u.uid, u.fullname, u.profile_image, u.province, u.age, u.created_at,
  GROUP_CONCAT(DISTINCT j.job_name SEPARATOR ', ') AS job_name,
  GROUP_CONCAT(DISTINCT ed.level SEPARATOR ', ') AS education_levels`;

// คอลัมน์เพิ่มเติมที่ใช้ตอนค้นหา (ข้อความสำหรับ embedding และ embedding ที่บันทึกไว้)
const SEARCH_COLUMNS = `
  GROUP_CONCAT(DISTINCT j.job_name SEPARATOR ' ') AS job_names_concat,
  u.embedding, u.embedding_hash`;

const USER_JOINS = `
  FROM User u
  LEFT JOIN JobTitle j ON j.user_id = u.uid
  LEFT JOIN education ed ON ed.user_id = u.uid`;

async function runQuery(sql: string, params: (string | number)[]): Promise<SeekerRow[]> {
  const [rows] = (await db.query(sql, params)) as [SeekerRow[], unknown];
  return rows;
}

// ================= ฟังก์ชันช่วย =================

// ตัวพิมพ์เล็ก ตัด - และ _ ออก และรวมช่องว่างที่ติดกันเป็นช่องเดียว
function normalizeText(text: string | null | undefined): string {
  return (text || "").toLowerCase().replace(/[-_]+/g, "").replace(/\s+/g, " ").trim();
}

// แยกคำค้นออกเป็นคำ ๆ
function splitWords(text: string): string[] {
  return normalizeText(text).split(" ").filter((word) => word !== "");
}

// ข้อความของผู้หางานที่ใช้สร้าง embedding
function buildUserText(user: SeekerRow): string {
  return [user.fullname, user.province, user.job_names_concat].filter(Boolean).join(" ");
}

// อ่าน embedding ที่บันทึกไว้ ใช้ได้เฉพาะเมื่อข้อมูลผู้หางานยังไม่ถูกแก้หลังบันทึก (hash ตรงกัน)
// คอลัมน์เป็นชนิด JSON จึงได้ค่ามาเป็น array อยู่แล้ว
function readSavedVector(user: SeekerRow, text: string): number[] | null {
  if (!Array.isArray(user.embedding)) return null;
  if (user.embedding_hash !== hashOf(text)) return null;
  return user.embedding;
}

// เตรียม embedding ของผู้หางานทุกคน: ใช้ค่าที่บันทึกไว้ ถ้าไม่มีให้คำนวณใหม่แล้วบันทึกเก็บไว้
// คนที่เกินโควตา MAX_LIVE_EMBED จะได้ null (คิดคะแนนจากคำสำคัญอย่างเดียว)
async function getUserVectors(users: SeekerRow[]): Promise<(number[] | null)[]> {
  const vectors: (number[] | null)[] = [];
  const needNew: number[] = []; // ลำดับ (index) ของคนที่ต้องคำนวณใหม่

  // อ่าน embedding ที่บันทึกไว้ ถ้าไม่มีหรือ hash ไม่ตรงก็เก็บลำดับไว้คำนวณใหม่
  for (let i = 0; i < users.length; i++) {
    const saved = readSavedVector(users[i], buildUserText(users[i]));
    vectors.push(saved);
    if (saved === null && needNew.length < MAX_LIVE_EMBED) {
      needNew.push(i);
    }
  }

  if (needNew.length === 0) return vectors;

  const texts = needNew.map((i) => buildUserText(users[i]));
  const newVectors = await getEmbeddings(texts);

  // บันทึก embedding ใหม่ลงฐานข้อมูล (ไม่ต้องรอให้เสร็จ)
  for (let k = 0; k < needNew.length; k++) {
    const user = users[needNew[k]];
    vectors[needNew[k]] = newVectors[k];

    // บันทึกไว้ใช้ครั้งหน้า (ไม่ต้องรอให้เสร็จ)
    db.query("UPDATE User SET embedding = ?, embedding_hash = ? WHERE uid = ?", [
      JSON.stringify(newVectors[k]),
      hashOf(texts[k]),
      user.uid,
    ]).catch((err) => console.error("Save user embedding failed:", err));
  }

  return vectors;
}

// คะแนนคำสำคัญ: เจอคำค้นทั้งก้อนได้คะแนนมาก เจอทีละคำได้คะแนนน้อยกว่า
function keywordScore(user: SeekerRow, query: string, words: string[]): number {
  const name = normalizeText(user.fullname);
  const job = normalizeText(user.job_names_concat);
  const province = normalizeText(user.province);

  let score = 0;
  if (name.includes(query)) score += 0.8;
  if (job.includes(query)) score += 0.7;
  if (province.includes(query)) score += 0.6;

  for (const word of words) {
    if (name.includes(word)) score += 0.3;
    if (job.includes(word)) score += 0.3;
    if (province.includes(word)) score += 0.2;
  }
  return score;
}

// คะแนนเพิ่มจากความคล้ายเชิงความหมาย
function vectorScore(queryVector: number[], userVector: number[] | null): number {
  if (userVector === null) return 0;
  const similarity = cosineSimilarity(queryVector, userVector);
  if (similarity <= VECTOR_THRESHOLD) return 0;
  return (similarity - VECTOR_THRESHOLD) * VECTOR_WEIGHT;
}

// ================= API =================

export async function GET(request: NextRequest) {
  try {
    // ---------- 1. อ่านค่าจาก URL ----------
    const params = new URL(request.url).searchParams;
    const rawQuery = params.get("q")?.trim() || "";
    const province = params.get("province") || "";
    const workType = params.get("work_type") || "";
    const education = params.get("education") || "";
    const minAge = Number(params.get("minAge")) || 18;
    const maxAge = Number(params.get("maxAge")) || 60;

    // ---------- 2. เงื่อนไขกรอง ----------
    // WHERE กับ HAVING อยู่คนละตำแหน่งใน SQL จึงต้องเก็บค่า (params) แยกกัน
    const where = [
      "u.is_visible = 1",
      "u.role = 'seeker'",
      "((u.age >= ? AND u.age <= ?) OR u.age IS NULL)",
    ];
    const whereParams: (string | number)[] = [minAge, maxAge];

    if (province) {
      where.push("u.province = ?");
      whereParams.push(province);
    }
    if (workType) {
      where.push("u.type_of_work LIKE ?");
      whereParams.push(`%${workType}%`);
    }

    // ระดับการศึกษามาจาก GROUP_CONCAT จึงต้องกรองใน HAVING (หลัง GROUP BY)
    let having = "";
    const havingParams: string[] = [];
    if (education) {
      having = "HAVING education_levels LIKE ?";
      havingParams.push(`%${education}%`);
    }

    // ---------- 3. ไม่มีคำค้นหา: ส่งผู้หางานล่าสุดตามตัวกรอง ----------
    if (!rawQuery) {
      const latest = await runQuery(
        `SELECT ${USER_COLUMNS} ${USER_JOINS}
         WHERE ${where.join(" AND ")}
         GROUP BY u.uid ${having}
         ORDER BY u.created_at DESC`,
        [...whereParams, ...havingParams],
      );
      return NextResponse.json({ success: true, users: latest });
    }

    // ---------- 4. ค้นด้วยคำสำคัญ ----------
    // แต่ละคำต้องเจอในชื่อ จังหวัด หรือตำแหน่งที่สนใจ อย่างน้อยหนึ่งที่
    const query = normalizeText(rawQuery);
    const words = splitWords(rawQuery);

    const wordConditions: string[] = [];
    const wordParams: string[] = [];
    // สร้างเงื่อนไข SQL สำหรับแต่ละคำ
    for (const word of words) {
      // ใช้ LOWER() เพื่อไม่สนใจตัวพิมพ์ใหญ่-เล็ก
      wordConditions.push(
        "(LOWER(u.fullname) LIKE ? OR LOWER(u.province) LIKE ? OR LOWER(j.job_name) LIKE ?)",
      );
      wordParams.push(`%${word}%`, `%${word}%`, `%${word}%`);
    }

    // รวมเงื่อนไขคำค้นกับเงื่อนไขกรองอื่น ๆ
    const keywordWhere = [...where];
    if (wordConditions.length > 0) {
      keywordWhere.push(`(${wordConditions.join(" OR ")})`);
    }

    // ดึงผู้หางานที่ตรงกับคำค้นและตัวกรอง (ไม่เกิน MAX_CANDIDATES คน)
    let candidates = await runQuery(
      `SELECT ${USER_COLUMNS}, ${SEARCH_COLUMNS} ${USER_JOINS}
       WHERE ${keywordWhere.join(" AND ")}
       GROUP BY u.uid ${having}
       LIMIT ${MAX_CANDIDATES}`,
      [...whereParams, ...wordParams, ...havingParams],
    );

    // ---------- 5. ไม่เจอด้วยคำสำคัญ: ให้ความคล้ายเชิงความหมายหาแทน ----------
    // ถ้าไม่เจอผู้หางานด้วยคำสำคัญ ให้ค้นหาเฉพาะตัวกรอง (province, workType, education, age) แล้วคำนวณ embedding ของผู้หางานแต่ละคน
    if (candidates.length === 0) {
      candidates = await runQuery(
        `SELECT ${USER_COLUMNS}, ${SEARCH_COLUMNS} ${USER_JOINS}
         WHERE ${where.join(" AND ")} AND u.embedding IS NOT NULL
         GROUP BY u.uid ${having}
         ORDER BY u.created_at DESC
         LIMIT ${MAX_CANDIDATES}`,
        [...whereParams, ...havingParams],
      );
    }

    if (candidates.length === 0) {
      return NextResponse.json({ success: true, users: [] });
    }

    // ---------- 6. คิดคะแนน = คะแนนคำสำคัญ + คะแนนความหมาย ----------
    const queryVector = await getEmbedding(rawQuery);
    const userVectors = await getUserVectors(candidates);

    const results = [];
    for (let i = 0; i < candidates.length; i++) {
      const user = candidates[i];
      const score =
        keywordScore(user, query, words) + vectorScore(queryVector, userVectors[i]);

      if (score < MIN_SCORE) continue;

      // ส่งกลับเฉพาะข้อมูลที่หน้าเว็บใช้ (ไม่ส่ง embedding)
      results.push({
        uid: user.uid,
        fullname: user.fullname,
        profile_image: user.profile_image,
        province: user.province,
        job_name: user.job_name,
        age: user.age,
        created_at: user.created_at,
        matchScore: Number(score.toFixed(4)),
      });
    }

    // ---------- 7. เรียงคะแนนมากไปน้อย ----------
    results.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({ success: true, users: results.slice(0, MAX_RESULTS) });
  } catch (error) {
    console.error("User search error:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในระบบ" },
      { status: 500 },
    );
  }
}
