import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tracking_id = searchParams.get("tracking_id");

    if (!tracking_id) {
      return NextResponse.json({ error: "ไม่ได้ระบุรหัสใบสมัคร" }, { status: 400 });
    }

    const sql = `DELETE FROM interview_tracking WHERE tracking_id = ?`;
    await db.query(sql, [tracking_id]);

    return NextResponse.json({ message: "ลบสำเร็จ" }, { status: 200 });
  } catch (error: any) {
    console.error("Delete tracking error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
