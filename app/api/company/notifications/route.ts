import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");

        if (!companyId || isNaN(Number(companyId))) {
            return NextResponse.json({ error: "Invalid Company ID" }, { status: 400 });
        }

        // 🌟 ดึง connection เดี่ยวออกจาก pool เพื่อให้อยู่ใน Session เครือข่ายเดียวกัน
        const connection = await db.getConnection();

        try {
            // 1. สร้าง MySQL TEMPORARY TABLE ขึ้นมาใน Session ปัจจุบัน
            await connection.query(`
                CREATE TEMPORARY TABLE IF NOT EXISTS temp_company_unread_counter (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    fb_id INT
                )
            `);

            // ล้างข้อมูลขยะในตารางชั่วคราวของ Session นี้ก่อนหน้า (ถ้ามี)
            await connection.query(`TRUNCATE TABLE temp_company_unread_counter`);

            // 2. ดึงเฉพาะไอดี Feedback ของบริษัทนี้ที่มีการตอบกลับ (replied) มาใส่ลงตารางชั่วคราว
            await connection.query(`
                INSERT INTO temp_company_unread_counter (fb_id)
                SELECT feedback_id FROM feedbacks_company 
                WHERE company_id = ? AND status = 'replied'
            `, [Number(companyId)]);

            // 3. ทำการ Query นับจำนวนสรุปยอดจาก TEMPORARY TABLE ตามโจทย์
            const [rows]: any = await connection.query(`
                SELECT COUNT(*) as unreadCount FROM temp_company_unread_counter
            `);

            const unreadCount = rows[0]?.unreadCount || 0;

            return NextResponse.json({ unreadCount }, { status: 200 });
        } finally {
            // 🌟 คืน connection กลับเข้า pool (ตาราง TEMPORARY TABLE จะถูก Drop ทิ้งจากหน่วยความจำอัตโนมัติ)
            connection.release();
        }
    } catch (error: any) {
        console.error("[COMPANY_NOTIFICATIONS_TEMP_TABLE_ERROR]:", error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}