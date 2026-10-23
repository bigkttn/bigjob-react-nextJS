// API ประกาศงาน (/api/posts/*) เปิดให้เรียกได้โดยไม่ต้อง login (ดู proxy.ts)
// ตัวนี้หา company id ที่จะใช้กับโพสต์
// - login อยู่: ต้องเป็นบริษัท และใช้ id จาก session
// - ไม่ได้ login: ใช้ company_id ที่ส่งมากับ request
import { getSessionUser } from "@/lib/auth";

type CompanyIdResult =
  | { ok: true; companyId: number }
  | { ok: false; message: string; status: number };

export async function resolveCompanyId(requestCompanyId: unknown): Promise<CompanyIdResult> {
  const user = await getSessionUser();

  if (user) {
    if (user.role !== "company") {
      return { ok: false, message: "ไม่มีสิทธิ์ดำเนินการนี้", status: 403 };
    }
    return { ok: true, companyId: user.id };
  }

  const companyId = Number(requestCompanyId);
  if (!Number.isInteger(companyId) || companyId <= 0) {
    return { ok: false, message: "กรุณาส่ง company_id หรือเข้าสู่ระบบ", status: 400 };
  }
  return { ok: true, companyId };
}
