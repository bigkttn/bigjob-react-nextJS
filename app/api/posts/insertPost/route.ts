// app/api/posts/insertPost/route.ts (หรือไฟล์ API ของคุณ)
import { NextResponse } from "next/server";
import db from '@/lib/db';
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("session")?.value;

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 }); // เปลี่ยนสถานะเป็น 401 ให้ถูกต้องตามหลักการ
        }
        const decoded: any = jwt.decode(token);
        const company_id = decoded.id;

        if (decoded.role !== 'company') {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        // 🔍 [เพิ่มส่วนนี้] ตรวจสอบสถานะการยืนยันตัวตนของบริษัทจาก Database
        const [companyRows]: any = await db.query(
            "SELECT verification_status FROM company WHERE company_id = ?",
            [company_id]
        );

        if (!companyRows || companyRows.length === 0) {
            return NextResponse.json({ message: "Company not found" }, { status: 404 });
        }

        const verificationStatus = companyRows[0].verification_status;
        if (verificationStatus !== "Approved") {
            return NextResponse.json(
                { message: "ยังไม่ได้ยืนยันตัวตนบริษัท หรือ รอการอนุมัติสถานะ" },
                { status: 403 }
            );
        }

        // ── ข้อมูลเดิมของคุณ ─────────────────────────────────
        const data = await request.json();
        const {
            jobPosition,
            workLocation,
            salary_min,
            salary_max,
            age_min,
            age_max,
            vacancy,
            jobType,
            deadline,
            jobDescription,
            qualifications,
            benefits,
            howToApply,
            contact,
        } = data;

        const formattedDeadline = deadline
            ? deadline.replace("T", " ") + ":00"
            : null;

        const sql = `
            INSERT INTO posts (
                company_id, job_position, work_location, vacancy, job_type, 
                application_dates, job_description, preferred_qualifications, 
                benefits, how_to_apply, contact, status, created_at,
                salary_min, salary_max, age_min, age_max
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open', NOW(),?,?,?,?)
        `;

        const [result]: any = await db.query(sql, [
            company_id, jobPosition, workLocation, vacancy, jobType,
            formattedDeadline, jobDescription, qualifications, benefits,
            howToApply, contact, salary_min, salary_max, age_min, age_max
        ]);

        return NextResponse.json({ message: "Post created successfully", postId: result.insertId }, { status: 201 });

    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ message: "Error creating post" }, { status: 500 });
    }
}