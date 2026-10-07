import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { rateLimit } from "@/lib/rateLimit";
import db from "@/lib/db";
import { apiUrl } from "@/lib/hostURL";
import { getSessionUser } from "@/lib/auth";
import {
  escapeHtml,
  getPostContact,
  getSeekerContact,
} from "../trackingContext";

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

    const companyName = escapeHtml(post.company_name);
    const jobTitle = escapeHtml(post.job_position);
    const seekerName = escapeHtml(seeker.fullname);
    const safeMessage = escapeHtml(message || "ไม่มีข้อความเพิ่มเติม");

    // ส่งอีเมลไปหาผู้สมัคร (Seeker)
    // ส่งอีเมลไม่ผ่านไม่ควรทำให้คำขอล้ม เพราะบันทึกลงฐานข้อมูลไปแล้ว
    try {
      await transporter.sendMail({
        from: `"${post.company_name.replace(/"/g, "")} via BIGJOBs" <${process.env.EMAIL_USER}>`,
        replyTo: post.company_email,
        to: seeker.email,
        subject: `[BIGJOBs] ข้อความติดต่องานตำแหน่ง ${post.job_position} จาก ${post.company_name}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #0d6efd; margin-top: 0;">โอกาสในการร่วมงานใหม่จาก ${companyName}</h2>
            <p><strong>เรียนคุณ:</strong> ${seekerName}</p>
            <p><strong>ตำแหน่งงานที่สนใจเสนอ:</strong> ${jobTitle}</p>

            <div style="margin-top: 15px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #0d6efd; border-radius: 4px;">
              <p style="margin: 0; font-weight: bold; margin-bottom: 5px;">ข้อความจากบริษัท:</p>
              <p style="white-space: pre-line; margin: 0;">${safeMessage}</p>
            </div>

            <div style="text-align: center; margin: 25px 0;">
              <a href="${jobLink}" target="_blank" style="background-color: #0d6efd; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                ดูรายละเอียดตำแหน่งงานนี้
              </a>
            </div>

            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: gray;">คุณสามารถกดปุ่มด้านบนเพื่อดูข้อมูลงาน หรือตอบกลับอีเมลนี้เพื่อติดต่อบริษัท ${companyName} ได้โดยตรง</p>
          </div>
        `,
      });
    } catch (mailError) {
      console.error("Send email failed:", mailError);
    }

    return NextResponse.json({ message: "ส่งคำเชิญเรียบร้อยแล้ว!" }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error sending Invitation:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการส่งคำเชิญ", error: errorMessage }, { status: 500 });
  }
}
