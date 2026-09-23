// 📂 วางไฟล์นี้ที่: app/api/company/getCompanyById/[id]/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }, // 1. เปลี่ยนตรงนี้ให้เป็น Promise
) {
    try {
        // 2. ใช้ await เพื่อแกะค่า id ออกมาจาก params
        const resolvedParams = await params;
        const companyId = resolvedParams.id;

        if (!companyId) {
            return NextResponse.json(
                { error: "Missing company id" },
                { status: 400 },
            );
        }

        // ดึงข้อมูลบริษัท
        const [rows]: any = await db.query(
            `SELECT * FROM company WHERE company_id = ?`,
            [companyId],
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { error: "ไม่พบข้อมูลบริษัท" },
                { status: 404 },
            );
        }

        const company = rows[0];

        // ❗ ไม่ส่ง password กลับไปฝั่ง client เด็ดขาด
        delete company.company_password;

        // ดึงตำแหน่งงานที่บริษัทนี้โพสต์ไว้ทั้งหมด
        const [posts]: any = await db.query(
            `SELECT * FROM posts WHERE company_id = ? ORDER BY created_at DESC`,
            [companyId],
        );

        // ดึงรีวิวของบริษัท
        const [reviews]: any = await db.query(
            `SELECT it.tracking_id, it.user_id, it.review_rating, it.review_comment, it.created_review_at, u.profile_image, u.fullname, p.job_position 
             FROM interview_tracking it
             JOIN posts p ON it.post_id = p.post_id
             JOIN User u ON it.user_id = u.uid
             WHERE p.company_id = ? AND it.review_rating IS NOT NULL
             ORDER BY it.created_review_at DESC`,
            [companyId]
        );

        return NextResponse.json({ company, posts, reviews }, { status: 200 });
    } catch (error: any) {
        console.error("Database Error:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", details: error.message },
            { status: 500 },
        );
    }
}