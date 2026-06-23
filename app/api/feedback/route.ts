import { NextResponse } from "next/server";
import db from "@/lib/db";

// 📥 GET: ดึงประวัติการส่ง Feedback ของผู้ใช้ (ถอดการแอบสลับสถานะออกแล้ว)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId || isNaN(Number(userId))) {
            return NextResponse.json({ error: "Invalid User ID" }, { status: 400 });
        }

        // ดึงเฉพาะประวัติขึ้นมาเรียงลำดับจากใหม่ไปเก่าอย่างเดียว ไม่แอบอัปเดตอัตโนมัติ
        const [rows]: any = await db.query(
            `SELECT feedback_id, user_id, message, created_at, admin_message, status, replied_at 
             FROM feedbacks_user 
             WHERE user_id = ? 
             ORDER BY created_at DESC`,
            [Number(userId)]
        );

        return NextResponse.json({ feedbacks: rows }, { status: 200 });
    } catch (error: any) {
        console.error("[GET_FEEDBACK_ERROR]:", error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// 🔀 PATCH: อัปเดตสถานะเป็น 'read' เฉพาะรายการที่ผู้ใช้คลิกเลือกบนหน้า UI
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { feedbackId } = body;

        if (!feedbackId || isNaN(Number(feedbackId))) {
            return NextResponse.json({ error: "Invalid Feedback ID" }, { status: 400 });
        }

        // ปรับสถานะเป็น 'read' เฉพาะแถวข้อมูลที่ระบุไอดีเข้ามา และยังไม่ได้กดอ่านมาก่อนหน้า
        await db.query(
            `UPDATE feedbacks_user 
             SET status = 'read' 
             WHERE feedback_id = ? AND status = 'replied'`,
            [Number(feedbackId)]
        );

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error("[PATCH_USER_FEEDBACK_ERROR]:", error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// 📤 POST: บันทึก Feedback ใหม่จาก User ส่งหา Admin
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, message } = body;

        if (!userId || !message || message.trim() === "") {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await db.query(
            `INSERT INTO feedbacks_user (user_id, message, status, created_at) 
             VALUES (?, ?, 'pending', NOW())`,
            [Number(userId), message.trim()]
        );

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error: any) {
        console.error("[POST_FEEDBACK_ERROR]:", error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}