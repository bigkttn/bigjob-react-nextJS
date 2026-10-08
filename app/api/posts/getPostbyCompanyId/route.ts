import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { cookies } from "next/headers"; //
import jwt from "jsonwebtoken";
import { omitEmbeddings } from "@/lib/omitEmbedding";
export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("session")?.value;

        if (!token) {
            return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
        }

        // const decoded: any = jwt.decode(token);
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        const company_id = decoded.id;
        /* console.log(company_id) */;

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