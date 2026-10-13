// กฎการเลื่อนนัดสัมภาษณ์: ทั้งผู้สมัครและบริษัทต้องเลื่อนนัดก่อนวันสัมภาษณ์เดิมอย่างน้อย 7 วัน
// ใช้ร่วมกันทั้ง API (update-status) และหน้า seeker_tracking / company_tracking

export const RESCHEDULE_MIN_DAYS = 7;

export const RESCHEDULE_RULE_TEXT = `เลื่อนนัดได้เฉพาะก่อนวันสัมภาษณ์อย่างน้อย ${RESCHEDULE_MIN_DAYS} วัน`;

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

// นับเป็นวันตามปฏิทิน: นัดวันที่ 20 เลื่อนได้ถึงวันที่ 13
export function canReschedule(
  interviewDate: Date | string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!interviewDate) return true;

  const appointment = new Date(interviewDate);
  if (Number.isNaN(appointment.getTime())) return true;

  const daysLeft = Math.round((startOfDay(appointment) - startOfDay(now)) / DAY_MS);
  return daysLeft >= RESCHEDULE_MIN_DAYS;
}
