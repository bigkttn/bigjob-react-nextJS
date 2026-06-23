import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { createSession } from '@/lib/session';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ message: 'กรุณากรอกอีเมลและรหัสผ่าน' }, { status: 400 });
        }

        let user = null;
        let role = '';

        // 1. ค้นหาในตาราง User
        const userSql = 'SELECT * FROM `User` WHERE email = ?';
        const [users]: any = await db.query(userSql, [email]);

        if (users.length > 0) {
            user = users[0];
            // 🎯 แก้ไข: ดึงสิทธิ์จากคอลัมน์ role ใน DB จริง (เช่น admin, seeker) ไม่ฮาร์ดโค้ดเป็น seeker อย่างเดียว
            role = user.role || 'seeker';
        } else {
            // 2. ค้นหาในตาราง company
            const companySql = 'SELECT * FROM `company` WHERE company_email = ?';
            const [companies]: any = await db.query(companySql, [email]);

            if (companies.length > 0) {
                user = companies[0];
                role = 'company';
            }
        }

        // ถ้าไม่พบอีเมลในทั้งสองตาราง
        if (!user) {
            return NextResponse.json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
        }

        // 🚨 --- ตรวจสอบสถานะการแบน (Banned Check) ---
        if (user.banned_until) {
            const banEndDate = new Date(user.banned_until);
            const currentDate = new Date();

            if (banEndDate > currentDate) {
                const formattedBanDate = banEndDate.toLocaleString('th-TH');
                return NextResponse.json({
                    message: `บัญชีของคุณถูกระงับการใช้งานจนถึง ${formattedBanDate}`
                }, { status: 403 });
            }
        }

        // 3. ตรวจสอบรหัสผ่าน
        const dbPassword = role === 'company' ? user.company_password : user.password;
        const isMatch = await bcrypt.compare(password, dbPassword);

        if (!isMatch) {
            return NextResponse.json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
        }

        // ลบรหัสผ่านทิ้งก่อนส่งกลับเพื่อความปลอดภัย
        if (role === 'company') {
            delete user.company_password;
        } else {
            delete user.password;
        }

        // 🔐 สร้าง Session ให้ตรงกับ ID ของแต่ละตาราง
        const sessionPayload = {
            id: role === 'company' ? user.company_id : user.uid,
            email: role === 'company' ? user.company_email : user.email,
            role: role
        };

        await createSession(sessionPayload);

        return NextResponse.json({
            message: 'เข้าสู่ระบบสำเร็จ',
            user: { ...user, role }
        }, { status: 200 });

    } catch (error: any) {
        console.error('Login Error:', error);
        return NextResponse.json({ message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' }, { status: 500 });
    }
}