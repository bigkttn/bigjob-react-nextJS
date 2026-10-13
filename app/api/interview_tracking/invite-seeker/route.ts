import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { rateLimit } from "@/lib/rateLimit";
import db from "@/lib/db";
import { apiUrl } from "@/lib/hostURL";
import { getSessionUser } from "@/lib/auth";
import { getPostContact, getSeekerContact } from "../trackingContext";
import { invitationMail } from "../trackingEmails";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// บริษัทเชิญผู้หางานให้สนใจตำแหน่งงานของบริษัทตัวเอง
// ชื่อ/อีเมลทั้งสองฝั่งดึงจากฐานข้อมูล ไม่เชื่อค่าที่ client ส่งมา
export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "company") {
    return NextResponse.json(
      { message: "กรุณาเข้าสู่ระบบด้วยบัญชีบริษัท" },
      { status: 401 },
    );
  }

  if (!rateLimit(`invite:${sessionUser.id}`, 5, 60_000)) {
    return NextResponse.json(
      { message: "คุณส่งคำขอมากเกินไป กรุณาลองใหม่อีกครั้งในภายหลัง" },
      { status: 429 }
    );
  }

  try {
    const { message, postId, userId } = await req.json();
    const post_id = Number(postId);
    const user_id = Number(userId);

    if (!post_id || !user_id) {
      return NextResponse.json({ message: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    const post = await getPostContact(post_id);
    const seeker = await getSeekerContact(user_id);
    if (!post || !seeker) {
      return NextResponse.json({ message: "ไม่พบข้อมูลตำแหน่งงานหรือผู้สมัคร" }, { status: 404 });
    }

    // เชิญได้เฉพาะตำแหน่งงานของบริษัทตัวเอง
    if (post.company_id !== sessionUser.id) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์เชิญในตำแหน่งงานนี้" }, { status: 403 });
    }

    // 🟢 เพิ่มส่วนเช็กซ้ำใน Database ก่อนทำการบันทึก
    const checkSql = `SELECT tracking_id FROM interview_tracking WHERE post_id = ? AND user_id = ? LIMIT 1`;
    const [existing] = await db.query(checkSql, [post_id, user_id]) as [Array<{tracking_id: number}>, unknown];

    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json(
        { message: "ผู้สมัครคนนี้เคยได้รับการเชิญชวนหรือสมัครตำแหน่งนี้แล้ว" },
        { status: 400 }
      );
    }

    const jobLink = `${apiUrl}/user/user-detail-job/${post_id}`;

    const sql = `INSERT INTO interview_tracking (post_id, user_id, status, interview_message, status_notification) VALUES (?, ?, 'pending', ?, 'unread_user')`;
    await db.query(sql, [post_id, user_id, message || null]);

    const mail = invitationMail(
      {
        seekerName: seeker.fullname,
        companyName: post.company_name,
        companyEmail: post.company_email,
        companyPhone: post.company_phone,
        jobTitle: post.job_position,
        platformLink: apiUrl,
      },
      typeof message === "string" ? message : "",
      jobLink,
    );

    // ส่งอีเมลไปหาผู้สมัคร (Seeker) ในนามบริษัท
    // ส่งอีเมลไม่ผ่านไม่ควรทำให้คำขอล้ม เพราะบันทึกลงฐานข้อมูลไปแล้ว
    try {
      await transporter.sendMail({
        from: {
          name: `${post.company_name} (ผ่าน BIGJOBs)`,
          address: process.env.EMAIL_USER ?? "",
        },
        replyTo: post.company_email,
        to: seeker.email,
        subject: mail.subject,
        text: mail.body,
      });
    } catch (mailError) {
      console.error("Send email failed:", mailError);
    }

    return NextResponse.json({ message: "ส่งคำเชิญเรียบร้อยแล้ว!" }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error sending Invitation:", error);
    const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการส่งคำเชิญ", error: errorMessage }, { status: 500 });
  }
}
