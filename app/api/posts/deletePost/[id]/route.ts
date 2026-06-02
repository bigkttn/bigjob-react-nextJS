import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = await params; // ดึง post_id จาก URL
        const post_id = id; // ตัวอย่าง post_id ที่คุณต้องการลบข้อมูล
        const sql = `DELETE FROM posts WHERE post_id = ?`; // ตัวอย่าง SQL ที่คุณต้องการใช้
        await db.query(sql, [post_id]); // แทนที่ ? ด้วยค่า post_id ที่ต้องการ
        return NextResponse.json({ message: 'Post deleted successfully' }, { status: 200 });
    }
    catch (error) {
        // ถ้า Token หมดอายุหรือผิดพลาด ให้มองว่าไม่ได้ล็อกอิน
        return NextResponse.json({ user: null }, { status: 200 });
    }
}
