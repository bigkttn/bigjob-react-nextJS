import { NextResponse } from 'next/server';
import db from '@/lib/db';
import nodemailer from 'nodemailer';

export async function PATCH(req: { json: () => PromiseLike<{ trackingId: any; status: any; companyEmail: any; seekerEmail: any; companyName: any; seekerName: any; jobTitle: any; interviewDate: any; interviewTime: any; locationName: any; interviewType: any; }> | { trackingId: any; status: any; companyEmail: any; seekerEmail: any; companyName: any; seekerName: any; jobTitle: any; interviewDate: any; interviewTime: any; locationName: any; interviewType: any; }; }) {
  try {
    const { 
      trackingId, 
      status, 
      companyEmail, 
      seekerEmail, 
      companyName, 
      seekerName, 
      jobTitle,
      interviewDate, 
      interviewTime, 
      locationName, 
      interviewType
    } = await req.json();

    if (!trackingId || !status) {
      return NextResponse.json({ message: 'กรุณาระบุ trackingId และ status' }, { status: 400 });
    }

    let updateSql = `UPDATE interview_tracking SET status = ?`;
    let queryParams = [status];

    if (interviewDate && interviewTime) {
      updateSql += `, interview_date = ?`;
      queryParams.push(`${interviewDate} ${interviewTime}:00`);
    }

    if (interviewType === 'online') {
      updateSql += `, link = ?, location = NULL`;
      queryParams.push(locationName); 
    } else if (interviewType === 'onsite') {
      updateSql += `, location = ?, link = NULL`;
      queryParams.push(locationName);
    }

    updateSql += ` WHERE tracking_id = ?`;
    queryParams.push(trackingId);

    await db.query(updateSql, queryParams);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const platformLink = "https://www.bigjobs.com/tracking";

    let mailSubject = '';
    let mailBody = '';
    let targetEmail = '';

    // (ส่วนเงื่อนไข if/else if ตั้งค่าอีเมลเหมือนเดิม ไม่ต้องเปลี่ยน)
    if (status === 'applied') {
      targetEmail = companyEmail;
      mailSubject = `[อัปเดตสถานะ] คุณ ${seekerName || 'ผู้สมัคร'} ตอบรับความสนใจตำแหน่ง ${jobTitle}`;
      mailBody = `เรียน ฝ่าย HR บริษัท ${companyName},\n\nผู้สมัครได้ตอบรับความสนใจในตำแหน่ง ${jobTitle} แล้ว\nกรุณาเข้าสู่ระบบเพื่อนัดหมายวันเวลาสัมภาษณ์\n\nเข้าสู่ระบบ: ${platformLink}`;
    } 
    else if (status === 'screening') {
      targetEmail = seekerEmail;
      mailSubject = `[นัดสัมภาษณ์] บริษัท ${companyName} ได้ส่งนัดหมายสัมภาษณ์ตำแหน่ง ${jobTitle}`;
      
      // *** เพิ่มรายละเอียดลงในอีเมลนิดหน่อยเพื่อให้ผู้สมัครเห็นชัดเจน ***
      let interviewLocationText = interviewType === 'online' ? `ลิงก์: ${locationName}` : `สถานที่: ${locationName}`;
      let interviewDateTimeText = interviewDate && interviewTime ? `วันที่ ${interviewDate} เวลา ${interviewTime} น.` : 'ตามที่ระบบระบุ';
      
      mailBody = `เรียน คุณ ${seekerName || 'ผู้สมัคร'},\n\nบริษัท ${companyName} ได้กำหนดวันและเวลาสัมภาษณ์งานสำหรับตำแหน่ง ${jobTitle} แล้ว\n\nรายละเอียดนัดหมาย:\n- ${interviewDateTimeText}\n- ${interviewLocationText}\n\nกรุณาเข้าสู่ระบบเพื่อตรวจสอบรายละเอียดและกดยืนยันการนัดหมาย\n\nตรวจสอบรายละเอียด: ${platformLink}`;
    }
    // ... (เงื่อนไขอื่นๆ ด้านล่าง คงไว้ตามเดิม)

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