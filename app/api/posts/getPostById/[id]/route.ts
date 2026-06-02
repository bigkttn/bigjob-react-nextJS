import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = await params; // ดึง post_id จาก URL
        const post_id = id; // ตัวอย่าง post_id ที่คุณต้องการดึงข้อมูล

        const sql = `SELECT posts.*, company.company_name, company.logo_image
                        FROM posts 
                        JOIN company ON posts.company_id = company.company_id WHERE posts.post_id = ?`; // ตัวอย่าง SQL ที่คุณต้องการใช้
        const [posts]: any = await db.query(sql, [post_id]); // แทนที่ ? ด้วยค่า post_id ที่ต้องการ

        if (posts.length === 0) {
            return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        }

        return NextResponse.json(posts[0], { status: 200 });

    } catch (error) {
        // ถ้า Token หมดอายุหรือผิดพลาด ให้มองว่าไม่ได้ล็อกอิน
        return NextResponse.json({ user: null }, { status: 200 });
    }
}