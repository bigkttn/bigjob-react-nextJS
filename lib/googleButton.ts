// ปุ่ม Google Sign-In รับความกว้างเป็นพิกเซลตายตัว (Google กำหนดช่วง 200–400)
// คำนวณจากความกว้างจริงของกล่องที่ใส่ปุ่ม เพื่อไม่ให้ปุ่มล้นจอมือถือ
const GOOGLE_BUTTON_MIN_WIDTH = 200;
const GOOGLE_BUTTON_MAX_WIDTH = 350;

export function getGoogleButtonWidth(container: HTMLElement | null): string {
  const available = container?.clientWidth || GOOGLE_BUTTON_MAX_WIDTH;
  const width = Math.min(GOOGLE_BUTTON_MAX_WIDTH, available);
  return String(Math.max(GOOGLE_BUTTON_MIN_WIDTH, width));
}
