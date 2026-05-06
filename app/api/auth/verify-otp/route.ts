import { NextRequest, NextResponse } from "next/server";
import { otpStore } from "@/lib/otpStore";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    try {
        const { email, otp } = await req.json();

        const data = otpStore.get(email);

        if (!data) {
            return NextResponse.json({ message: "OTP ไม่ถูกต้อง" }, { status: 400 });
        }

        // ⏰ หมดอายุ
        if (Date.now() > data.expires_at) {
            otpStore.delete(email);
            return NextResponse.json({ message: "OTP หมดอายุ" }, { status: 400 });
        }

        // 🚫 กัน brute force (ลองได้ 5 ครั้ง)
        if (data.attempts >= 5) {
            otpStore.delete(email);
            return NextResponse.json(
                { message: "ลองผิดหลายครั้งเกินไป" },
                { status: 429 }
            );
        }

        const isMatch = await bcrypt.compare(otp, data.otp_code);

        if (!isMatch) {
            data.attempts++;
            return NextResponse.json(
                { message: "OTP ไม่ถูกต้อง" },
                { status: 400 }
            );
        }

        return NextResponse.json({ message: "OTP ถูกต้อง" });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}