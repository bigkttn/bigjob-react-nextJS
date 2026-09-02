import { NextResponse } from "next/server";
import db from "@/lib/db";
import { sendWarningEmail } from "@/lib/mailer";

export async function POST(request: Request) {
  try {
    const { target_id, source, message } = await request.json();

    if (!target_id || !source || !message?.trim()) {
      return NextResponse.json(
        { error: "กรุณาระบุข้อมูลให้ครบถ้วน และต้องมีข้อความตักเตือน" },
        { status: 400 }
      );
    }

    let recipientEmail = "";
    let targetName = "";

    // 1. ดึงข้อมูลอีเมลและชื่อเป้าหมาย
    if (source === "user") {
      const [rows]: any = await db.query(
        `SELECT email, fullname FROM User WHERE uid = ?`,
        [target_id]
      );
      if (rows.length > 0) {
        recipientEmail = rows[0].email;
        targetName = rows[0].fullname || "ผู้ใช้งาน";
      }
    } else if (source === "company") {
      const [rows]: any = await db.query(
        `SELECT company_email AS email, company_name 
         FROM company 
         WHERE company_id = ?`,
        [target_id]
      );
      if (rows.length > 0) {
        recipientEmail = rows[0].email;
        targetName = rows[0].company_name || "บริษัท";
      }
    } else if (source === "post") {
      const [rows]: any = await db.query(
        `SELECT c.company_email AS email, p.job_position 
         FROM posts p 
         LEFT JOIN company c ON p.company_id = c.company_id 
         WHERE p.post_id = ?`,
        [target_id]
      );
      if (rows.length > 0) {
        recipientEmail = rows[0].email;
        targetName = `เจ้าของโพสต์ตำแหน่ง "${rows[0].job_position}"`;
      }
    }

    if (!recipientEmail) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลอีเมลของเป้าหมายที่ต้องการตักเตือน" },
        { status: 404 }
      );
    }

    // 2. อัปเดตสถานะรายงานทั้งหมดของ target_id นี้เป็น 2 (ตักเตือนแล้ว)
    const tableName =
      source === "company"
        ? "report_company"
        : source === "post"
        ? "report_post"
        : "report_user";

    const targetColumn =
      source === "company"
        ? "company_id"
        : source === "post"
        ? "post_id"
        : "user_id";

   await db.query(
      `UPDATE ${tableName} SET status = 2, warn_message = ? WHERE ${targetColumn} = ?`,
      [message, target_id]
    );

    // 3. ส่งอีเมลตักเตือนไปยังเป้าหมาย
    try {
      await sendWarningEmail(recipientEmail, targetName, message);
    } catch (emailError) {
      console.error("Warning Email Failed to send:", emailError);
    }

    return NextResponse.json(
      { message: "ส่งตักเตือนและอัปเดตสถานะรายการทั้งหมดเรียบร้อยแล้ว" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Warn API Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการส่งตักเตือน", details: error.message },
      { status: 500 }
    );
  }
}