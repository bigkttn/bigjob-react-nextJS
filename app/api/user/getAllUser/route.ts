import { NextResponse } from 'next/server';
import db from '@/lib/db'; // อ้างอิงไฟล์ db ของคุณ

export async function GET() {
    try {
        const sql = `SELECT * FROM User`;
        const [users]: any = await db.query(sql);
        return NextResponse.json({ users }, { status: 200 });

    } catch (error) {
        // ถ้า Token หมดอายุหรือผิดพลาด ให้มองว่าไม่ได้ล็อกอิน
        return NextResponse.json({ users: null }, { status: 200 });
    }
}