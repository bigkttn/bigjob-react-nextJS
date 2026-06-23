import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";

export type FeedbackStatus = 'pending' | 'read' | 'replied';
export type UserRole = 'seeker' | 'company' | 'admin' | 'user';

export interface IFeedback {
    feedback_id: number;
    message: string;
    created_at: string;
    admin_message: string | null;
    status: FeedbackStatus;
    replied_at: string | null;
    email: string | null;
    role: string;
    source_type: 'user' | 'company'; // 📌 เพิ่มตัวบอกว่ามาจากตารางไหน
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// ============================================================================
// 📥 GET: ดึงประวัติคำติชมทั้งหมด (UNION ALL 2 ตารางเข้าด้วยกัน)
// ============================================================================
export async function GET() {
    try {
        const query = `
      SELECT 
        f.feedback_id, f.message, f.created_at, f.admin_message, f.status, f.replied_at, 
        u.email, COALESCE(u.role, 'user') AS role, 'user' AS source_type
      FROM feedbacks_user f
      LEFT JOIN User u ON f.user_id = u.uid 
      
      UNION ALL
      
      SELECT 
        c.feedback_id, c.message, c.created_at, c.admin_message, c.status, c.replied_at, 
        'Company Account' AS email, 'company' AS role, 'company' AS source_type
      FROM feedbacks_company c
      LEFT JOIN company comp ON c.company_id = comp.company_id 
      
      ORDER BY created_at DESC
    `;

        const [rows] = await db.query<RowDataPacket[]>(query);

        const response: ApiResponse<IFeedback[]> = {
            success: true,
            data: rows as IFeedback[]
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error: any) {
        console.error("[ADMIN_GET_FEEDBACK_ERROR]:", error);
        return NextResponse.json({ success: false, error: "ไม่สามารถดึงข้อมูลคำติชมได้" }, { status: 500 });
    }
}
// ============================================================================
// 📤 PUT: แอดมินบันทึกข้อความตอบกลับ
// ============================================================================
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { feedback_id, admin_message, source_type } = body;

        if (!feedback_id || !admin_message?.trim() || !source_type) {
            return NextResponse.json({ success: false, error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
        }

        // 📌 เลือกตารางที่จะอัปเดตตาม source_type
        const targetTable = source_type === 'company' ? 'feedbacks_company' : 'feedbacks_user';

        const query = `
      UPDATE ${targetTable}
      SET admin_message = ?, status = 'replied', replied_at = NOW()
      WHERE feedback_id = ?
    `;

        await db.query(query, [admin_message.trim(), Number(feedback_id)]);

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error("[ADMIN_REPLY_ERROR]:", error);
        return NextResponse.json({ success: false, error: "บันทึกคำตอบไม่สำเร็จ" }, { status: 500 });
    }
}

// ============================================================================
// 🗑️ DELETE: ลบข้อมูลฟีดแบ็ค
// ============================================================================
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const source_type = searchParams.get("type"); // รับค่า type มาด้วย

        if (!id || !source_type) {
            return NextResponse.json({ success: false, error: "ไม่พบรหัสหรือประเภทที่ระบุ" }, { status: 400 });
        }

        // 📌 เลือกตารางที่จะลบตาม source_type
        const targetTable = source_type === 'company' ? 'feedbacks_company' : 'feedbacks_user';

        await db.query(`DELETE FROM ${targetTable} WHERE feedback_id = ?`, [Number(id)]);

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error("[ADMIN_DELETE_ERROR]:", error);
        return NextResponse.json({ success: false, error: "ลบไม่สำเร็จ" }, { status: 500 });
    }
}