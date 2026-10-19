import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { rateLimit } from "@/lib/rateLimit";
import db from "@/lib/db";
import { apiUrl } from "@/lib/hostURL";
import { getSessionUser } from "@/lib/auth";
import { getPostContact, getSeekerContact } from "../trackingContext";
import { applicationMail } from "../trackingEmails";

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

    if (post.is_closed) {
      return NextResponse.json(
        { message: "ตำแหน่งนี้ปิดรับสมัครแล้ว" },
        { status: 400 },
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

    const mail = applicationMail(
      {
        companyName: post.company_name,
        jobTitle: post.job_position,
        seekerName: seeker.fullname,
        seekerEmail: seeker.email,
        seekerPhone: seeker.phone,
        seekerProfileLink: profileLink,
        platformLink: apiUrl,
      },
      { seekerMessage: typeof message === "string" ? message : "" },
    );

    // ส่งอีเมลไม่ผ่านไม่ควรทำให้คำขอล้ม เพราะบันทึกลงฐานข้อมูลไปแล้ว
    try {
      await transporter.sendMail({
        from: { name: "BIGJOBs", address: process.env.EMAIL_USER ?? "" },
        replyTo: seeker.email,
        to: post.company_email,
        subject: mail.subject,
        text: mail.body,
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
        error: error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
      },
      { status: 500 },
    );
  }
}
