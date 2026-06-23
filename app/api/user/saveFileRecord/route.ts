// ตัวอย่างโค้ดภายใน app/api/user/saveFileRecord/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db'; // ปรับ path ตามจริงของคุณ

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { user_id, file_path, file_name, file_type, file_category } = body;

        // ตรวจสอบค่าที่จำเป็น
        if (!user_id || !file_path) {
            return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
        }

        // เขียนคำสั่ง INSERT ลงตารางข้อมูลของคุณ (ตัวอย่างตารางชื่อ files)
        const [result] = await db.query(
            `INSERT INTO files (user_id, file_path, file_name, file_type, file_category) 
             VALUES (?, ?, ?, ?, ?)`,
            [user_id, file_path, file_name, file_type, file_category]
        );

        return NextResponse.json({ success: true, message: 'บันทึกสำเร็จ' }, { status: 200 });

    } catch (error: any) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์', details: error.message }, { status: 500 });
    }
}