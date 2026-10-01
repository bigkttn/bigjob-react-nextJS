import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const role = searchParams.get("role");

        if (!userId || isNaN(Number(userId)) || !role) {
            return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
        }

        let query = "";
        let params: any[] = [];

        if (role === "seeker") {
            query = `
                SELECT 
                    it.tracking_id, 
                    it.status, 
                    it.date_time, 
                    p.job_position as title, 
                    c.company_name as sender_name,
                    c.logo_image as sender_image
                FROM interview_tracking it
                JOIN posts p ON it.post_id = p.post_id
                JOIN company c ON p.company_id = c.company_id
                WHERE it.user_id = ? AND it.status_notification IN ('unread_user', 'unread_both')
                ORDER BY it.date_time DESC
            `;
            params = [Number(userId)];
        } else if (role === "company") {
            query = `
                SELECT 
                    it.tracking_id, 
                    it.status, 
                    it.date_time, 
                    p.job_position as title, 
                    u.fullname as sender_name,
                    u.profile_image as sender_image
                FROM interview_tracking it
                JOIN posts p ON it.post_id = p.post_id
                JOIN User u ON it.user_id = u.uid
                WHERE p.company_id = ? AND it.status_notification IN ('unread_company', 'unread_both')
                ORDER BY it.date_time DESC
            `;
            params = [Number(userId)];
        } else {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        const [rows]: any = await db.query(query, params);

        return NextResponse.json({ notifications: rows, unreadCount: rows.length }, { status: 200 });
    } catch (error: any) {
        console.error("[TRACKING_NOTIFICATIONS_ERROR]:", error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
