import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId || isNaN(Number(userId))) {
            return NextResponse.json({ error: "Invalid User ID" }, { status: 400 });
        }

        const connection = await db.getConnection();

        try {
            await connection.query(`
                CREATE TEMPORARY TABLE IF NOT EXISTS temp_unread_counter (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    fb_id INT
                )
            `);

            await connection.query(`TRUNCATE TABLE temp_unread_counter`);

            await connection.query(`
                INSERT INTO temp_unread_counter (fb_id)
                SELECT feedback_id FROM feedbacks_user 
                WHERE user_id = ? AND status = 'replied'
            `, [Number(userId)]);

            const [rows]: any = await connection.query(`
                SELECT COUNT(*) as unreadCount FROM temp_unread_counter
            `);

            const unreadCount = rows[0]?.unreadCount || 0;

            return NextResponse.json({ unreadCount }, { status: 200 });
        } finally {
            connection.release();
        }
    } catch (error: any) {
        console.error("[NOTIFICATIONS_TEMP_TABLE_ERROR]:", error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}