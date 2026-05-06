import { NextRequest, NextResponse } from "next/server";
import { otpStore } from "@/lib/otpStore";
import db from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    try {
        const { email, otp, newPassword } = await req.json();

        const data = otpStore.get(email);

        if (!data) {
            return NextResponse.json({ message: "OTP ไม่ถูกต้อง" }, { status: 400 });
        }

        if (Date.now() > data.expires_at) {
            otpStore.delete(email);
            return NextResponse.json({ message: "OTP หมดอายุ" }, { status: 400 });
        }

        const isMatch = await bcrypt.compare(otp, data.otp_code);

        if (!isMatch) {
            return NextResponse.json({ message: "OTP ไม่ถูกต้อง" }, { status: 400 });
        }

        // 🔐 hash password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 🔍 2. ตรวจสอบว่าอีเมลนี้อยู่ในตารางไหนกันแน่
        const [userRows]: any = await db.query("SELECT email FROM `User` WHERE email = ?", [email]);

        if (userRows.length > 0) {
            // ถ้าเจอในตาราง User
            await db.query(
                "UPDATE `User` SET password = ? WHERE email = ?",
                [hashedPassword, email]
            );
        } else {
            // ถ้าไม่เจอใน User ให้ไปอัปเดตในตาราง company
            // ตรวจสอบชื่อคอลัมน์ให้ตรงกับในตาราง company (เช่น company_password และ company_email)
            await db.query(
                "UPDATE `company` SET company_password = ? WHERE company_email = ?",
                [hashedPassword, email]
            );
        }

        otpStore.delete(email);

        return NextResponse.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}