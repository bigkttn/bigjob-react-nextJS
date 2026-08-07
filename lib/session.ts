import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const secret = process.env.JWT_SECRET || 'fallback_secret';

// ฟังก์ชันสำหรับสร้าง Session และบันทึกลง Cookie
export async function createSession(payload: any) {
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