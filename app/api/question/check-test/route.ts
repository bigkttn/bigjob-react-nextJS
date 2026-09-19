import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { post_id } = await req.json();
    const postId = Number(post_id);

    if (!postId) {
      return NextResponse.json({ hasTest: false }, { status: 400 });
    }

    // แค่เช็คว่ามีคำถามสำหรับงานนี้ไหม (ไม่มีการบันทึกข้อมูลใดๆ)
    const sql = `SELECT question_id FROM question WHERE post_id = ? LIMIT 1`;
    const [rows] = await db.query(sql, [postId]) as [any[], unknown];
    
    const hasTest = Array.isArray(rows) && rows.length > 0;

    return NextResponse.json({ hasTest }, { status: 200 });
  } catch (error) {
    console.error("Database error in check-test:", error);
    return NextResponse.json({ hasTest: false }, { status: 500 });
  }
}