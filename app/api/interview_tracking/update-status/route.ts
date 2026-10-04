import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import nodemailer from 'nodemailer';
import { apiUrl } from '@/lib/hostURL';
import { getSessionUser, isAdmin } from '@/lib/auth';
import { getTrackingContact } from '@/lib/trackingContext';

export async function PATCH(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  }

  try {
    const { 
      trackingId, 
      status, 
      interviewDate, 
      interviewTime, 
      locationName, 
      interviewType,
      reviewRating,   // <--- เพิ่มบรรทัดนี้
      reviewComment   // <--- เพิ่มบรรทัดนี้
    } = await req.json();

    if (!trackingId || !status) {
      return NextResponse.json({ message: 'กรุณาระบุ trackingId และ status' }, { status: 400 });
    }

    // ดึงผู้เกี่ยวข้องจากฐานข้อมูล (ไม่เชื่อชื่อ/อีเมลที่ client ส่งมา)
    const contact = await getTrackingContact(Number(trackingId));
    if (!contact) {
      return NextResponse.json({ message: 'ไม่พบใบสมัครนี้' }, { status: 404 });
    }

    // เปลี่ยนสถานะได้เฉพาะผู้สมัครเจ้าของใบสมัคร หรือบริษัทเจ้าของตำแหน่งงาน
    const isSeekerOwner = sessionUser.role !== 'company' && sessionUser.id === contact.user_id;
    const isCompanyOwner = sessionUser.role === 'company' && sessionUser.id === contact.post.company_id;
    if (!isSeekerOwner && !isCompanyOwner && !isAdmin(sessionUser)) {
      return NextResponse.json({ message: 'ไม่มีสิทธิ์แก้ไขใบสมัครนี้' }, { status: 403 });
    }

    const companyEmail = contact.post.company_email;
    const companyName = contact.post.company_name;
    const jobTitle = contact.post.job_position;
    const seekerEmail = contact.seeker.email;
    const seekerName = contact.seeker.fullname;

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

    if (reviewRating !== undefined && reviewRating !== null) {
      updateSql += `, review_rating = ?, review_comment = ?, created_review_at = NOW()`;
      queryParams.push(reviewRating, reviewComment || null);
    }

    if (['screening', 'appointment', 'offer', 'reject', 'rejected'].includes(status)) {
      updateSql += `, status_notification = 'unread_user'`;
    } else if (['applied', 'interview', 'hired', 'cancel', 'canceled'].includes(status)) {
      updateSql += `, status_notification = 'unread_company'`;
    }

    updateSql += `, date_time = NOW()`;

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

    const platformLink = apiUrl;

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
    else if (status === 'hired') {
      targetEmail = companyEmail;
      mailSubject = `[ตอบรับข้อเสนองาน] คุณ ${seekerName || 'ผู้สมัคร'} ยืนยันตอบรับข้อเสนอตำแหน่ง ${jobTitle}`;
      mailBody = `เรียน ฝ่าย HR บริษัท ${companyName},\n\nคุณ ${seekerName || 'ผู้สมัคร'} ได้ตอบรับข้อเสนอเริ่มงานในตำแหน่ง ${jobTitle} เรียบร้อยแล้ว\n\nดูรายละเอียด: ${platformLink}`;
    }
    else if (status === 'reject' || status === 'rejected') {
      targetEmail = companyEmail && seekerEmail ? `${companyEmail}, ${seekerEmail}` : (companyEmail || seekerEmail); 
      mailSubject = `[ยกเลิกการสมัคร] อัปเดตสถานะตำแหน่ง ${jobTitle}`;
      mailBody = `ระบบขอแจ้งให้ทราบว่า กระบวนการสมัครงานตำแหน่ง ${jobTitle} ระหว่างคุณ ${seekerName || 'ผู้สมัคร'} และบริษัท ${companyName} ได้ถูกปฏิเสธหรือยกเลิกแล้ว\n\nตรวจสอบรายละเอียด: ${platformLink}`;
    }

    // ส่งอีเมลไม่ผ่านไม่ควรทำให้คำขอล้ม เพราะอัปเดตสถานะไปแล้ว
    if (targetEmail && mailSubject) {
      try {
        await transporter.sendMail({
          from: `"BigJobs System" <${process.env.EMAIL_USER}>`,
          to: targetEmail,
          subject: mailSubject,
          text: mailBody,
        });
      } catch (mailError) {
        console.error('Send email failed:', mailError);
      }
    }

    return NextResponse.json({ success: true, message: 'อัปเดตสถานะสำเร็จ' }, { status: 200 });
  } catch (error) {
    console.error('Update Status Error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}