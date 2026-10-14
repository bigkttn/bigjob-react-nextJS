import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getTrackingContact } from '../trackingContext';
import { TrackingSide, getStatusAfterRemove } from '@/lib/trackingRemoval';

// ลบรายการติดตามสถานะออกจากหน้าของฝั่งที่กด โดยไม่ลบแถวในฐานข้อมูล
// เปลี่ยน status เป็น user removed / company removed / all removed (ดู lib/trackingRemoval.ts)
// ไม่แจ้งเตือนอีกฝั่ง และไม่แก้ date_time เพราะไม่ใช่การเปลี่ยนสถานะใบสมัคร

interface UpdateResult {
  affectedRows: number;
}

// สองฝั่งลบพร้อมกันได้ จึงอัปเดตเฉพาะเมื่อสถานะยังเป็นค่าที่อ่านมา ถ้าถูกเปลี่ยนไปแล้วให้อ่านใหม่แล้วลองอีกครั้ง
const MAX_ATTEMPTS = 2;

export async function PATCH(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  }

  try {
    const { trackingId } = await req.json();
    if (!trackingId) {
      return NextResponse.json({ message: 'กรุณาระบุ trackingId' }, { status: 400 });
    }

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const contact = await getTrackingContact(Number(trackingId));
      if (!contact) {
        return NextResponse.json({ message: 'ไม่พบใบสมัครนี้' }, { status: 404 });
      }

      // ลบได้เฉพาะผู้สมัครเจ้าของใบสมัคร หรือบริษัทเจ้าของตำแหน่งงาน
      let side: TrackingSide | null = null;
      if (sessionUser.role === 'company' && sessionUser.id === contact.post.company_id) side = 'company';
      else if (sessionUser.role !== 'company' && sessionUser.id === contact.user_id) side = 'seeker';
      if (!side) {
        return NextResponse.json({ message: 'ไม่มีสิทธิ์ลบรายการนี้' }, { status: 403 });
      }

      const nextStatus = getStatusAfterRemove(side, contact.status);
      if (!nextStatus) {
        return NextResponse.json(
          { message: 'ลบได้เฉพาะรายการที่ไม่ผ่านพิจารณาหรือยกเลิกแล้ว' },
          { status: 409 },
        );
      }

      const [result] = (await db.query(
        'UPDATE interview_tracking SET status = ? WHERE tracking_id = ? AND status = ?',
        [nextStatus, contact.tracking_id, contact.status],
      )) as [UpdateResult, unknown];

      if (result.affectedRows > 0) {
        return NextResponse.json({ success: true, status: nextStatus }, { status: 200 });
      }
    }

    return NextResponse.json(
      { message: 'สถานะรายการเพิ่งถูกเปลี่ยน กรุณารีเฟรชหน้าแล้วลองใหม่' },
      { status: 409 },
    );
  } catch (error) {
    console.error('Remove tracking error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}
