import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
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
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

interface Answer {
  choice_id: number;
  user_respond?: string;
}

// ผู้หางานส่งแบบทดสอบ + ใบสมัคร
// ผู้สมัครมาจาก session ส่วนชื่อ/อีเมลดึงจากฐานข้อมูล ไม่เชื่อค่าที่ client ส่งมา
export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role === "company") {
    return NextResponse.json(
      { message: "กรุณาเข้าสู่ระบบด้วยบัญชีผู้หางาน" },
      { status: 401 },
    );
  }

  try {
    const { postId, answers } = (await req.json()) as {
      postId: number | string;
      answers?: Answer[];
    };

    const post_id = Number(postId);
    const user_id = sessionUser.id;

    const post = await getPostContact(post_id);
    const seeker = await getSeekerContact(user_id);
    if (!post || !seeker) {
      return NextResponse.json({ message: "ไม่พบข้อมูลตำแหน่งงานหรือผู้สมัคร" }, { status: 404 });
    }

    // กันสมัครซ้ำ (และกันส่งอีเมลซ้ำหาบริษัทเดิม)
    const [existing] = (await db.query(
      `SELECT tracking_id FROM interview_tracking WHERE post_id = ? AND user_id = ? LIMIT 1`,
      [post_id, user_id],
    )) as [unknown[], unknown];
    if (existing.length > 0) {
      return NextResponse.json({ message: "คุณเคยสมัครตำแหน่งนี้แล้ว" }, { status: 400 });
    }

    // 1. สร้างใบสมัครลง interview_tracking ก่อน เพื่อเอา tracking_id
    const insertAppSql = `INSERT INTO interview_tracking (post_id, user_id, status, status_notification) VALUES (?, ?, 'applied', 'unread_company')`;
    const [appResult] = await db.query(insertAppSql, [post_id, user_id]) as [{ insertId: number }, unknown];

    const tracking_id = appResult.insertId; // ดึง ID ที่เพิ่งถูกสร้างขึ้นมา

    // 2. บันทึกคำตอบลงตาราง response โดยใช้ tracking_id ที่ได้มา
    // answers คือ Array ที่ฝั่ง Frontend ส่งมา เช่น [{ choice_id: 5, user_respond: "ตอบ A" }]
    if (answers && answers.length > 0) {
      for (const ans of answers) {
        await db.query(
          `INSERT INTO response (tracking_id, choice_id, user_respond) VALUES (?, ?, ?)`,
          [tracking_id, ans.choice_id, ans.user_respond || ""]
        );
      }
    }

    // 3. ส่งอีเมลหา HR ของบริษัทเจ้าของตำแหน่งงาน
    const profileLink = `${apiUrl}/company/seeker-profile/${user_id}`;
    // ส่งอีเมลไม่ผ่านไม่ควรทำให้คำขอล้ม เพราะบันทึกลงฐานข้อมูลไปแล้ว
    try {
      await transporter.sendMail({
        from: `"BIGJOBs Application" <${process.env.EMAIL_USER}>`,
        replyTo: seeker.email,
        to: post.company_email,
        subject: `[BIGJOBs] มีผู้ทำแบบทดสอบและสมัครงานตำแหน่ง ${post.job_position} - ${seeker.fullname}`,
        html: `
          <div style="padding: 20px; font-family: Arial, sans-serif;">
            <h2 style="color: #0d6efd;">ผู้สมัครได้ทำแบบทดสอบและส่งใบสมัครแล้ว</h2>
            <p><strong>ตำแหน่ง:</strong> ${escapeHtml(post.job_position)}</p>
            <p><strong>ผู้สมัคร:</strong> ${escapeHtml(seeker.fullname)}</p>
            <a href="${profileLink}" style="background-color: #198754; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">ดูโปรไฟล์ผู้สมัคร</a>
          </div>
        `,
      });
    } catch (mailError) {
      console.error("Send email failed:", mailError);
    }

    return NextResponse.json({ message: "ส่งใบสมัครและแบบทดสอบสำเร็จ!" }, { status: 200 });

  } catch (error: unknown) {
    console.error("Error submitting test:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการส่ง" }, { status: 500 });
  }
}
