import { NextResponse } from 'next/server';
import db from '@/lib/db';
import nodemailer from 'nodemailer';

export async function PATCH(req: { json: () => PromiseLike<{ trackingId: any; status: any; companyEmail: any; seekerEmail: any; companyName: any; seekerName: any; jobTitle: any; }> | { trackingId: any; status: any; companyEmail: any; seekerEmail: any; companyName: any; seekerName: any; jobTitle: any; }; }) {
  try {
    const { 
      trackingId, 
      status, 
      companyEmail, 
      seekerEmail, 
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

    // 2. ตั้งค่าระบบส่งอีเมล
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const platformLink = "https://www.bigjobs.com/tracking"; // URL ของระบบคุณ

    let mailSubject = '';
    let mailBody = '';
    let targetEmail = '';

    // ==========================================
    // เงื่อนไขการส่งอีเมล (ใครควรได้รับข้อความอะไร)
    // ==========================================

    if (status === 'applied') {
      targetEmail = companyEmail;
      mailSubject = `[อัปเดตสถานะ] คุณ ${seekerName || 'ผู้สมัคร'} ตอบรับความสนใจตำแหน่ง ${jobTitle}`;
      mailBody = `เรียน ฝ่าย HR บริษัท ${companyName},\n\nผู้สมัครได้ตอบรับความสนใจในตำแหน่ง ${jobTitle} แล้ว\nกรุณาเข้าสู่ระบบเพื่อนัดหมายวันเวลาสัมภาษณ์\n\nเข้าสู่ระบบ: ${platformLink}`;
    } 
    else if (status === 'screening') {
      targetEmail = seekerEmail;
      mailSubject = `[นัดสัมภาษณ์] บริษัท ${companyName} ได้ส่งนัดหมายสัมภาษณ์ตำแหน่ง ${jobTitle}`;
      mailBody = `เรียน คุณ ${seekerName || 'ผู้สมัคร'},\n\nบริษัท ${companyName} ได้กำหนดวันและเวลาสัมภาษณ์งานสำหรับตำแหน่ง ${jobTitle} แล้ว\nกรุณาเข้าสู่ระบบเพื่อตรวจสอบรายละเอียดและกดยืนยันการนัดหมาย\n\nตรวจสอบรายละเอียด: ${platformLink}`;
    }
    else if (status === 'interview') {
      targetEmail = companyEmail;
      mailSubject = `[ยืนยันนัดหมาย] คุณ ${seekerName || 'ผู้สมัคร'} ยืนยันเข้าร่วมสัมภาษณ์ตำแหน่ง ${jobTitle}`;
      mailBody = `เรียน ฝ่าย HR บริษัท ${companyName},\n\nผู้สมัครยืนยันเข้าร่วมการสัมภาษณ์งานตามวันและเวลาที่ท่านกำหนดแล้ว\n\nดูรายละเอียด: ${platformLink}`;
    }
    else if (status === 'appointment' || status === 'offer') {
      targetEmail = seekerEmail;
      mailSubject = `[ข้อเสนองาน] ยินดีด้วย! บริษัท ${companyName} ส่งข้อเสนอเริ่มงานตำแหน่ง ${jobTitle}`;
      mailBody = `เรียน คุณ ${seekerName || 'ผู้สมัคร'},\n\nบริษัท ${companyName} มีความยินดีที่จะแจ้งให้ทราบว่าท่านผ่านการสัมภาษณ์ และบริษัทได้ส่งข้อเสนอให้ท่านแล้ว\nกรุณาเข้าสู่ระบบเพื่อตรวจสอบ\n\nตรวจสอบข้อเสนอ: ${platformLink}`;
    }
    else if (status === 'reject' || status === 'rejected') {
      targetEmail = companyEmail && seekerEmail ? `${companyEmail}, ${seekerEmail}` : (companyEmail || seekerEmail); 
      mailSubject = `[ยกเลิกการสมัคร] อัปเดตสถานะตำแหน่ง ${jobTitle}`;
      mailBody = `ระบบขอแจ้งให้ทราบว่า กระบวนการสมัครงานตำแหน่ง ${jobTitle} ระหว่างคุณ ${seekerName || 'ผู้สมัคร'} และบริษัท ${companyName} ได้ถูกปฏิเสธหรือยกเลิกแล้ว\n\nตรวจสอบรายละเอียด: ${platformLink}`;
    }

    // 3. สั่งส่งอีเมล
    if (targetEmail && mailSubject) {
      await transporter.sendMail({
        from: `"BigJobs System" <no-reply@yourdomain.com>`,
        to: targetEmail,
        subject: mailSubject,
        text: mailBody,
      });
    }

    return NextResponse.json({ success: true, message: 'อัปเดตสถานะสำเร็จ' }, { status: 200 });
  } catch (error) {
    console.error('Update Status Error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}