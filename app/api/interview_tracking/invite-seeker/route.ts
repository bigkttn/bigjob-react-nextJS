import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { rateLimit } from "@/lib/rateLimit";
import db from "@/lib/db";
import { apiUrl } from "@/lib/hostURL";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  if (!rateLimit(ip, 5, 60_000)) {
    return NextResponse.json(
      { message: "คุณส่งคำขอมากเกินไป กรุณาลองใหม่อีกครั้งในภายหลัง" },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { seekerName, seekerEmail, message, companyEmail, jobTitle, companyName, postId, userId } = body;

    const post_id = Number(postId);
    const user_id = Number(userId);

    if (!seekerName || !seekerEmail || !companyEmail || !jobTitle || !companyName || !post_id || !user_id) {
      return NextResponse.json({ message: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    // URL เว็บไซต์ของคุณ (ดึงจาก env หรือ fallback)
    
    const jobLink = `${apiUrl}/jobs/${post_id}`;

    const sql = `INSERT INTO interview_tracking (post_id, user_id, status, interview_message) VALUES (?, ?, 'invited', ? )`;
    await db.query(sql, [post_id, user_id, message || null]);

    // ส่งอีเมลไปหาผู้สมัคร (Seeker)
    await transporter.sendMail({
      from: `"${companyName} via BIGJOBs" <${process.env.EMAIL_USER}>`,
      replyTo: companyEmail,
      to: seekerEmail,
      subject: `[BIGJOBs] ข้อความติดต่องานตำแหน่ง ${jobTitle} จาก ${companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #0d6efd; margin-top: 0;">โอกาสในการร่วมงานใหม่จาก ${companyName}</h2>
          <p><strong>เรียนคุณ:</strong> ${seekerName}</p>
          <p><strong>ตำแหน่งงานที่สนใจเสนอ:</strong> ${jobTitle}</p>
          
          <div style="margin-top: 15px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #0d6efd; border-radius: 4px;">
            <p style="margin: 0; font-weight: bold; margin-bottom: 5px;">ข้อความจากบริษัท:</p>
            <p style="white-space: pre-line; margin: 0;">${message || "ไม่มีข้อความเพิ่มเติม"}</p>
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

    return NextResponse.json({ message: "ส่งคำเชิญเรียบร้อยแล้ว!" }, { status: 200 });
  } catch (error: any) {
    console.error("Error sending Invitation:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการส่งคำเชิญ", error: error.message }, { status: 500 });
  }
}