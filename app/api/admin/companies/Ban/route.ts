import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request: Request) {
    try {
        const { company_id, durationDays } = await request.json();

        // 1. แก้ข้อความแจ้งเตือนให้ตรงกับ company_id
        if (!company_id || durationDays === undefined) {
            return NextResponse.json(
                { error: "Please provide both company_id and durationDays" },
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
            UPDATE company
            SET banned_until = ?
            WHERE company_id = ?
        `;

        const [result]: any = await db.query(query, [banUntilDate, company_id]);

        if (result.affectedRows === 0) {
            // 2. แก้ erro เป็น error และปรับข้อความให้เป็น Company
            return NextResponse.json(
                { error: "The company to be banned was not found in the system." },
                { status: 404 }
            );
        }

        const queryUpdateReport = `
            UPDATE report_company
            SET status = 1
            WHERE company_id = ?
        `;

        await db.query(queryUpdateReport, [company_id]);

        return NextResponse.json({
            message: "banned successfully",
            banUntil: banUntilDate
        }, { status: 200 });

    } catch (error: any) {
        console.error("Database Error:", error);
        return NextResponse.json(
            { error: "Server Error", details: error.message },
            { status: 500 }
        );
    }
}

// ระบบปลดแบนบริษัท (DELETE) -> ล้างค่า banned_until ให้เป็น NULL และเปลี่ยน status รายงานเป็น 3 (ปลดแบน)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const company_id = searchParams.get("company_id");

    if (!company_id) {
      return NextResponse.json(
        { error: "Please provide company_id" },
        { status: 400 }
      );
    }

    // 1. ล้างค่า banned_until ให้เป็น NULL ในตาราง company
    const query = `
      UPDATE company
      SET banned_until = NULL
      WHERE company_id = ?
    `;
    const [result]: any = await db.query(query, [company_id]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // 2. อัปเดตสถานะในตาราง report_company ให้เป็น 3 (ปลดแบน)
    const queryUpdateReport = `
      UPDATE report_company
      SET status = 3
      WHERE company_id = ?
    `;
    await db.query(queryUpdateReport, [company_id]);

    return NextResponse.json(
      { message: "Unbanned company successfully" },
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