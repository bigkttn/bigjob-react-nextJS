import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { cookies } from "next/headers";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
    // API นี้เรียกได้โดยไม่ต้อง login จึงจำกัดจำนวนครั้งต่อ IP กันการปั่นยอด
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    if (!rateLimit(`visitor:${ip}`, 5, 60_000)) {
        return NextResponse.json(
            { success: false, error: "คุณส่งคำขอมากเกินไป กรุณาลองใหม่อีกครั้งในภายหลัง" },
            { status: 429 },
        );
    }

    try {
        const cookieStore = await cookies();
        const hasVisited = cookieStore.get("hasVisited");
        /* console.log("sss", hasVisited) */

        if (hasVisited) {
            return NextResponse.json({
                success: true,
                message: "นับผู้เข้าชมแล้ว",
            });
        }

        // ใช้คำสั่ง SQL ในการบวกยอดเพิ่มขึ้นทีละ 1 ลงในตาราง site_settings ของ MySQL
        await db.query(
            "UPDATE site_settings SET meta_value = meta_value + 1 WHERE meta_key = 'visitor_count'"
        );

        cookieStore.set("hasVisited", "true", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https'),
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30, // 30 วัน
            path: "/",
        }); // ตั้งคุกกี้ให้หมดอายุใน 30 วัน

        return NextResponse.json({ success: true, message: "นับผู้เข้าชมสำเร็จ" });
    } catch (error) {
        console.error("Database error in visitor tracking:", error);
        return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในระบบ" }, { status: 500 });
    }
}