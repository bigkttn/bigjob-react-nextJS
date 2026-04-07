import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('session')?.value;

        // ถ้าไม่มี Token แปลว่าไม่ได้ล็อกอิน
        if (!token) {
            return NextResponse.json({ user: null }, { status: 200 });
        }

        // ถอดรหัส Token
        const secret = process.env.JWT_SECRET || 'fallback_secret';
        const decoded = jwt.verify(token, secret);

        return NextResponse.json({ user: decoded }, { status: 200 });
    } catch (error) {
        // ถ้า Token หมดอายุหรือผิดพลาด ให้มองว่าไม่ได้ล็อกอิน
        return NextResponse.json({ user: null }, { status: 200 });
    }
}