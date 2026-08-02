import { pipeline } from "@xenova/transformers";

let extractorPipeline: any = null;

export async function getEmbedding(text: string): Promise<number[]> {
    if (!extractorPipeline) {
        // โหลดโมเดลสำหรับเปลี่ยนข้อความเป็น Vector (รองรับภาษาอังกฤษและไทยได้ดี) 
        extractorPipeline = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    }

    // แปลงข้อความให้เป็น Vector Array
    const output = await extractorPipeline(text, { pooling: "mean", normalize: true });
    return Array.from(output.data);
}

// ฟังก์ชันคำนวณความใกล้เคียงระหว่าง Vector 2 ตัว (ผลลัพธ์ 0 ถึง 1)
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

    if (normA === 0 || normB === 0) return 0;
    // const similarity = dotProduct / (normA * normB);
    // console.log(`Cosine Similarity: ${similarity}`);
    return dotProduct / (normA * normB);
}