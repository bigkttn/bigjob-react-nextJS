import { NextResponse } from "next/server";
import db from '@/lib/db';
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("session")?.value;

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const decoded: any = jwt.decode(token);
        if (decoded.role !== "company") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const { id: postId } = await params;
        const data = await request.json();

        const {
            job_position,
            work_location,
            salary_min,
            salary_max,
            age_min,
            age_max,
            vacancy,
            job_type,
            application_dates,
            job_description,
            preferred_qualifications,
            Benefits,
            how_to_apply,
            contact,
            status,
        } = data;

        // เปลี่ยนมาใช้การจับ String แทน เพื่อรักษาตัวเลขเวลาเดิมที่ผู้ใช้เลือกไว้
        const formattedDeadline = application_dates
            ? application_dates.replace("T", " ").slice(0, 19) // แปลง "2026-06-03T15:35" เป็น "2026-06-03 15:35:00" ใน MySQL ท้องถิ่น
            : null;

        const sql = `
        UPDATE posts SET
        job_position            = ?,
        work_location           = ?,
        salary_min              = ?,
        salary_max              = ?,
        age_min                 = ?,
        age_max                 = ?,
        vacancy                 = ?,
        job_type                = ?,
        application_dates       = ?,
        job_description         = ?,
        preferred_qualifications = ?,
        Benefits                = ?,
        how_to_apply            = ?,
        contact                 = ?,
        status                  = ?
        WHERE post_id = ? AND company_id = ?
    `;

        // AND company_id = ? ป้องกันไม่ให้บริษัทอื่นแก้โพสต์ที่ไม่ใช่ของตัวเอง
        const [result]: any = await db.query(sql, [
            job_position,
            work_location,
            salary_min,
            salary_max,
            age_min,
            age_max,
            vacancy,
            job_type,
            formattedDeadline,
            job_description,
            preferred_qualifications,
            Benefits,
            how_to_apply,
            contact,
            status,
            postId,
            decoded.id,
        ]);

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { message: "Post not found or unauthorized" },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: "Post updated successfully" }, { status: 200 });

    } catch (error) {
        console.error("Error updating post:", error);
        return NextResponse.json({ message: "Error updating post" }, { status: 500 });
    }
}