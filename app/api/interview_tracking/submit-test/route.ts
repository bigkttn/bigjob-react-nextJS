import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import db from "@/lib/db";
import { apiUrl } from "@/lib/hostURL";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { seekerName, seekerEmail, companyEmail, jobTitle, companyName, postId, userId, answers } = body;

    const post_id = Number(postId);
    const user_id = Number(userId);

    // 1. สร้างใบสมัครลง interview_tracking ก่อน เพื่อเอา tracking_id
    const insertAppSql = `INSERT INTO interview_tracking (post_id, user_id, status) VALUES (?, ?, 'applied')`;
    const [appResult] = await db.query(insertAppSql, [post_id, user_id]) as [any, unknown];
    
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

    // 3. ส่งอีเมลหา HR (โค้ดส่งอีเมลเดิมของคุณ)
    const profileLink = `${apiUrl}/seeker/profile/${user_id}`;
    await transporter.sendMail({
      from: `"BIGJOBs Application" <${process.env.EMAIL_USER}>`,
      replyTo: seekerEmail,
      to: companyEmail,
      subject: `[BIGJOBs] มีผู้ทำแบบทดสอบและสมัครงานตำแหน่ง ${jobTitle} - ${seekerName}`,
      html: `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #0d6efd;">ผู้สมัครได้ทำแบบทดสอบและส่งใบสมัครแล้ว</h2>
          <p><strong>ตำแหน่ง:</strong> ${jobTitle}</p>
          <p><strong>ผู้สมัคร:</strong> ${seekerName}</p>
          <a href="${profileLink}" style="background-color: #198754; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">ดูโปรไฟล์ผู้สมัคร</a>
        </div>
      `,
    });

    return NextResponse.json({ message: "ส่งใบสมัครและแบบทดสอบสำเร็จ!" }, { status: 200 });

  } catch (error: unknown) {
    console.error("Error submitting test:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการส่ง" }, { status: 500 });
  }
}