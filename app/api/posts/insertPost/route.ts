import { NextResponse } from "next/server";
import db from '@/lib/db'; // อ้างอิงไฟล์ db ของคุณ
import { cookies } from "next/headers"; //
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("session")?.value;

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 200 });
        }
        const decoded: any = jwt.decode(token);
        const company_id = decoded.id; // ดึง company_id จาก token

        if (decoded.role !== 'company') {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const data = await request.json();
        console.log(decoded);
        console.log(company_id);
        console.log(data);
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
            contact, } = data;
        const formattedDeadline = deadline
            ? deadline.replace("T", " ") + ":00"
            : null;

        const sql = `
            INSERT INTO posts (
                company_id, 
                job_position, 
                work_location, 
                vacancy, 
                job_type, 
                application_dates, 
                job_description, 
                preferred_qualifications, 
                benefits, 
                how_to_apply, 
                contact,
                status,
                created_at,
                salary_min,
                salary_max,
                age_min,
                age_max
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open', NOW(),?,?,?,?)
        `;
        const [result]: any = await db.query(sql, [
            company_id,
            jobPosition,
            workLocation,
            vacancy,
            jobType,
            formattedDeadline,
            jobDescription,
            qualifications,
            benefits,
            howToApply,
            contact,
            salary_min,
            salary_max,
            age_min,
            age_max]);

        return NextResponse.json({ message: "Post created successfully", postId: result.insertId }, { status: 201 });


    } catch (error) {
        console.error("Error processing request:", error);
        return new Response(JSON.stringify({ message: "Error creating post" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}