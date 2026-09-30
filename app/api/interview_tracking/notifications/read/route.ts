import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { trackingId, userType } = body;

        if (!trackingId || !userType) {
            return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
        }

        const updateField = userType === "user" ? "unread_user" : "unread_company";
        const targetValue = userType === "user" ? "unread_company" : "unread_user"; // We use 'read' below if it's not unread_both
        
        const [rows]: any = await db.query(`SELECT status_notification FROM interview_tracking WHERE tracking_id = ?`, [trackingId]);
        if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
        
        const currentStatus = rows[0].status_notification;
        let newStatus = "read";
        if (currentStatus === "unread_both") {
            newStatus = targetValue;
        }

        await db.query(`UPDATE interview_tracking SET status_notification = ? WHERE tracking_id = ?`, [newStatus, trackingId]);

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error("[MARK_SINGLE_TRACKING_READ_ERROR]:", error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { userId, role } = body;

        if (!userId || isNaN(Number(userId)) || !role) {
            return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
        }

        let updateSql = "";
        let updateBothSql = "";
        if (role === "seeker") {
            updateSql = `UPDATE interview_tracking SET status_notification = 'read' WHERE user_id = ? AND status_notification = 'unread_user'`;
            updateBothSql = `UPDATE interview_tracking SET status_notification = 'unread_company' WHERE user_id = ? AND status_notification = 'unread_both'`;
            await db.query(updateSql, [Number(userId)]);
            await db.query(updateBothSql, [Number(userId)]);
        } else if (role === "company") {
            updateSql = `UPDATE interview_tracking it JOIN posts p ON it.post_id = p.post_id SET it.status_notification = 'read' WHERE p.company_id = ? AND it.status_notification = 'unread_company'`;
            updateBothSql = `UPDATE interview_tracking it JOIN posts p ON it.post_id = p.post_id SET it.status_notification = 'unread_user' WHERE p.company_id = ? AND it.status_notification = 'unread_both'`;
            await db.query(updateSql, [Number(userId)]);
            await db.query(updateBothSql, [Number(userId)]);
        } else {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error("[MARK_TRACKING_NOTIFICATION_READ_ERROR]:", error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
