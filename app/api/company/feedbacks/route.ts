import { NextResponse } from "next/server";
import db from "@/lib/db";

// 📥 GET: ดึงประวัติการส่ง Feedback (ถอดการ UPDATE เหมาเข่งออกแล้ว)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");

        if (!companyId || isNaN(Number(companyId))) {
            return NextResponse.json({ error: "Invalid Company ID" }, { status: 400 });
        }

        // ดึงประวัติทั้งหมดมาแสดงเรียงจากใหม่ไปเก่าตามปกติ โดยไม่แอบเปลี่ยนสถานะอัตโนมัติแล้ว
        const [rows]: any = await db.query(
            `SELECT feedback_id, company_id, message, created_at, admin_message, status, replied_at 
             FROM feedbacks_company 
             WHERE company_id = ? 
             ORDER BY created_at DESC`,
            [Number(companyId)]
        );

        return NextResponse.json({ feedbacks: rows }, { status: 200 });
    } catch (error: any) {
        console.error("[GET_COMPANY_FEEDBACK_ERROR]:", error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// 🔀 PATCH: อัปเดตสถานะเป็น 'read' เฉพาะรายการที่บริษัทกดคลิกอ่านเท่านั้น
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { feedbackId } = body;

        if (!feedbackId || isNaN(Number(feedbackId))) {
            return NextResponse.json({ error: "Invalid Feedback ID" }, { status: 400 });
        }

        // ปรับสถานะเป็น 'read' เฉพาะของ ID นี้ และต้องเป็นรายการที่ Admin เคยตอบกลับมาแล้ว ('replied')
        await db.query(
            `UPDATE feedbacks_company 
             SET status = 'read' 
             WHERE feedback_id = ? AND status = 'replied'`,
            [Number(feedbackId)]
        );

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error("[PATCH_COMPANY_FEEDBACK_ERROR]:", error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// 📤 POST: บันทึก Feedback ใหม่จาก Company ส่งหา Admin (เหมือนเดิม)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { companyId, message } = body;

        if (!companyId || !message || message.trim() === "") {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await db.query(
            `INSERT INTO feedbacks_company (company_id, message, status, created_at) 
             VALUES (?, ?, 'pending', NOW())`,
            [Number(companyId), message.trim()]
        );

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error: any) {
        console.error("[POST_COMPANY_FEEDBACK_ERROR]:", error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}