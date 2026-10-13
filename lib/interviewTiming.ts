// ช่วงเวลาหลังเวลานัดที่ถือว่าสัมภาษณ์เสร็จแล้ว
// ก่อนหน้านี้แสดงการ์ดนัดสัมภาษณ์ หลังจากนี้จึงแสดงการ์ดผลการพิจารณา / เสนองาน
// ใช้ร่วมกันทั้ง API (update-status) และหน้า seeker_tracking / company_tracking

export const INTERVIEW_DURATION_MINUTES = 30;

const MINUTE_MS = 60 * 1000;

export function getInterviewEnd(interviewDate: Date | string): Date {
  return new Date(new Date(interviewDate).getTime() + INTERVIEW_DURATION_MINUTES * MINUTE_MS);
}

// ไม่มีวันนัด = ยังสัมภาษณ์ไม่เสร็จ
export function isInterviewOver(
  interviewDate: Date | string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!interviewDate) return false;

  const end = getInterviewEnd(interviewDate);
  if (Number.isNaN(end.getTime())) return false;

  return now.getTime() >= end.getTime();
}
