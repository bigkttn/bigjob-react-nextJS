// กฎรหัสผ่านที่ใช้ร่วมกันทั้งฝั่งหน้าเว็บและ API (สมัครสมาชิก / รีเซ็ตรหัสผ่าน)

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_HINT =
  "อย่างน้อย 8 ตัวอักษร และห้ามใช้อีเมลเป็นรหัสผ่าน";

// ชื่อหน้า @ ที่สั้นกว่านี้ไม่ตรวจว่าอยู่ในรหัสผ่าน (กันกรณีอย่าง a@x.com ทำให้รหัสเกือบทุกแบบใช้ไม่ได้)
const MIN_LOCAL_PART_TO_CHECK = 3;

// คืนข้อความ error ถ้ารหัสผ่านไม่ผ่านกฎ, คืน "" ถ้าผ่าน
export function validatePassword(password: string, email: string): string {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `รหัสผ่านต้องมีอย่างน้อย ${PASSWORD_MIN_LENGTH} ตัวอักษร`;
  }
  const lowerPassword = password.toLowerCase();
  const lowerEmail = email.trim().toLowerCase();
  if (lowerEmail && lowerPassword === lowerEmail) {
    return "ห้ามใช้อีเมลเป็นรหัสผ่าน";
  }

  const localPart = lowerEmail.split("@")[0];
  if (localPart.length >= MIN_LOCAL_PART_TO_CHECK && lowerPassword.includes(localPart)) {
    return "รหัสผ่านต้องไม่มีชื่ออีเมลของคุณอยู่ในรหัสผ่าน";
  }

  return "";
}
