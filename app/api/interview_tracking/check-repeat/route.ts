import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, post_id, role, company_id } = body;

    const userId = Number(user_id);
    const postId = Number(post_id);
    const compId = Number(company_id);

    if (!userId) {
      return NextResponse.json(
        { exists: false, message: "Missing user_id" },
        { status: 400 }
      );
    }

    let sql = "";
    let params: (number)[] = [];

    if (postId) {
      // 1. กรณีระบุ post_id ชัดเจน (เช็กว่าตำแหน่งงานนี้ มี Record ร่วมกันหรือยัง)
      sql = `SELECT 
               interview.tracking_id, 
               interview.status, 
               interview.date_time, 
               interview.post_id,
               interview.user_id,
               posts.job_position,
               posts.company_id
             FROM interview_tracking interview 
             JOIN posts ON interview.post_id = posts.post_id 
             WHERE interview.user_id = ? AND interview.post_id = ? 
             LIMIT 1`;
      params = [userId, postId];
    } else if (compId) {
      // 2. กรณีไม่มี post_id (เช่น Company ดูโปรไฟล์ Seeker จากหน้ารวม) -> ดึงรายการ post_id ทั้งหมดของบริษัทนี้ที่เคยเชิญ/สมัครกับผู้ใช้คนนี้
      sql = `SELECT 
               interview.tracking_id, 
               interview.status, 
               interview.post_id,
               posts.job_position
             FROM interview_tracking interview 
             JOIN posts ON interview.post_id = posts.post_id 
             WHERE interview.user_id = ? AND posts.company_id = ?`;
      params = [userId, compId];
    } else {
      return NextResponse.json(
        { exists: false, message: "Missing post_id or company_id" },
        { status: 400 }
      );
    }

    const [rows] = await db.query(sql, params) as unknown as [Array<Record<string, unknown>>];
    const exists = Array.isArray(rows) && rows.length > 0;

    return NextResponse.json({
      exists,
      rows: exists ? rows : [],
      data: exists ? rows[0] : null
    }, { status: 200 });

  } catch (error: unknown) {
    console.error("Error in check-repeat API:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { exists: false, error: errorMessage },
      { status: 500 }
    );
  }
}