import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request: Request) {
    try {
        const { post_id, durationDays } = await request.json();

        if (!post_id || durationDays === undefined) {
            return NextResponse.json(
                { error: "Please provide both postId and durationDays" },
                { status: 400 }
            );
        }

        let banUntilDate: string;
        const now = new Date();

        if (Number(durationDays) === 999) {
            banUntilDate = "9999-12-31 23:59:59";
        } else {
            now.setDate(now.getDate() + Number(durationDays));

            const offset = now.getTimezoneOffset() * 60000;
            const localTime = new Date(now.getTime() - offset);

            banUntilDate = now.toISOString().slice(0, 19).replace("T", " ");
        }
        const query = `
                        UPDATE posts
                        SET status = 'banned', ban_until = ?
                        WHERE post_id = ?`;

        const [result]: any = await db.query(query, [banUntilDate, post_id]);

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { erro: "The post to be banned was not found in the system." },
                { status: 404 }
            );
        }

        const queryUpdateReport = `
            UPDATE report_post
            SET status = 1
            WHERE post_id = ?
        `;

        await db.query(queryUpdateReport, [post_id])

        return NextResponse.json({
            message: "banned successfully",
            banUntil: banUntilDate
        },
            { status: 200 }
        );

    } catch (error: any) {
        console.error("Database Error:", error);
        return NextResponse.json(
            { error: "Server Error", details: error.message },
            { status: 500 }
        );
    }
}
