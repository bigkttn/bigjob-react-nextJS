import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("post_id");

    if (!postId) return NextResponse.json({ message: "Missing post_id" }, { status: 400 });

    // 1. ดึงคำถามทั้งหมดของ post_id นี้
    const [questions] = await db.query(`SELECT * FROM question WHERE post_id = ?`, [postId]) as [any[], unknown];

    if (!questions || questions.length === 0) {
        return NextResponse.json([], { status: 200 });
    }

    // 2. ดึงช้อยส์ทั้งหมดที่เกี่ยวข้องกับคำถามเหล่านี้
    const questionIds = questions.map((q: any) => q.question_id);
    const [choices] = await db.query(
      `SELECT * FROM choice WHERE question_id IN (?)`, 
      [questionIds]
    ) as [any[], unknown];

    // 3. นำช้อยส์ไปจัดกลุ่มยัดเข้าไปในแต่ละคำถาม เพื่อให้ Frontend ใช้ง่าย
    const formattedQuestions = questions.map((q: any) => ({
      ...q,
      choices: choices.filter((c: any) => c.question_id === q.question_id)
    }));

    return NextResponse.json(formattedQuestions, { status: 200 });
  } catch (error) {
    console.error("Error fetching test:", error);
    return NextResponse.json({ message: "Error fetching test" }, { status: 500 });
  }
}