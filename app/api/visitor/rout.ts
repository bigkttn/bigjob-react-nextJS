import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
    try {
        await db.query("UPDATE company set view_count = view_count + 1");
        return NextResponse.json({ message: "View count updated successfully" }, { status: 200 });
    } catch (error) {
        // ถ้า Token หมดอายุหรือผิดพลาด ให้มองว่าไม่ได้ล็อกอิน
        return NextResponse.json({ user: null }, { status: 200 });
    }
}