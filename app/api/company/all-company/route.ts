import { NextResponse } from 'next/server';
import db from '@/lib/db'; // อ้างอิงไฟล์ db ของคุณ

export async function GET() {
    try {
        const sql = 'SELECT * FROM `posts`';
        const [companies]: any = await db.query(sql);
        return NextResponse.json({ companies }, { status: 200 });

    } catch (error) {
        // ถ้า Token หมดอายุหรือผิดพลาด ให้มองว่าไม่ได้ล็อกอิน
        return NextResponse.json({ user: null }, { status: 200 });
    }
}