import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // ประกาศ Type ให้ params เป็น Promise
) {
    try {
        // แกะค่า id ออกจาก params ด้วยคำสั่ง await 
        const resolvedParams = await params;
        const id = Number(resolvedParams.id);

        // ตรวจสอบกรณีแปลงเป็นตัวเลขไม่ได้ (เช่น เผลอส่งอักษรมาแทนเลข 21)
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
        }

        const [rows]: any = await db.query(
            'SELECT * FROM User WHERE uid = ?',
            [id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json({ user: null }, { status: 404 });
        }

        // ส่งข้อมูลผู้ใช้คนแรกที่พบกลับไป
        return NextResponse.json({ user: rows[0] }, { status: 200 });

    } catch (error) {
        // จะแสดง Log ตัวปัญหานี้บนหน้าจอ Terminal หลังบ้านของคุณ
        console.error('DB error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}