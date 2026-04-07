import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import db from '@/lib/db';
import { createSession } from '@/lib/session'; // 👈 Import ฟังก์ชันสร้าง Session

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { token } = body;

        if (!token) return NextResponse.json({ message: 'ไม่พบ Token' }, { status: 400 });

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const googleEmail = payload?.email;

        let user = null;
        let role = '';

        // 1. ค้นหาใน User
        const userSql = 'SELECT * FROM `User` WHERE email = ?';
        const [users]: any = await db.query(userSql, [googleEmail]);

        if (users.length > 0) {
            user = users[0];
            role = 'seeker';
        } else {
            // 2. ค้นหาใน company
            const companySql = 'SELECT * FROM `company` WHERE company_email = ?';
            const [companies]: any = await db.query(companySql, [googleEmail]);

            if (companies.length > 0) {
                user = companies[0];
                role = 'company';
            }
        }

        if (!user) {
            return NextResponse.json({ message: 'ไม่พบข้อมูลบัญชี กรุณาสมัครสมาชิกก่อน' }, { status: 404 });
        }

        // ลบรหัสผ่านออกก่อนทำอย่างอื่น (ถ้ามี)
        if (role === 'company' && user.company_password) delete user.company_password;
        if (role === 'seeker' && user.password) delete user.password;

        // -----------------------------------------------------
        // 🔐 สร้าง Session สำหรับ Google Login
        // -----------------------------------------------------
        const sessionPayload = {
            id: role === 'company' ? user.company_id : user.uid,
            email: role === 'company' ? user.company_email : user.email,
            role: role
        };

        // เรียกใช้ฟังก์ชันที่แยกไว้ บรรทัดเดียวจบ!
        await createSession(sessionPayload);
        // -----------------------------------------------------

        return NextResponse.json({
            message: 'เข้าสู่ระบบด้วย Google สำเร็จ',
            user: { ...user, role }
        }, { status: 200 });

    } catch (error: any) {
        console.error('Google Auth Error:', error);
        return NextResponse.json({ message: 'การยืนยันตัวตนล้มเหลว' }, { status: 401 });
    }
}