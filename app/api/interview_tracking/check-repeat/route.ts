import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { user_id, company_id, post_id } = await req.json();

    const userId = Number(user_id);
    const compId = Number(company_id);
    const postId = Number(post_id);

    if (!userId) {
      return NextResponse.json({ exists: false, message: "Missing user_id" }, { status: 400 });
    }

    let sql = "";
    let params: (string | number)[] = [];

    if (compId) {
      // ดึงรายการ post_id ทั้งหมดของบริษัทนี้ที่ผู้สมัครเคยสมัครหรือเคยถูกเชิญแล้ว
      sql = `SELECT interview.tracking_id, interview.status, interview.post_id 
             FROM interview_tracking interview 
             JOIN posts ON interview.post_id = posts.post_id 
             WHERE interview.user_id = ? AND posts.company_id = ?`;
      params = [userId, compId];
    } else if (postId) {
      // กรณีเช็กเจาะจงรายตำแหน่ง
      sql = `SELECT interview.tracking_id, interview.status, interview.post_id 
             FROM interview_tracking interview 
             WHERE interview.user_id = ? AND interview.post_id = ? 
             LIMIT 1`;
      params = [userId, postId];
    }

    const [rows]= await db.query(sql, params);
    const exists = Array.isArray(rows) && rows.length > 0;

    return NextResponse.json({ exists, rows: exists ? rows : [] });
  } catch (error) {
    console.error("Database error in check-repeat:", error);
    return NextResponse.json({ exists: false }, { status: 500 });
  }
}