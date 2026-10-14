// ผู้หางานค้นหาประกาศงาน: ค้นด้วยคำสำคัญ แล้วเพิ่มคะแนนจากความคล้ายเชิงความหมาย (embedding)
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import {
  cosineSimilarity,
  getEmbedding,
  getEmbeddings,
  hashOf,
} from "@/lib/vectorSimilarity";
import { omitEmbedding, omitEmbeddings } from "@/lib/omitEmbedding";

// ================= ค่าคงที่ =================

const LATEST_LIMIT = 30; // จำนวนประกาศล่าสุดตอนไม่มีคำค้น
const MAX_CANDIDATES = 300; // จำนวนประกาศสูงสุดที่ดึงมาคิดคะแนน
const MAX_LIVE_EMBED = 40; // คำนวณ embedding ใหม่ได้ไม่เกินกี่ประกาศต่อหนึ่งคำขอ
const MIN_SCORE = 0.25; // คะแนนขั้นต่ำที่จะแสดงในผลการค้นหา
const MAX_RESULTS = 100; // จำนวนผลลัพธ์สูงสุด

// ความคล้ายเชิงความหมายต้องเกิน 0.45 ถึงจะได้คะแนนเพิ่ม (ส่วนที่เกินคูณ 1.2)
const VECTOR_THRESHOLD = 0.45;
const VECTOR_WEIGHT = 1.2;

// ค้นด้วยคำสำคัญไม่เจอ (ใช้ความหมายอย่างเดียว): แสดงประกาศที่คล้ายตั้งแต่ 0.55 ไม่เกิน 20 รายการ
// ประกาศเป็นข้อความยาว เทียบกับคำค้นสั้น ๆ แล้วความคล้ายมักอยู่ราว 0.5–0.65 จึงใช้เกณฑ์ MIN_SCORE ไม่ได้
const FALLBACK_MIN_SIMILARITY = 0.55;
const FALLBACK_MAX_RESULTS = 20;

// ================= ชนิดข้อมูล =================

interface PostRow {
  post_id: number;
  job_position: string | null;
  company_name: string | null;
  province: string | null;
  work_location: string | null;
  job_type: string | null;
  job_description: string | null;
  preferred_qualifications: string | null;
  embedding?: number[] | null;
  embedding_hash?: string | null;
  [column: string]: unknown; // คอลัมน์อื่นของ posts (p.*) ที่ส่งต่อให้หน้าเว็บ
}

// ================= SQL ที่ใช้ร่วมกัน =================

// สถานะคำนวณจากวันปิดรับสมัคร
const POST_SELECT = `
  SELECT p.*, c.company_name, c.logo_image,
         CASE WHEN p.application_dates < NOW() THEN 'closed' ELSE 'Open' END AS status
  FROM posts p
  LEFT JOIN company c ON p.company_id = c.company_id`;

async function runQuery(sql: string, params: string[]): Promise<PostRow[]> {
  const [rows] = (await db.query(sql, params)) as [PostRow[], unknown];
  return rows;
}

// ต่อเงื่อนไขเป็น WHERE (ถ้าไม่มีเงื่อนไขเลยคืนค่าว่าง)
function toWhere(conditions: string[]): string {
  if (conditions.length === 0) return "";
  return `WHERE ${conditions.join(" AND ")}`;
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

// ข้อความของประกาศงานที่ใช้สร้าง embedding
function buildPostText(post: PostRow): string {
  return [
    post.job_position,
    post.company_name,
    post.province,
    post.work_location,
    post.job_type,
    post.job_description,
    post.preferred_qualifications,
  ]
    .filter(Boolean)
    .join(" ");
}

// อ่าน embedding ที่บันทึกไว้ ใช้ได้เฉพาะเมื่อประกาศยังไม่ถูกแก้หลังบันทึก (hash ตรงกัน)
// คอลัมน์เป็นชนิด JSON จึงได้ค่ามาเป็น array อยู่แล้ว
function readSavedVector(post: PostRow, text: string): number[] | null {
  if (!Array.isArray(post.embedding)) return null;
  if (post.embedding_hash !== hashOf(text)) return null;
  return post.embedding;
}

// เตรียม embedding ของทุกประกาศ: ใช้ค่าที่บันทึกไว้ ถ้าไม่มีให้คำนวณใหม่แล้วบันทึกเก็บไว้
// ประกาศที่เกินโควตา MAX_LIVE_EMBED จะได้ null (คิดคะแนนจากคำสำคัญอย่างเดียว)
async function getPostVectors(posts: PostRow[]): Promise<(number[] | null)[]> {
  const vectors: (number[] | null)[] = [];
  const needNew: number[] = []; // ลำดับ (index) ของประกาศที่ต้องคำนวณใหม่

  for (let i = 0; i < posts.length; i++) {
    const saved = readSavedVector(posts[i], buildPostText(posts[i]));
    vectors.push(saved);
    if (saved === null && needNew.length < MAX_LIVE_EMBED) {
      needNew.push(i);
    }
  }

  if (needNew.length === 0) return vectors;

  const texts = needNew.map((i) => buildPostText(posts[i]));
  const newVectors = await getEmbeddings(texts);

  for (let k = 0; k < needNew.length; k++) {
    const post = posts[needNew[k]];
    vectors[needNew[k]] = newVectors[k];

    // บันทึกไว้ใช้ครั้งหน้า (ไม่ต้องรอให้เสร็จ)
    db.query("UPDATE posts SET embedding = ?, embedding_hash = ? WHERE post_id = ?", [
      JSON.stringify(newVectors[k]),
      hashOf(texts[k]),
      post.post_id,
    ]).catch((err) => console.error("Save post embedding failed:", err));
  }

  return vectors;
}

// คะแนนคำสำคัญ: เจอคำค้นทั้งก้อนได้คะแนนมาก เจอทีละคำได้คะแนนน้อยกว่า
function keywordScore(post: PostRow, query: string, words: string[]): number {
  const position = normalizeText(post.job_position);
  const company = normalizeText(post.company_name);
  const province = normalizeText(post.province);
  const location = normalizeText(post.work_location);
  const jobType = normalizeText(post.job_type);
  const description = normalizeText(post.job_description);

  let score = 0;
  if (position.includes(query)) score += 0.8;
  if (company.includes(query)) score += 0.6;
  if (province.includes(query) || location.includes(query)) score += 0.5;
  if (jobType.includes(query)) score += 0.4;
  if (description.includes(query)) score += 0.3;

  for (const word of words) {
    if (position.includes(word)) score += 0.3;
    if (company.includes(word)) score += 0.2;
    if (province.includes(word) || location.includes(word)) score += 0.2;
    if (jobType.includes(word)) score += 0.15;
  }
  return score;
}

// ความคล้ายเชิงความหมายระหว่างคำค้นกับประกาศ (ประกาศที่ไม่มี embedding = 0)
function similarityOf(queryVector: number[], postVector: number[] | null): number {
  if (postVector === null) return 0;
  return cosineSimilarity(queryVector, postVector);
}

// คะแนนเพิ่มจากความคล้ายเชิงความหมาย
function vectorScore(similarity: number): number {
  if (similarity <= VECTOR_THRESHOLD) return 0;
  return (similarity - VECTOR_THRESHOLD) * VECTOR_WEIGHT;
}

// ================= API =================

export async function GET(request: NextRequest) {
  try {
    // ---------- 1. อ่านค่าจาก URL ----------
    const params = new URL(request.url).searchParams;
    const rawQuery = params.get("q")?.trim() || "";
    const jobType = params.get("job_type") || "";
    const province = params.get("province") || "";
    const status = (params.get("status") || "").toLowerCase();

    // ---------- 2. เงื่อนไขกรอง ----------
    const where: string[] = [];
    const whereParams: string[] = [];

    if (jobType) {
      where.push("p.job_type = ?");
      whereParams.push(jobType);
    }
    if (province) {
      where.push("(p.province = ? OR p.work_location LIKE ?)");
      whereParams.push(province, `%${province}%`);
    }
    if (status === "open") {
      where.push("(p.application_dates >= NOW() OR p.application_dates IS NULL)");
    }
    if (status === "closed") {
      where.push("p.application_dates < NOW()");
    }

    // ---------- 3. ไม่มีคำค้นหา: ส่งประกาศล่าสุดตามตัวกรอง ----------
    if (!rawQuery) {
      const latest = await runQuery(
        `${POST_SELECT} ${toWhere(where)}
         ORDER BY p.created_at DESC LIMIT ${LATEST_LIMIT}`,
        whereParams,
      );
      return NextResponse.json({ success: true, posts: omitEmbeddings(latest) });
    }

    // ---------- 4. ค้นด้วยคำสำคัญ ----------
    // แต่ละคำต้องเจอในตำแหน่ง บริษัท สถานที่ ประเภทงาน หรือรายละเอียด อย่างน้อยหนึ่งที่
    const query = normalizeText(rawQuery);
    const words = splitWords(rawQuery);

    const wordConditions: string[] = [];
    const wordParams: string[] = [];
    for (const word of words) {
      wordConditions.push(
        `(LOWER(p.job_position) LIKE ? OR LOWER(c.company_name) LIKE ?
          OR LOWER(p.province) LIKE ? OR LOWER(p.work_location) LIKE ?
          OR LOWER(p.job_type) LIKE ? OR LOWER(p.job_description) LIKE ?)`,
      );
      const like = `%${word}%`;
      wordParams.push(like, like, like, like, like, like);
    }

    const keywordWhere = [...where];
    if (wordConditions.length > 0) {
      keywordWhere.push(`(${wordConditions.join(" OR ")})`);
    }

    let candidates = await runQuery(
      `${POST_SELECT} ${toWhere(keywordWhere)} LIMIT ${MAX_CANDIDATES}`,
      [...whereParams, ...wordParams],
    );

    // ---------- 5. ไม่เจอด้วยคำสำคัญ: ให้ความคล้ายเชิงความหมายหาแทน ----------
    const isFallback = candidates.length === 0;
    if (isFallback) {
      candidates = await runQuery(
        `${POST_SELECT} ${toWhere([...where, "p.embedding IS NOT NULL"])}
         ORDER BY p.created_at DESC LIMIT ${MAX_CANDIDATES}`,
        whereParams,
      );
    }

    if (candidates.length === 0) {
      return NextResponse.json({ success: true, posts: [] });
    }

    // ---------- 6. คิดคะแนน = คะแนนคำสำคัญ + คะแนนความหมาย ----------
    const queryVector = await getEmbedding(rawQuery);
    const postVectors = await getPostVectors(candidates);

    const results = [];
    for (let i = 0; i < candidates.length; i++) {
      const post = candidates[i];
      const similarity = similarityOf(queryVector, postVectors[i]);

      // ค้นสำรองด้วยความหมาย: ไม่มีคะแนนคำสำคัญ จึงคัดด้วยค่าความคล้ายแทน
      if (isFallback && similarity < FALLBACK_MIN_SIMILARITY) continue;

      const score = keywordScore(post, query, words) + vectorScore(similarity);
      if (!isFallback && score < MIN_SCORE) continue;

      // ส่งกลับทุกคอลัมน์ของประกาศ ยกเว้น embedding
      results.push({ ...omitEmbedding(post), matchScore: Number(score.toFixed(4)) });
    }

    // ---------- 7. เรียงคะแนนมากไปน้อย ----------
    results.sort((a, b) => b.matchScore - a.matchScore);

    const limit = isFallback ? FALLBACK_MAX_RESULTS : MAX_RESULTS;
    return NextResponse.json({ success: true, posts: results.slice(0, limit) });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในระบบ" },
      { status: 500 },
    );
  }
}
