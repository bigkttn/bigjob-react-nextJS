// (อยู่ระดับเดียวกับ admin/feedbacks และ admin/verify/[id])
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        // ?status=Pending | Approved | Rejected — ถ้าไม่ส่งมา จะดึงมาทั้งหมด
        const status = searchParams.get("status");

        let query = `
                    SELECT company_id, company_name, logo_image, dbd_file,
                            verification_status, verification_comment, created_at
                    FROM company`;
        const values: any[] = [];

        if (status) {
            query += ` WHERE verification_status = ?`;
            values.push(status);
        }

        query += ` ORDER BY created_at DESC`;

        const [rows]: any = await db.query(query, values);

        return NextResponse.json({ companies: rows }, { status: 200 });
    } catch (error: any) {
        console.error("Database Error:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", details: error.message },
            { status: 500 },
        );
    }
}