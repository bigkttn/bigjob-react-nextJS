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

            const thaiTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));

            banUntilDate = thaiTime.toISOString().slice(0, 19).replace("T", " ");
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


// ระบบปลดแบนโพสต์ (DELETE)
export async function DELETE(request: Request) {
    try {
        // รับค่า post_id จาก URL Parameters (เช่น /api/admin/post/Ban?post_id=123)
        const { searchParams } = new URL(request.url);
        const post_id = searchParams.get("post_id");

        if (!post_id) {
            return NextResponse.json(
                { error: "Please provide post_id" },
                { status: 400 }
            );
        }

        // อัปเดตสถานะกลับเป็นปกติ (เช่น 'active') และล้างค่า ban_until เป็น NULL
        const query = `
      UPDATE posts
      SET status = 'active', ban_until = NULL
      WHERE post_id = ?
    `;

        const [result]: any = await db.query(query, [post_id]);

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { error: "Post not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Unbanned successfully" },
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