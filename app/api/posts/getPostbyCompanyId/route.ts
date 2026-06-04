import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { cookies } from "next/headers"; //
import jwt from "jsonwebtoken";
export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("session")?.value;

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // const decoded: any = jwt.decode(token);
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        const company_id = decoded.id;
        console.log(company_id);

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
        return NextResponse.json(rows, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching posts" }, { status: 500 });
    }
}