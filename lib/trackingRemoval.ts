// การลบรายการติดตามสถานะ: ไม่ลบแถวในฐานข้อมูล แต่เปลี่ยน interview_tracking.status
//   ผู้สมัครลบ      -> "user removed"
//   บริษัทลบ        -> "company removed"
//   ลบครบทั้งสองฝั่ง -> "all removed"
// ใช้ร่วมกันทั้ง API (remove-tracking) และหน้า seeker_tracking / company_tracking

export type TrackingSide = "seeker" | "company";

export const STATUS_USER_REMOVED = "user removed";
export const STATUS_COMPANY_REMOVED = "company removed";
export const STATUS_ALL_REMOVED = "all removed";

// ลบได้เฉพาะรายการที่ไม่ผ่านพิจารณา หรือถูกยกเลิกไปแล้ว
const CLOSED_STATUSES = ["reject", "rejected", "cancel", "canceled", "cancelled"];

function normalize(status?: string): string {
  return (status ?? "").trim().toLowerCase();
}

// สถานะใหม่หลังฝั่งนี้กดลบ หรือ null ถ้ารายการนี้ลบไม่ได้
export function getStatusAfterRemove(
  side: TrackingSide,
  status?: string,
): string | null {
  const current = normalize(status);

  if (CLOSED_STATUSES.includes(current)) {
    return side === "seeker" ? STATUS_USER_REMOVED : STATUS_COMPANY_REMOVED;
  }
  // ไม่มาตามนัดสัมภาษณ์: ให้บริษัทลบได้ฝั่งเดียว (ประวัติผิดนัดยังอยู่ใน report_user)
  if (side === "company" && current === "no_show") return STATUS_COMPANY_REMOVED;
  // อีกฝั่งลบไปก่อนแล้ว: ฝั่งนี้ลบด้วย = ลบครบทั้งสองฝั่ง
  if (side === "seeker" && current === STATUS_COMPANY_REMOVED) return STATUS_ALL_REMOVED;
  if (side === "company" && current === STATUS_USER_REMOVED) return STATUS_ALL_REMOVED;

  return null;
}

export function canRemoveTracking(side: TrackingSide, status?: string): boolean {
  return getStatusAfterRemove(side, status) !== null;
}

// ฝั่งนี้ลบรายการไปแล้ว (ไม่ต้องแสดงในหน้าของฝั่งนี้)
export function isRemovedBy(side: TrackingSide, status?: string): boolean {
  const current = normalize(status);
  if (current === STATUS_ALL_REMOVED) return true;
  if (side === "seeker") return current === STATUS_USER_REMOVED;
  return current === STATUS_COMPANY_REMOVED;
}
