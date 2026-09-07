import { NextResponse } from 'next/server';
import db from '@/lib/db';
import nodemailer from 'nodemailer';

export async function PATCH(req: Request) {
  try {
    const { 
      trackingId, 
      status, 
      companyEmail, 
      companyName, 
      seekerName, 
      jobTitle 
    } = await req.json();

    if (!trackingId || !status) {
      return NextResponse.json({ message: 'กรุณาระบุ trackingId และ status' }, { status: 400 });
    }

    // 1. อัปเดตสถานะลง Database
    const updateSql = `UPDATE interview_tracking SET status = ? WHERE tracking_id = ?`;
    await db.query(updateSql, [status, trackingId]);

    // 2. สร้างข้อความและส่งอีเมลแจ้งบริษัท (Company)
    if (companyEmail) {
      let mailSubject = '';
      let mailBody = '';

      if (status === 'interview_accepted') {
        mailSubject = `[ตอบรับสัมภาษณ์] คุณ ${seekerName} ตอบรับนัดสัมภาษณ์ตำแหน่ง ${jobTitle}`;
        mailBody = `เรียน ฝ่าย HR บริษัท ${companyName},\n\nผู้สมัครคุณ ${seekerName} ได้ยืนยันเข้าร่วมการสัมภาษณ์งานในตำแหน่ง ${jobTitle} เรียบร้อยแล้ว`;
      } else if (status === 'interview_rejected') {
        mailSubject = `[ปฏิเสธสัมภาษณ์] คุณ ${seekerName} ขอยกเลิกนัดสัมภาษณ์ตำแหน่ง ${jobTitle}`;
        mailBody = `เรียน ฝ่าย HR บริษัท ${companyName},\n\nผู้สมัครคุณ ${seekerName} ได้ปฏิเสธนัดหมายการสัมภาษณ์งานตำแหน่ง ${jobTitle}`;
      }

      if (mailSubject) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: `"System Notification" <no-reply@yourdomain.com>`,
          to: companyEmail,
          subject: mailSubject,
          text: mailBody,
        });
      }
    }

    return NextResponse.json({ success: true, message: 'ผู้สมัครอัปเดตสถานะสำเร็จ' }, { status: 200 });
  } catch (error) {
    console.error('Seeker Update Status Error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}