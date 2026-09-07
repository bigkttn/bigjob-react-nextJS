import { NextResponse } from "next/server";
import db from "@/lib/db"; // ปรับตาม Database connection ของคุณ
import nodemailer from "nodemailer";

export async function PATCH(req: Request) {
  try {
    const {
      trackingId,
      status,
      interviewDate,
      seekerEmail,
      seekerName,
      companyName,
      jobTitle,
    } = await req.json();

    if (!trackingId || !status) {
      return NextResponse.json(
        { message: "กรุณาระบุ trackingId และ status" },
        { status: 400 },
      );
    }

    // 1. อัปเดตสถานะ (และวันสัมภาษณ์ถ้ามี) ลง Database
    let updateSql = `UPDATE interview_tracking SET status = ?`;
    const queryParams: (string | number)[] = [status];

    if (interviewDate) {
      updateSql += `, interview_date = ?`;
      queryParams.push(interviewDate);
    }

    updateSql += ` WHERE tracking_id = ?`;
    queryParams.push(trackingId);

    await db.query(updateSql, queryParams);

    // 2. สร้างข้อความและส่งอีเมลแจ้งผู้สมัคร (Seeker)
    if (seekerEmail) {
      let mailSubject = "";
      let mailBody = "";

      if (status === "prepinterview") {
        mailSubject = `[${companyName}] ตอบรับการพิจารณาตำแหน่ง ${jobTitle}`;
        mailBody = `เรียนคุณ ${seekerName},\n\nทางบริษัท ${companyName} ได้พิจารณาใบสมัครของคุณแล้ว และยินดีตอบรับเข้าสู่ขั้นตอนการสัมภาษณ์งาน`;
      } else if (status === "interview_pending") {
        mailSubject = `[${companyName}] แจ้งนัดหมายสัมภาษณ์งานตำแหน่ง ${jobTitle}`;
        mailBody = `เรียนคุณ ${seekerName},\n\nทางบริษัทขอเชิญสัมภาษณ์งานในวันที่ ${interviewDate}`;
      } else if (status === "rejected") {
        mailSubject = `[${companyName}] แจ้งผลการพิจารณาใบสมัครตำแหน่ง ${jobTitle}`;
        mailBody = `เรียนคุณ ${seekerName},\n\nทางบริษัทขอขอบคุณที่ให้ความสนใจสมัครงาน แต่เนื่องจากคุณสมบัติยังไม่ตรงกับตำแหน่งในขณะนี้`;
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
          from: `"${companyName}" <no-reply@company.com>`,
          to: seekerEmail,
          subject: mailSubject,
          text: mailBody,
        });
      }
    }

    return NextResponse.json(
      { success: true, message: "อัปเดตสถานะฝั่งบริษัทสำเร็จ" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Company Update Status Error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในระบบ" },
      { status: 500 },
    );
  }
}
