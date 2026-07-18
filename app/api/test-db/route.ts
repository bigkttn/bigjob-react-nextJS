import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const [rows] = await db.query("SELECT * FROM User");

        return NextResponse.json({
            success: true,
            data: rows,
        });
    } catch (error) {
        console.error("Get users error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch users",
            },
            { status: 500 }
        );
    }
}