// 📂 วางไฟล์นี้ที่: app/api/admin/verify/[id]/route.ts (ทับไฟล์เดิม)
import { NextResponse } from "next/server";
import db from "@/lib/db";

const ALLOWED_STATUS = ["Pending", "Approved", "Rejected"];

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id: companyId } = await params;
        const body = await request.json();
        const { verification_status, verification_comment } = body;

        if (!companyId) {
            return NextResponse.json(
                { error: "Missing company id" },
                { status: 400 },
            );
        }

        if (!ALLOWED_STATUS.includes(verification_status)) {
            return NextResponse.json(
                { error: "verification_status ไม่ถูกต้อง" },
                { status: 400 },
            );
        }

        // ถ้า reject ควรมี comment อธิบายเหตุผลให้บริษัทแก้ไขได้ตรงจุด
        if (verification_status === "Rejected" && !verification_comment) {
            return NextResponse.json(
                { error: "กรุณาระบุเหตุผลในการปฏิเสธ (verification_comment)" },
                { status: 400 },
            );
        }

        await db.query(
            `UPDATE company
       SET verification_status = ?, verification_comment = ?, updated_at = CURRENT_TIMESTAMP
       WHERE company_id = ?`,
            [verification_status, verification_comment ?? null, companyId],
        );

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error("Database Error:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", details: error.message },
            { status: 500 },
        );
    }
}