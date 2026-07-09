import { NextResponse } from "next/server";
// ⚠️ เปลี่ยนคีย์ด้านล่างนี้ให้ตรงกับตัวเชื่อมต่อ Database หรือ ORM (เช่น Prisma/Knex/pg) ที่คุณเตรียมไว้ในโปรเจกต์
import db from "@/lib/db";
import { cookies } from "next/headers";

export async function POST() {
    try {
        const cookieStore = await cookies();
        const hasVisited = cookieStore.get("hasVisited");

        if (hasVisited) {
            return NextResponse.json({
                success: true,
                message: "Visitor already counted",
            });
        }

        // ใช้คำสั่ง SQL ในการบวกยอดเพิ่มขึ้นทีละ 1 ลงในตาราง site_settings ของ MySQL
        await db.query(
            "UPDATE site_settings SET meta_value = meta_value + 1 WHERE meta_key = 'visitor_count'"
        );

        cookieStore.set("hasVisited", "true", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30, // 30 วัน
            path: "/",
        }); // ตั้งคุกกี้ให้หมดอายุใน 30 วัน

        return NextResponse.json({ success: true, message: "Visitor counted successfully" });
    } catch (error) {
        console.error("Database error in visitor tracking:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}