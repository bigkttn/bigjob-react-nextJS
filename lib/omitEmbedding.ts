// ตัดคอลัมน์ vector ของ AI ออกก่อนส่งข้อมูลโพสต์ให้ฝั่ง client
// (หน้าเว็บไม่ได้ใช้ และกินขนาด response ไปเกือบทั้งหมด)
type WithEmbedding = { embedding?: unknown; embedding_hash?: unknown };

export function omitEmbedding<T extends WithEmbedding>(
  row: T,
): Omit<T, "embedding" | "embedding_hash"> {
  const rest = { ...row };
  delete rest.embedding;
  delete rest.embedding_hash;
  return rest;
}

export function omitEmbeddings<T extends WithEmbedding>(rows: T[]) {
  return rows.map(omitEmbedding);
}
