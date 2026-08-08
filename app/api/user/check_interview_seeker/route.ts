import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { postId, userId } = body;

  if (!postId || !userId) {
    return NextResponse.json(
      { message: "Missing postId or userId" },
      { status: 400 }
    );
  }

  const { rows }: any = await db.query(
    `SELECT * FROM interview_tracking WHERE post_id = ? AND user_id = ?`,
    [postId, userId]
  );

  if (rows && rows.length > 0) {
    return NextResponse.json(
      { message: "คุณได้ทำการสมัครงานในตำแหน่งนี้ไปแล้ว" },
      { status: 400 }
    );
  }

  return NextResponse.json({ exists: false }, { status: 200 });
}