import { NextResponse } from "next/server";
import db from '@/lib/db';
import { resolveCompanyId } from "@/lib/postCompany";

type RouteContext = { params: Promise<{ id: string }> };

// PUT คือการแทนที่ข้อมูลโพสต์ทั้งหมด จึงต้องส่งมาครบทุกช่อง
const PUT_REQUIRED_FIELDS = [
    "job_position",
    "province",
    "work_location",
    "salary_min",
    "salary_max",
    "age_min",
    "age_max",
    "vacancy",
    "job_type",
    "application_dates",
    "job_description",
    "preferred_qualifications",
    "Benefits",
    "how_to_apply",
    "contact",
    "status",
];

const isEmpty = (value: unknown) => value === undefined || value === null || value === "";

async function updatePost(
    request: Request,
    { params }: RouteContext,
    requireAllFields: boolean
) {
    try {
        const { id: postId } = await params;
        const data = await request.json();

        const company = await resolveCompanyId(data.company_id);
        if (!company.ok) {
            return NextResponse.json({ message: company.message }, { status: company.status });
        }

        if (requireAllFields) {
            const missingFields = PUT_REQUIRED_FIELDS.filter((field) => isEmpty(data[field]));
            if (missingFields.length > 0) {
                return NextResponse.json(
                    { message: "กรุณาส่งข้อมูลให้ครบทุกช่อง", missingFields },
                    { status: 400 }
                );
            }
        }

        const {
            job_position,
            province,
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
        province                = ?,
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
            province,
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
            company.companyId,
        ]);

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { message: "ไม่พบประกาศงาน หรือไม่มีสิทธิ์แก้ไข" },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: "แก้ไขประกาศงานสำเร็จ" }, { status: 200 });

    } catch (error) {
        console.error("Error updating post:", error);
        return NextResponse.json({ message: "แก้ไขประกาศงานไม่สำเร็จ" }, { status: 500 });
    }
}

// PATCH: หน้าแก้ไขโพสต์ของบริษัทใช้อยู่ (app/company/detail/[id]/page.tsx)
export async function PATCH(request: Request, context: RouteContext) {
    return updatePost(request, context, false);
}

// PUT: แทนที่ข้อมูลโพสต์ทั้งหมด ขาดช่องไหนตอบ 400
export async function PUT(request: Request, context: RouteContext) {
    return updatePost(request, context, true);
}