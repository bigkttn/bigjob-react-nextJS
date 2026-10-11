import crypto from "crypto";

export const MODEL_ID = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";

// เก็บเป็น Promise กัน race condition
let extractorPromise: Promise<any> | null = null;

// สร้าง extractor (เรียกใช้ครั้งแรกจะโหลดโมเดล)
function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { pipeline } = await import("@xenova/transformers");
      return await pipeline(
        "feature-extraction",
        MODEL_ID,
        { quantized: true }
      );
    })();
  }
  return extractorPromise;
}

// In-memory cache (LRU จริง)
//  เก็บ embedding ของข้อความที่เคยคำนวณแล้ว (key = hash ของข้อความ, value = vector)
const memCache = new Map<string, number[]>();
const MAX_CACHE = 5000;

export const hashOf = (t: string) =>
  crypto
    .createHash("sha1")
    .update(`${MODEL_ID}::${(t || "").trim()}`)
    .digest("hex");

function getFromCache(key: string): number[] | undefined {
  const val = memCache.get(key);
  if (val) {
    // Refresh LRU order: ลบออกแล้วใส่ใหม่ไว้ท้ายสุด
    memCache.delete(key);
    memCache.set(key, val);
  }
  return val;
}

// ถ้า cache เต็ม ให้ลบรายการแรก (เก่าที่สุด) ออก
function setCache(key: string, vec: number[]) {
  if (memCache.has(key)) {
    memCache.delete(key);
  } else if (memCache.size >= MAX_CACHE) {
    const firstKey = memCache.keys().next().value;
    if (firstKey) memCache.delete(firstKey);
  }
  memCache.set(key, vec);
}

/** embed ข้อความเดียว */
export async function getEmbedding(text: string): Promise<number[]> {
  // ถ้าเป็นข้อความว่าง ให้คืนค่าเป็น array ว่าง
  const clean = (text || "").trim();
  if (!clean) return [];

  // ตรวจสอบ cache ก่อน ดูว่าเคยคำนวณข้อความนี้ไปแล้วหรือยัง ถ้าเคย หยิบผลเดิมมาใช้เลย
  const key = hashOf(clean);
  const cached = getFromCache(key);
  if (cached) return cached;

  // ถ้าไม่เจอใน cache ให้คำนวณ embedding ใหม่
  const extractor = await getExtractor();                                                   //โมเดลนี้เข้าใจหลายภาษารวมถึงภาษาไทย โหลดครั้งแรกครั้งเดียว ครั้งต่อไปใช้ตัวเดิม
  const output = await extractor(clean, { pooling: "mean", normalize: true });              //คือเอาตัวเลขของทุกคำมาหาค่าเฉลี่ย ได้ตัวเลขชุดเดียวแทนทั้งประโยค
  const vec = Array.from(output.data) as number[];                                          //คือปรับขนาดให้เท่ากันทุกประโยค ประโยคยาวหรือสั้นจะได้เทียบกันได้อย่างยุติธรรม

  // บันทึกลง cache
  setCache(key, vec);
  return vec;
}

/** embed หลายข้อความพร้อมกันแบบ batch */
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const results: (number[] | null)[] = texts.map((t) =>
    getFromCache(hashOf(t)) ?? null
  );

  const missIdx: number[] = [];
  results.forEach((v, i) => {
    if (v === null) missIdx.push(i);
  });

  if (missIdx.length > 0) {
    const extractor = await getExtractor();
    const BATCH = 16;

    for (let i = 0; i < missIdx.length; i += BATCH) {
      const slice = missIdx.slice(i, i + BATCH);
      const inputs = slice.map((j) => (texts[j] || " ").trim() || " ");

      const output = await extractor(inputs, {
        pooling: "mean",
        normalize: true,
        padding: true,
        truncation: true,
      });

      const dim = output.dims[output.dims.length - 1];
      slice.forEach((j, k) => {
        const vec = Array.from(
          output.data.slice(k * dim, (k + 1) * dim)
        ) as number[];
        setCache(hashOf(inputs[k]), vec);
        results[j] = vec;
      });
    }
  }

  return results as number[][];
}

/** Cosine Similarity */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA?.length || !vecB?.length || vecA.length !== vecB.length) return 0;
  let dot = 0;
  for (let i = 0; i < vecA.length; i++) dot += vecA[i] * vecB[i];
  return dot;
}

/** อุ่นเครื่องโมเดล (เรียกใช้เฉพาะตอนต้องการ Manual Warmup) */
export async function warmup() {
  try {
    await getEmbedding("warmup");
    /* console.log("[embedding] model ready") */;
  } catch (e) {
    console.error("[embedding] warmup failed", e);
  }
}