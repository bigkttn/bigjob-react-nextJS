import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import nodemailer from 'nodemailer';
import { apiUrl } from '@/lib/hostURL';
import { getSessionUser, isAdmin } from '@/lib/auth';
import { getTrackingContact } from '@/lib/trackingContext';
import { TrackingActor, canChangeStatus } from '@/lib/trackingStatus';
import {
  SeekerMailContext,
  interviewInviteMail,
  offerMail,
  rejectionMail,
  rescheduleConfirmedMail,
  rescheduleRequestMail,
  toDateParts,
} from '@/lib/trackingEmails';

// สถานะที่ต้องมีวันนัดในอนาคต (นัดสัมภาษณ์ / ขอเลื่อนนัด)
const NEEDS_FUTURE_DATE = ['screening', 'reschedule'];
// สถานะที่ถือว่า "มีวันนัดอยู่แล้ว" ถ้าบริษัทนัดใหม่จากสถานะเหล่านี้ = เลื่อนนัด
const HAS_APPOINTMENT = ['screening', 'interview', 'reschedule'];
const MAX_REASON_LENGTH = 500;

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
      rescheduleReason,
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

    // แต่ละฝั่งเปลี่ยนได้เฉพาะสถานะที่อนุญาต (admin ข้ามกฎนี้)
    let actor: TrackingActor | null = null;
    if (isCompanyOwner) actor = 'company';
    else if (isSeekerOwner) actor = 'seeker';

    const previousStatus = (contact.status || '').toLowerCase();
    if (actor && !canChangeStatus(actor, previousStatus, status)) {
      return NextResponse.json(
        { message: 'ไม่สามารถเปลี่ยนสถานะใบสมัครนี้ได้ กรุณารีเฟรชหน้าแล้วลองใหม่' },
        { status: 409 },
      );
    }

    if (NEEDS_FUTURE_DATE.includes(status)) {
      const newInterviewAt = new Date(`${interviewDate}T${interviewTime}:00`);
      if (!interviewDate || !interviewTime || Number.isNaN(newInterviewAt.getTime())) {
        return NextResponse.json({ message: 'กรุณาระบุวันและเวลานัดหมาย' }, { status: 400 });
      }
      if (newInterviewAt.getTime() <= Date.now()) {
        return NextResponse.json({ message: 'วันและเวลานัดหมายต้องเป็นเวลาในอนาคต' }, { status: 400 });
      }
    }

    const reason = typeof rescheduleReason === 'string' ? rescheduleReason.trim() : '';
    if (status === 'reschedule') {
      if (!reason) {
        return NextResponse.json({ message: 'กรุณาระบุเหตุผลที่ขอเลื่อนนัด' }, { status: 400 });
      }
      if (reason.length > MAX_REASON_LENGTH) {
        return NextResponse.json({ message: `เหตุผลต้องไม่เกิน ${MAX_REASON_LENGTH} ตัวอักษร` }, { status: 400 });
      }
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

    // ขอเลื่อนนัด: เก็บเหตุผลไว้ให้บริษัทเห็นในหน้าเว็บ
    if (status === 'reschedule') {
      updateSql += `, interview_message = ?`;
      queryParams.push(reason);
    }

    if (reviewRating !== undefined && reviewRating !== null) {
      updateSql += `, review_rating = ?, review_comment = ?, created_review_at = NOW()`;
      queryParams.push(reviewRating, reviewComment || null);
    }

    // แจ้งเตือนอีกฝั่งของคนที่กด (admin ใช้ตามสถานะเหมือนเดิม)
    if (actor === 'company') {
      updateSql += `, status_notification = 'unread_user'`;
    } else if (actor === 'seeker') {
      updateSql += `, status_notification = 'unread_company'`;
    } else if (['screening', 'appointment', 'offer', 'reject', 'rejected'].includes(status)) {
      updateSql += `, status_notification = 'unread_user'`;
    } else if (['applied', 'interview', 'hired', 'cancel', 'canceled', 'reschedule'].includes(status)) {
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
    // อีเมลถึงผู้สมัครส่งในนามบริษัท: ตอบกลับแล้วถึงบริษัทโดยตรง
    let sendAsCompany = false;

    const seekerMailContext: SeekerMailContext = {
      seekerName: seekerName || 'ผู้สมัคร',
      companyName,
      companyEmail,
      companyPhone: contact.post.company_phone,
      jobTitle,
      platformLink,
    };

    if (status === 'applied') {
      targetEmail = companyEmail;
      mailSubject = `[อัปเดตสถานะ] คุณ ${seekerName || 'ผู้สมัคร'} ตอบรับความสนใจตำแหน่ง ${jobTitle}`;
      mailBody = `เรียน ฝ่าย HR บริษัท ${companyName},\n\nผู้สมัครได้ตอบรับความสนใจในตำแหน่ง ${jobTitle} แล้ว\nกรุณาเข้าสู่ระบบเพื่อนัดหมายวันเวลาสัมภาษณ์\n\nเข้าสู่ระบบ: ${platformLink}`;
    }
    else if (status === 'screening') {
      // เคยมีวันนัดแล้ว = บริษัทเลื่อนนัด / กำหนดเวลาใหม่แทนเวลาที่ผู้สมัครขอ
      const isChange = HAS_APPOINTMENT.includes(previousStatus) && contact.interview_date !== null;
      targetEmail = seekerEmail;
      sendAsCompany = true;
      ({ subject: mailSubject, body: mailBody } = interviewInviteMail(seekerMailContext, {
        interviewDate,
        interviewTime,
        interviewType,
        locationName,
      }, isChange));
    }
    else if (status === 'interview' && previousStatus === 'reschedule') {
      // บริษัทตกลงตามเวลาที่ผู้สมัครเสนอ → ยืนยันกับผู้สมัคร (ข้อมูลนัดอ่านจาก DB)
      const proposed = contact.interview_date ? toDateParts(contact.interview_date) : null;
      targetEmail = seekerEmail;
      sendAsCompany = true;
      ({ subject: mailSubject, body: mailBody } = rescheduleConfirmedMail(seekerMailContext, {
        interviewDate: proposed?.date,
        interviewTime: proposed?.time,
        interviewType: contact.link ? 'online' : 'onsite',
        locationName: contact.link || contact.location || undefined,
      }));
    }
    else if (status === 'interview') {
      targetEmail = companyEmail;
      mailSubject = `[ยืนยันนัดหมาย] คุณ ${seekerName || 'ผู้สมัคร'} ยืนยันเข้าร่วมสัมภาษณ์ตำแหน่ง ${jobTitle}`;
      mailBody = `เรียน ฝ่าย HR บริษัท ${companyName},\n\nผู้สมัครยืนยันเข้าร่วมการสัมภาษณ์งานตามวันและเวลาที่ท่านกำหนดแล้ว\n\nดูรายละเอียด: ${platformLink}`;
    }
    else if (status === 'reschedule') {
      // ผู้สมัครขอเลื่อนนัด → แจ้งบริษัท พร้อมวันเดิม วันที่ขอ และเหตุผล
      targetEmail = companyEmail;
      ({ subject: mailSubject, body: mailBody } = rescheduleRequestMail(seekerMailContext, {
        oldDate: contact.interview_date ? toDateParts(contact.interview_date) : null,
        newDate: interviewDate,
        newTime: interviewTime,
        reason,
      }));
    }
    else if (status === 'appointment' || status === 'offer') {
      targetEmail = seekerEmail;
      sendAsCompany = true;
      ({ subject: mailSubject, body: mailBody } = offerMail(seekerMailContext));
    }
    else if (status === 'hired') {
      targetEmail = companyEmail;
      mailSubject = `[ตอบรับข้อเสนองาน] คุณ ${seekerName || 'ผู้สมัคร'} ยืนยันตอบรับข้อเสนอตำแหน่ง ${jobTitle}`;
      mailBody = `เรียน ฝ่าย HR บริษัท ${companyName},\n\nคุณ ${seekerName || 'ผู้สมัคร'} ได้ตอบรับข้อเสนอเริ่มงานในตำแหน่ง ${jobTitle} เรียบร้อยแล้ว\n\nดูรายละเอียด: ${platformLink}`;
    }
    else if ((status === 'reject' || status === 'rejected') && isSeekerOwner) {
      // ผู้สมัครปฏิเสธข้อเสนองานเอง → แจ้งบริษัท
      targetEmail = companyEmail;
      mailSubject = `[ปฏิเสธข้อเสนองาน] คุณ ${seekerName || 'ผู้สมัคร'} ปฏิเสธข้อเสนอตำแหน่ง ${jobTitle}`;
      mailBody = `เรียน ฝ่าย HR บริษัท ${companyName},\n\nคุณ ${seekerName || 'ผู้สมัคร'} ได้ปฏิเสธข้อเสนอเริ่มงานในตำแหน่ง ${jobTitle}\n\nดูรายละเอียด: ${platformLink}`;
    }
    else if (status === 'reject' || status === 'rejected') {
      // บริษัท (หรือ admin) ไม่ผ่านพิจารณา → แจ้งผู้สมัครแบบทางการ
      targetEmail = seekerEmail;
      sendAsCompany = true;
      ({ subject: mailSubject, body: mailBody } = rejectionMail(seekerMailContext));
    }

    // ส่งอีเมลไม่ผ่านไม่ควรทำให้คำขอล้ม เพราะอัปเดตสถานะไปแล้ว
    if (targetEmail && mailSubject) {
      try {
        await transporter.sendMail({
          from: {
            name: sendAsCompany ? `${companyName} (ผ่าน BIGJOBs)` : 'BigJobs System',
            address: process.env.EMAIL_USER ?? '',
          },
          replyTo: sendAsCompany ? companyEmail : undefined,
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
