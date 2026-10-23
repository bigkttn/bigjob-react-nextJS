import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { resolveCompanyId } from "@/lib/postCompany";
import { omitEmbeddings } from "@/lib/omitEmbedding";
export async function GET(request: NextRequest) {
    try {
        // ไม่ได้ login: ส่ง ?company_id= มาแทน
        const company = await resolveCompanyId(request.nextUrl.searchParams.get("company_id"));
        if (!company.ok) {
            return NextResponse.json({ message: company.message }, { status: company.status });
        }
        const company_id = company.companyId;

        const [rows] = await db.query(
            `SELECT *,
                CASE 
                    WHEN application_dates < NOW() THEN 'closed'
                    ELSE 'Open'  
                END AS status
             FROM posts
             WHERE company_id = ?
             ORDER BY created_at DESC`,
            [company_id]
        );
        return NextResponse.json(omitEmbeddings(rows as { embedding?: unknown }[]), { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "ดึงข้อมูลประกาศงานไม่สำเร็จ" }, { status: 500 });
    }
}