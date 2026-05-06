import { NextRequest, NextResponse } from "next/server";
import { otpStore } from "@/lib/otpStore"; // นำเข้า temp table ของเรา
import nodemailer from "nodemailer";
import { rateLimit } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";

// ตั้งค่า Email Transporter (ใส่ค่าของคุณ)
const transporter = nodemailer.createTransport({
    service: 'gmail', // หรือ SMTP ที่คุณใช้งาน
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export async function POST(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';

    if (!rateLimit(ip, 5, 60_000)) { // จำกัด 5 ครั้งต่อ 1 นาที
        return NextResponse.json({ message: 'คุณส่งคำขอมากเกินไป กรุณาลองใหม่อีกครั้งในภายหลัง' }, { status: 429 });

    }
    try {
        const body = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ message: 'กรุณาระบุอีเมล' }, { status: 400 });
        }

        // สุ่ม OTP 6 หลัก
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 นาที

        const otpHash = await bcrypt.hash(otp, 10);
        // 1. บันทึกเก็บไว้ใน Memory Map (แทน Database)
        otpStore.set(email, {
            otp_code: otpHash,
            expires_at: expiresAt,
            attempts: 0,
        });

        // 2. ส่งอีเมล
        await transporter.sendMail({
            from: '"BIGJOBs Support" <kittichetbig@gmail.com>',
            to: email,
            subject: 'รหัสยืนยันตัวตน (OTP) - BIGJOBs',
            html: `<div style="font-family:Arial,sans-serif;padding:20px;">
                    <h2>รหัสยืนยันตัวตนของคุณ</h2>
                    <h1 style="color:#0d6efd;letter-spacing:5px;">${otp}</h1>
                    <p style="color:gray;">รหัสนี้จะหมดอายุภายใน 5 นาที</p>
                  </div>`
        });

        // 3. ตั้งเวลาลบทิ้งเมื่อครบ 5 นาที (เพื่อเคลียร์ Memory)
        setTimeout(() => {
            // เช็คก่อนลบ เผื่อเขากดขอใหม่ รหัสจะเปลี่ยนไปแล้ว
            const currentData = otpStore.get(email);
            if (currentData && currentData.otp_code === otpHash) {
                otpStore.delete(email);
            }
        }, 5 * 60 * 1000);

        return NextResponse.json({ message: 'ส่ง OTP สำเร็จ' }, { status: 200 });

    } catch (error: any) {
        console.error('Error sending OTP:', error);
        return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการส่ง OTP', error: error.message }, { status: 500 });
    }
}