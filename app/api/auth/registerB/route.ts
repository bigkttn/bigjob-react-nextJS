import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import bcrypt from 'bcryptjs';
import { createSession } from "@/lib/session";
import { otpStore } from "@/lib/otpStore";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { email, password, userType, fullname, company_name, business_type, contact_name, mobile_phone, otpCode } = body;

        //  1. เริ่มส่วนตรวจสอบ OTP (เอาโค้ดที่เคยส่งมาปรับใช้)
        const storedOtpData = otpStore.get(email);

        if (!storedOtpData) {
            return NextResponse.json({ message: 'รหัส OTP ไม่ถูกต้อง หรือหมดอายุแล้ว กรุณาขอใหม่' }, { status: 400 });
        }

        //  1.1 เช็คเวลาหมดอายุ
        if (Date.now() > storedOtpData.expires_at) {
            otpStore.delete(email); // ลบทิ้งเลยถ้าหมดเวลา
            return NextResponse.json({ message: 'รหัส OTP หมดอายุแล้ว' }, { status: 400 });
        }

        // 1.2 กันเดาสุ่ม (Brute force) ลองได้ 5 ครั้ง
        if (storedOtpData.attempts >= 5) {
            otpStore.delete(email);
            return NextResponse.json({ message: "คุณกรอกผิดหลายครั้งเกินไป กรุณาขอ OTP ใหม่" }, { status: 429 });
        }

        //  1.3 ถอดรหัสเทียบ OTP ด้วย bcrypt
        const isMatch = await bcrypt.compare(otpCode, storedOtpData.otp_code);

        if (!isMatch) {
            storedOtpData.attempts++; // บวกจำนวนครั้งที่ผิดเข้าไป
            return NextResponse.json({ message: 'รหัส OTP ไม่ถูกต้อง' }, { status: 400 });
        }
        //  จบส่วนตรวจสอบ OTP (ถ้าผ่านจุดนี้ไปได้แปลว่า OTP ถูกต้องชัวร์ 100%)

        // 2. ตรวจสอบข้อมูลบังคับ
        if (!email || !password || !userType) {
            return NextResponse.json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
        }

        // 3. ตรวจสอบอีเมลซ้ำในระบบ
        const [existingUsers]: any = await db.query('SELECT * FROM `User` WHERE email = ?', [email]);
        const [existingCompany]: any = await db.query('SELECT * FROM `company` WHERE company_email = ?', [email]);

        if (existingUsers.length > 0 || existingCompany.length > 0) {
            return NextResponse.json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' }, { status: 400 });
        }

        // 4. เข้ารหัสผ่าน และบันทึกข้อมูล
        const hashedPassword = await bcrypt.hash(password, 10);
        let user, role;
        let sessionId;

        if (userType === 'seeker') {
            const [result]: any = await db.query(
                'INSERT INTO `User` (email, password, fullname, role) VALUES (?, ?, ?, ?)',
                [email, hashedPassword, fullname, 'seeker']
            );
            const [newUser]: any = await db.query('SELECT * FROM `User` WHERE uid = ?', [result.insertId]);
            user = newUser[0];
            role = 'seeker';
            sessionId = user.uid;

        } else if (userType === 'company') {
            const [result]: any = await db.query(
                `INSERT INTO company (company_email, mobile_phone, company_name, business_type, contact_information, company_password, verification_status)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [email, mobile_phone, company_name, business_type, contact_name, hashedPassword, 'pending']
            );
            const [newCompany]: any = await db.query('SELECT * FROM company WHERE company_id = ?', [result.insertId]);
            user = newCompany[0];
            role = 'company';
            sessionId = user.company_id;
        }

        // 5. สร้าง Session
        await createSession({ id: sessionId, email: email, role: role });

        // 🧹 6. เคลียร์ OTP ทิ้งหลังจากสมัครสมาชิกสำเร็จแล้ว! (สำคัญมาก ป้องกันคนเอารหัสเดิมมาใช้ซ้ำ)
        otpStore.delete(email);

        return NextResponse.json({
            message: 'ลงทะเบียนสำเร็จ',
            user: { ...user, role }
        }, { status: 201 });

    } catch (error) {
        console.error('Error in registration:', error);
        return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการลงทะเบียน' }, { status: 500 });
    }
}