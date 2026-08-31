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

  if (!rateLimit(ip, 3, 60_000)) {
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

    if (!seekerName || !seekerEmail || !companyEmail || !jobTitle || !companyName) {
      return NextResponse.json({ message: "กรุณากรอกข้อมูลสำคัญให้ครบถ้วน" }, { status: 400 });
    }

    if (!post_id || !user_id) {
      return NextResponse.json({ message: "ไม่พบข้อมูล postId หรือ userId" }, { status: 400 });
    }

    // URL เว็บไซต์ของคุณ (ดึงจาก env หรือ fallback)
    
    const profileLink = `${apiUrl}/seeker/profile/${user_id}`; // ลิงก์ไปยังโปรไฟล์ผู้สมัคร

    const sql = `INSERT INTO interview_tracking (post_id, user_id, status, interview_message) VALUES (?, ?, 'applied', ?)`;
    await db.query(sql, [post_id, user_id, message || null]);

    await transporter.sendMail({
      from: `"BIGJOBs Application" <${process.env.EMAIL_USER}>`,
      replyTo: seekerEmail,
      to: companyEmail,
      subject: `[BIGJOBs] ใบสมัครงานตำแหน่ง ${jobTitle} - ${seekerName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #0d6efd; margin-top: 0;">มีการสมัครงานใหม่จาก BIGJOBs</h2>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;" />
          
          <p><strong>ตำแหน่งงาน:</strong> ${jobTitle}</p>
          <p><strong>ชื่อผู้สมัคร:</strong> ${seekerName}</p>
          <p><strong>อีเมลผู้สมัคร:</strong> ${seekerEmail}</p>
          
          <div style="margin-top: 15px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
            <p style="margin: 0; font-weight: bold; margin-bottom: 5px;">ข้อความจากผู้สมัคร:</p>
            <p style="white-space: pre-line; margin: 0;">${message || "ไม่มีข้อความเพิ่มเติม"}</p>
          </div>

          <!-- 🟢 ปุ่มลิงก์ไปยังเว็บไซต์สำหรับ HR/Company -->
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

    return NextResponse.json({ message: "ส่งใบสมัครเรียบร้อยแล้ว!" }, { status: 200 });

  } catch (error: unknown) {
    console.error("Error sending Job Application:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการส่งใบสมัคร", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}