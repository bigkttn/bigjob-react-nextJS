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
} from "@/lib/trackingContext";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ผู้หางานส่งใบสมัครถึงบริษัท
// ชื่อ/อีเมลทั้งสองฝั่งดึงจากฐานข้อมูล ไม่เชื่อค่าที่ client ส่งมา
export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role === "company") {
    return NextResponse.json(
      { message: "กรุณาเข้าสู่ระบบด้วยบัญชีผู้หางาน" },
      { status: 401 },
    );
  }

  if (!rateLimit(`apply:${sessionUser.id}`, 3, 60_000)) {
    return NextResponse.json(
      { message: "คุณส่งคำขอมากเกินไป กรุณาลองใหม่อีกครั้งในภายหลัง" },
      { status: 429 },
    );
  }

  try {
    const { message, postId } = await req.json();
    const post_id = Number(postId);
    const user_id = sessionUser.id;

    if (!post_id) {
      return NextResponse.json(
        { message: "ไม่พบข้อมูล postId" },
        { status: 400 },
      );
    }

    const post = await getPostContact(post_id);
    const seeker = await getSeekerContact(user_id);
    if (!post || !seeker) {
      return NextResponse.json(
        { message: "ไม่พบข้อมูลตำแหน่งงานหรือผู้สมัคร" },
        { status: 404 },
      );
    }

    const [testCheck] = (await db.query(
      `SELECT question_id FROM question WHERE post_id = ? LIMIT 1`,
      [post_id],
    )) as [unknown[], unknown];

    if (testCheck.length > 0) {
      return NextResponse.json(
        { message: "ต้องทำแบบทดสอบความเข้ากันได้กับองค์กรก่อนส่งใบสมัคร" },
        { status: 403 },
      );
    }

    // กันสมัครซ้ำ (และกันส่งอีเมลซ้ำหาบริษัทเดิม)
    const [existing] = (await db.query(
      `SELECT tracking_id FROM interview_tracking WHERE post_id = ? AND user_id = ? LIMIT 1`,
      [post_id, user_id],
    )) as [unknown[], unknown];
    if (existing.length > 0) {
      return NextResponse.json(
        { message: "คุณเคยสมัครหรือได้รับการเชิญชวนในตำแหน่งนี้แล้ว" },
        { status: 400 },
      );
    }

    const profileLink = `${apiUrl}/company/seeker-profile/${user_id}`;

    const sql = `INSERT INTO interview_tracking (post_id, user_id, status, interview_message,date_time, status_notification) VALUES (?, ?, 'applied', ?,NOW(), 'unread_company')`;
    await db.query(sql, [post_id, user_id, message || null]);

    const jobTitle = escapeHtml(post.job_position);
    const seekerName = escapeHtml(seeker.fullname);
    const seekerEmail = escapeHtml(seeker.email);
    const safeMessage = escapeHtml(message || "ไม่มีข้อความเพิ่มเติม");

    // ส่งอีเมลไม่ผ่านไม่ควรทำให้คำขอล้ม เพราะบันทึกลงฐานข้อมูลไปแล้ว
    try {
      await transporter.sendMail({
        from: `"BIGJOBs Application" <${process.env.EMAIL_USER}>`,
        replyTo: seeker.email,
        to: post.company_email,
        subject: `[BIGJOBs] ใบสมัครงานตำแหน่ง ${post.job_position} - ${seeker.fullname}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #0d6efd; margin-top: 0;">มีการสมัครงานใหม่จาก BIGJOBs</h2>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;" />

            <p><strong>ตำแหน่งงาน:</strong> ${jobTitle}</p>
            <p><strong>ชื่อผู้สมัคร:</strong> ${seekerName}</p>
            <p><strong>อีเมลผู้สมัคร:</strong> ${seekerEmail}</p>

            <div style="margin-top: 15px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
              <p style="margin: 0; font-weight: bold; margin-bottom: 5px;">ข้อความจากผู้สมัคร:</p>
              <p style="white-space: pre-line; margin: 0;">${safeMessage}</p>
            </div>

            <!--ปุ่มลิงก์ไปยังเว็บไซต์สำหรับ HR/Company -->
            <div style="text-align: center; margin: 25px 0;">
              <a href="${profileLink}" target="_blank" style="background-color: #198754; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                ดูโปรไฟล์ / เรซูเม่ผู้สมัคร
              </a>
            </div>

            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: gray;">ข้อความนี้ถูกส่งจากระบบอัตโนมัติของ BIGJOBs คุณสามารถตอบกลับอีเมลนี้เพื่อติดต่อผู้สมัครได้โดยตรง</p>
          </div>
        `,
      });
    } catch (mailError) {
      console.error("Send email failed:", mailError);
    }

    return NextResponse.json(
      { message: "ส่งใบสมัครเรียบร้อยแล้ว!" },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Error sending Job Application:", error);
    return NextResponse.json(
      {
        message: "เกิดข้อผิดพลาดในการส่งใบสมัคร",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
