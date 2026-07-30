import { NextResponse } from 'next/server';
import db from '@/lib/db'; // อ้างอิงไฟล์ db ของคุณ

export async function GET() {
    try {
        const sql = `SELECT posts.*, company.company_name,
                                     company.logo_image,
                                     company.full_address,
                                     company.province,
                CASE 
                    WHEN application_dates < NOW() THEN 'closed'
                    ELSE 'Open'  
                END AS status
                     FROM posts
                     JOIN company ON posts.company_id = company.company_id`;
        const [posts]: any = await db.query(sql);
        return NextResponse.json({ posts }, { status: 200 });

    } catch (error) {
        // ถ้า Token หมดอายุหรือผิดพลาด ให้มองว่าไม่ได้ล็อกอิน
        return NextResponse.json({ user: null }, { status: 200 });
    }
}