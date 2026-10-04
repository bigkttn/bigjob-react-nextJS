// lib/otpStore.ts

export type OtpData = {
    otp_code: string;   // เก็บรหัสที่ผ่านการ Hash แล้ว
    expires_at: number; // เวลาหมดอายุ
    attempts: number;   // จำนวนครั้งที่กรอก (เผื่อใช้กันคนเดารหัส)
};
// 👇 declare global
//  ประกาศตัวแปร globalForOtp เพื่อเชื่อมต่อกับระบบ Global ของ Node.js / Browser
// เราต้องใช้ "as unknown as" เพื่อหลบเลี่ยงการตรวจ Type ของ TypeScript ในขั้นตอนนี้
const globalForOtp = globalThis as unknown as {
    otpStore: Map<string, OtpData> | undefined;
};

// สร้างหรือดึงตัวเก็บข้อมูล (otpStore) ออกมาใช้งาน
export const otpStore =
    globalForOtp.otpStore ?? new Map<string, OtpData>();

// 👇 กันสร้างซ้ำใน dev
if (process.env.NODE_ENV !== "production") {
    globalForOtp.otpStore = otpStore;
}

// ลบ OTP ออกจาก memory เมื่อหมดอายุจริง
// - ถ้าผู้ใช้ขอ OTP ใหม่ (hash เปลี่ยน) หรือถูกลบไปแล้ว ไม่ต้องทำอะไร
// - ถ้า verify-otp ต่อเวลาไปแล้ว ให้รอจนถึงเวลาหมดอายุใหม่แล้วเช็กอีกรอบ
export function scheduleOtpCleanup(email: string, otpHash: string) {
    const data = otpStore.get(email);
    if (!data || data.otp_code !== otpHash) return;

    const remaining = data.expires_at - Date.now();
    if (remaining <= 0) {
        otpStore.delete(email);
        return;
    }

    setTimeout(() => scheduleOtpCleanup(email, otpHash), remaining);
}
