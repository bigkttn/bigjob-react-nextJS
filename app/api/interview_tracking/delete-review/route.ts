import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function PATCH(req: NextRequest) {
  try {
    const { tracking_id, user_id } = await req.json();

    if (!tracking_id || !user_id) {
      return NextResponse.json({ error: "ไม่ได้ระบุรหัสใบสมัครหรือรหัสผู้ใช้" }, { status: 400 });
    }

    const sql = `
      UPDATE interview_tracking 
      SET review_rating = NULL, review_comment = NULL, created_review_at = NULL 
      WHERE tracking_id = ? AND user_id = ?
    `;

    const [result]: any = await db.query(sql, [tracking_id, user_id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "ไม่พบรีวิว หรือไม่มีสิทธิ์ลบรีวิวนี้" }, { status: 404 });
    }

    return NextResponse.json({ message: "ลบรีวิวสำเร็จ" }, { status: 200 });
  } catch (error: any) {
    console.error("Delete review error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
