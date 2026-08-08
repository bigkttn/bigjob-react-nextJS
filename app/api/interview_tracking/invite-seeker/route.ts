import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { rateLimit } from "@/lib/rateLimit";
import db from "@/lib/db";
import { Seq2SeqLMOutput } from "@xenova/transformers";

// ตั้งค่า Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  // ป้องกันการกดส่งรัวๆ (จำกัด 3 ครั้ง ต่อ 1 นาที)
  if (!rateLimit(ip, 3, 60_000)) {
    return NextResponse.json(
      { message: "คุณส่งคำขอมากเกินไป กรุณาลองใหม่อีกครั้งในภายหลัง" },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { seekerName, seekerEmail, message, companyEmail, jobTitle,companyName,
            postId,userId
     } = body;

     console.log(" Received Payload:", { postId, userId, seekerName });
    
    const post_id = Number(postId);
    const user_id = Number(userId);

    // Validate ข้อมูลเบื้องต้น
    if (!seekerName || !seekerEmail || !companyEmail || !jobTitle  || !companyName) {
      return NextResponse.json(
        { message: "กรุณากรอกข้อมูลสำคัญให้ครบถ้วน" },
        { status: 400 }
      );
    }

    if (!post_id || !user_id) {
      return NextResponse.json(
        { message: "ไม่พบข้อมูล postId หรือ userId" },
        { status: 400 }
      );
    }
    const {rows}:any  = await db.query(
      `SELECT * FROM interview_tracking WHERE post_id = ?  AND user_id = ?`,
      [postId,userId]);
     
    if(rows && rows.length>0){
      return NextResponse.json(
        {message:"คุณได้ทำการสมัครงานในตำแหน่งนี้ไปแล้ว"},
        {status:400}
      );
    }

    const spl = `INSERT interview_tracking
                (post_id,user_id,status,interview_message)
                VALUES(?,?,?,?)`;
  
    const initStatus = "applied";
    
    await db.query(spl,[
      postId,userId,initStatus,message||null
    ]);

    await transporter.sendMail({
      from: `"BIGJOBs Application" <${process.env.EMAIL_USER}>`,
      replyTo: seekerEmail, // เมื่อ HR กด Reply จะเด้งไปหาผู้สมัครทันที
      to: companyEmail,
      subject: `[BIGJOBs] ใบสมัครงานตำแหน่ง ${jobTitle} - ${seekerName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #0d6efd;">มีการสมัครงานใหม่จาก BIGJOBs</h2>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;" />
          
          <p><strong>ตำแหน่งงาน:</strong> ${jobTitle}</p>
          <p><strong>ชื่อผู้สมัคร:</strong> ${seekerName}</p>
          <p><strong>อีเมลผู้สมัคร:</strong> ${seekerEmail}</p>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
            <p style="margin-0; font-weight: bold;">ข้อความจากผู้สมัคร:</p>
            <p style="white-space: pre-line;">${message || "ไม่มีข้อความเพิ่มเติม"}</p>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: gray;">ข้อความนี้ถูกส่งจากระบบอัตโนมัติของ BIGJOBs คุณสามารถตอบกลับอีเมลนี้เพื่อติดต่อผู้สมัครได้โดยตรง</p>
        </div>
      `,
    });

    return NextResponse.json({ message: "ส่งใบสมัครเรียบร้อยแล้ว!" }, { status: 200 });

  } catch (error: any) {
    console.error("Error sending Job Application:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการส่งใบสมัคร", error: error.message },
      { status: 500 }
    );
  }
}