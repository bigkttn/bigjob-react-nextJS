import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db"; // หรือ path ดึง db ของคุณ

export async function POST(req: NextRequest) {
  try {
    const { user_id, post_id } = await req.json();

    const [rows]: any = await db.query(
      `SELECT tracking_id, status FROM interview_tracking WHERE post_id = ? AND user_id = ? LIMIT 1`,
      [Number(post_id), Number(user_id)]
    );

    // เช็คว่าเจอข้อมูลใน Query หรือไม่
    const exists = rows && rows.length > 0;

    return NextResponse.json({ exists, rows }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { message: "Error checking status", error: error.message },
      { status: 500 }
    );
  }
}