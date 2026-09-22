import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const secret = process.env.JWT_SECRET || 'fallback_secret';

// ฟังก์ชันสำหรับสร้าง Session และบันทึกลง Cookie
export async function createSession(payload: Record<string, unknown>) {
    //  สร้าง Token มีอายุ 1 วัน
    const token = jwt.sign(payload, secret, { expiresIn: '1d' });

    //  บันทึก Token ลงใน Cookie
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 1 วัน
        path: '/',
    });
}

// (แถม) ฟังก์ชันสำหรับลบ Session ตอน Logout
export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete('session');
}

// ฟังก์ชันสำหรับต่ออายุ Session (Rolling Session)
export async function updateSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) return;

    try {
        // ตรวจสอบ Token เดิม (ถ้าหมดอายุแล้วจะ error และไม่ทำงานต่อ)
        const payload = jwt.verify(token, secret) as jwt.JwtPayload;

        // นำข้อมูลเดิมมาสร้าง Token ใหม่ (ตัด exp เดิมทิ้งเพื่อให้สร้างใหม่ได้)
        const { iat, exp, ...newPayload } = payload;
        
        const newToken = jwt.sign(newPayload, secret, { expiresIn: '1d' });

        // เซ็ต Cookie ใหม่ ต่ออายุไปอีก 1 วัน
        cookieStore.set('session', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 1 วัน
            path: '/',
        });
    } catch (error) {
        // ถ้า Token หมดอายุหรือพัง ก็ลบทิ้งไปเลย
        console.error("Failed to update session:", error);
        cookieStore.delete('session');
    }
}