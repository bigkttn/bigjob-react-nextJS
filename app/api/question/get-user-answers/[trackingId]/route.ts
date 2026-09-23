import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

interface ChoiceRow {
  choice_id: number;
  question_id: number;
  choice: string;
  correct: number;
}

interface QuestionRow {
  question_id: number;
  post_id: number;
  question: string;
}

interface ResponseRow {
  respond_id: number;
  tracking_id: number;
  choice_id: number;
  user_respond: string;
}

interface TrackingRow {
  tracking_id: number;
  post_id: number;
  user_id: number;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    const { trackingId } = await params;
    const tracking_id = Number(trackingId);

    if (!tracking_id || isNaN(tracking_id)) {
      return NextResponse.json(
        { message: "Tracking ID ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // 1. ตรวจสอบข้อมูลใบสมัครใน interview_tracking เพื่อหา post_id
    const [trackingRows] = (await db.query(
      "SELECT tracking_id, post_id, user_id FROM interview_tracking WHERE tracking_id = ?",
      [tracking_id]
    )) as [TrackingRow[], unknown];

    if (!trackingRows || trackingRows.length === 0) {
      return NextResponse.json(
        { message: "ไม่พบข้อมูลการสมัครงานนี้" },
        { status: 404 }
      );
    }

    const { post_id } = trackingRows[0];

    // 2. ดึงคำถามทั้งหมดของโพสต์นี้
    const [questionRows] = (await db.query(
      "SELECT question_id, post_id, question FROM question WHERE post_id = ? ORDER BY question_id ASC",
      [post_id]
    )) as [QuestionRow[], unknown];

    if (!questionRows || questionRows.length === 0) {
      return NextResponse.json(
        {
          hasTest: false,
          hasSubmitted: false,
          message: "ตำแหน่งงานนี้ไม่มีแบบทดสอบ",
          totalQuestions: 0,
          score: 0,
          scorePercentage: 0,
          questions: [],
        },
        { status: 200 }
      );
    }

    const questionIds = questionRows.map((q) => q.question_id);

    // 3. ดึงตัวเลือก (choices) ทั้งหมดของคำถามชุดนี้
    const [choiceRows] = (await db.query(
      `SELECT choice_id, question_id, choice, correct FROM choice WHERE question_id IN (?) ORDER BY choice_id ASC`,
      [questionIds]
    )) as [ChoiceRow[], unknown];

    // 4. ดึงคำตอบที่ผู้สมัครตอบไว้ (response) สำหรับ tracking_id นี้
    const [responseRows] = (await db.query(
      "SELECT respond_id, tracking_id, choice_id, user_respond FROM response WHERE tracking_id = ?",
      [tracking_id]
    )) as [ResponseRow[], unknown];

    const hasSubmitted = responseRows && responseRows.length > 0;

    let score = 0;
    const formattedQuestions = questionRows.map((q, idx) => {
      const qChoices = choiceRows.filter((c) => c.question_id === q.question_id);
      const qChoiceIds = qChoices.map((c) => c.choice_id);

      // ค้นหาคำตอบของผู้สมัครสำหรับคำถามข้อนี้
      const userResp = responseRows.find((r) => qChoiceIds.includes(r.choice_id));
      const selectedChoiceId = userResp ? userResp.choice_id : null;
      const selectedChoice = qChoices.find((c) => c.choice_id === selectedChoiceId);
      const correctChoice = qChoices.find((c) => c.correct === 1);

      const isCorrect = selectedChoice ? selectedChoice.correct === 1 : false;
      if (isCorrect) {
        score += 1;
      }

      return {
        index: idx + 1,
        questionId: q.question_id,
        question: q.question,
        choices: qChoices.map((c) => ({
          choiceId: c.choice_id,
          choiceText: c.choice,
          isCorrect: c.correct === 1,
          isSelected: c.choice_id === selectedChoiceId,
        })),
        selectedChoiceId,
        selectedChoiceText: selectedChoice ? selectedChoice.choice : userResp?.user_respond || null,
        correctChoiceText: correctChoice ? correctChoice.choice : null,
        isCorrect,
      };
    });

    const totalQuestions = questionRows.length;
    const scorePercentage =
      totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    return NextResponse.json(
      {
        hasTest: true,
        hasSubmitted,
        totalQuestions,
        score,
        scorePercentage,
        questions: formattedQuestions,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error fetching user answers:", errorMsg);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการดึงข้อมูลแบบทดสอบ", error: errorMsg },
      { status: 500 }
    );
  }
}
