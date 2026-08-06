import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sql = `
      SELECT 
        interview.tracking_id,
        interview.status,
        posts.*,
        comp.company_email,
        comp.company_name,
        comp.logo_image 
      FROM interview_tracking interview
      JOIN posts ON interview.post_id = posts.post_id  -- ✅ แก้ไขตรงนี้เป็น interview.post_id
      LEFT JOIN company comp ON posts.company_id = comp.company_id
      WHERE interview.user_id = ?
    `;

    const [rows]: any = await db.query(sql, [id]);
    return NextResponse.json({ rows }, { status: 200 });
  } catch (error: any) {
    console.error("SQL Error:", error.message); // เพิ่ม log ดู error ใน terminal
    return NextResponse.json(
      { message: "Error fetching tracking", error: error.message },
      { status: 500 }
    );
  }
}