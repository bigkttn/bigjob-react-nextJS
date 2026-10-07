// กฎการเปลี่ยนสถานะใบสมัคร (interview_tracking.status)
// key = สถานะปัจจุบัน, value = สถานะที่เปลี่ยนไปได้ ฝั่งไหนกดได้อะไรดูจากปุ่มในหน้า seeker_tracking / company_tracking

export type TrackingActor = "seeker" | "company";

const SEEKER_TRANSITIONS: Record<string, string[]> = {
  pending: ["applied", "reject"], // ตอบรับ / ปฏิเสธคำเชิญจากบริษัท
  applied: ["cancel"],
  screening: ["interview", "reject", "reschedule"], // ยืนยันนัด / ปฏิเสธ / ขอเลื่อนนัด
  interview: ["cancel", "reschedule"],
  reschedule: ["cancel"],
  appointment: ["hired", "reject"], // ตอบรับ / ปฏิเสธข้อเสนองาน
  offer: ["hired", "reject"],
};

const COMPANY_TRANSITIONS: Record<string, string[]> = {
  pending: ["reject"],
  applied: ["screening", "reject"], // นัดสัมภาษณ์
  screening: ["screening", "reject"], // เลื่อนนัด
  interview: ["screening", "appointment", "reject"], // เลื่อนนัด / ส่งข้อเสนองาน
  reschedule: ["interview", "screening", "reject"], // ตกลงเวลาที่ผู้สมัครเสนอ / กำหนดเวลาอื่น
  appointment: ["reject"],
  offer: ["reject"],
};

export function canChangeStatus(
  actor: TrackingActor,
  from: string,
  to: string,
): boolean {
  const rules = actor === "seeker" ? SEEKER_TRANSITIONS : COMPANY_TRANSITIONS;
  const allowed = rules[from.trim().toLowerCase()] ?? [];
  return allowed.includes(to.trim().toLowerCase());
}
