import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/session'; // หรือถ้าไม่ได้สร้างฟังก์ชันไว้ ให้ใช้ cookies().delete('session')

export async function POST() {
    try {
        await deleteSession(); // ลบ Cookie
        return NextResponse.json({ message: 'ออกจากระบบสำเร็จ' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
    }
}