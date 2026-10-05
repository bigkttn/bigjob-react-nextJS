import { ref, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase";

// เช็กว่า URL เป็นไฟล์ใน Firebase Storage ของโปรเจกต์นี้
// (ข้ามค่าว่าง, รูป ui-avatars, รูปจาก Google ฯลฯ)
function isOwnStorageUrl(url: string): boolean {
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!url || !bucket) return false;
  return (
    url.startsWith("https://firebasestorage.googleapis.com/") &&
    url.includes(`/b/${bucket}/`)
  );
}

// ลบไฟล์ใน Firebase จาก download URL
// ถ้าลบไม่ได้จะแค่ log ไว้ ไม่ throw เพราะงานหลัก (บันทึก DB) สำเร็จไปแล้ว
export async function deleteStorageFile(
  url: string | null | undefined,
): Promise<void> {
  if (!url || !isOwnStorageUrl(url)) return;

  try {
    await deleteObject(ref(storage, url));
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === "storage/object-not-found") return;
    console.warn("ลบไฟล์ใน Firebase ไม่สำเร็จ", err);
  }
}
