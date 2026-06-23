import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const [rows] = await db.query("SELECT 1");

        return NextResponse.json({
            success: true,
            rows,
        });
    } catch (err) {
        console.error(err);

        return NextResponse.json(
            {
                success: false,
                error: String(err),
            },
            { status: 500 }
        );
    }
}