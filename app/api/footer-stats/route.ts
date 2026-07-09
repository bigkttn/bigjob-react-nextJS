import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
    try {
        const [rows]: any = await db.query("SELECT * FROM v_footer_statistics LIMIT 1");
        const stats = rows[0] || {
            total_users: 0,
            general_users: 0,
            companies: 0,
            all_jobs: 0,
            visitors: 0
        }
        return NextResponse.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("Database error in footer stats:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}