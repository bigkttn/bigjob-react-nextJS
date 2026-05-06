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