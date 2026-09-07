import db from "@/lib/db";
import { NextResponse } from "next/server";
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
        { status: 400 }
      );
    }

    // Check หากสถานะเป็น reject หรือ rejected ให้ลบข้อมูลออกจาก Database
    if (status === "reject" || status === "rejected") {
      await db.query(`DELETE FROM interview_tracking WHERE tracking_id = ?`, [trackingId]);

      // ส่งอีเมลแจ้งผู้สมัคร (ถ้ามี)
      if (seekerEmail) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: `"${companyName || 'Company'}" <no-reply@company.com>`,
          to: seekerEmail,
          subject: `[${companyName || 'Company'}] แจ้งผลการพิจารณาใบสมัครตำแหน่ง ${jobTitle || ''}`,
          text: `เรียนคุณ ${seekerName || ''},\n\nทางบริษัทขอขอบคุณที่ให้ความสนใจสมัครงาน แต่เนื่องจากคุณสมบัติยังไม่ตรงกับตำแหน่งในขณะนี้`,
        });
      }

      return NextResponse.json(
        { success: true, message: "ลบรายการสมัครงานเรียบร้อยแล้ว" },
        { status: 200 }
      );
    }

    // กรณีสถานะอื่นๆ ให้อัปเดตข้อมูลตามปกติ
    let updateSql = `UPDATE interview_tracking SET status = ?`;
    const queryParams: (string | number)[] = [status];

    if (interviewDate) {
      updateSql += `, interview_date = ?`;
      queryParams.push(interviewDate);
    }

    updateSql += ` WHERE tracking_id = ?`;
    queryParams.push(trackingId);

    await db.query(updateSql, queryParams);

    // ... (ส่วนส่งอีเมลสำหรับสถานะอื่นๆ คงไว้ตามเดิม)

    return NextResponse.json(
      { success: true, message: "อัปเดตสถานะฝั่งบริษัทสำเร็จ" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Company Update Status Error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในระบบ" },
      { status: 500 }
    );
  }
}