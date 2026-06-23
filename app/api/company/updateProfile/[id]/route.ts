// 📂 วางไฟล์นี้ที่: app/api/company/updateProfile/[id]/route.ts (ทับไฟล์เดิม)
import { NextResponse } from "next/server";
import db from "@/lib/db";

// ✅ ฟิลด์ที่ "อนุญาต" ให้บริษัทแก้ไขเองได้จากหน้าโปรไฟล์
// 🆕 เพิ่ม dbd_file เข้ามา เพราะบริษัทต้องอัปโหลดหนังสือรับรองได้เอง
// ❌ ยังคงห้าม verification_status / verification_comment / banned_until /
//    company_email / company_password อยู่ในลิสต์นี้เด็ดขาด — ค่าพวกนี้
//    ต้องถูกควบคุมโดย Admin (ผ่าน /api/admin/verify/[id]) เท่านั้น
const EDITABLE_FIELDS = [
    "company_name",
    "business_type",
    "mobile_phone",
    "contact_information",
    "brief_history",
    "logo_image",
    "cover_image",
    "company_longitude",
    "company_latitude",
    "province",
    "district",
    "sub_district",
    "full_address",
    "postcode",
    "dbd_file",
];

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id: companyId } = await params;
        const body = await request.json();

        if (!companyId) {
            return NextResponse.json(
                { error: "Missing company id" },
                { status: 400 },
            );
        }

        const fieldsToUpdate: string[] = [];
        const values: any[] = [];

        for (const field of EDITABLE_FIELDS) {
            if (field in body) {
                fieldsToUpdate.push(`${field} = ?`);
                values.push(body[field]);
            }
        }

        if (fieldsToUpdate.length === 0) {
            return NextResponse.json(
                { error: "ไม่มีข้อมูลที่ถูกต้องสำหรับการอัปเดต" },
                { status: 400 },
            );
        }

        // 🆕 ถ้าบริษัทอัปโหลดไฟล์หนังสือรับรองใหม่ (dbd_file) ระบบจะรีเซ็ตสถานะ
        // การตรวจสอบกลับเป็น "Pending" และล้าง comment เดิมโดยอัตโนมัติ
        // เพราะ Admin ต้องตรวจสอบไฟล์ใหม่อีกครั้งเสมอ ป้องกัน badge "verified"
        // ค้างอยู่จากไฟล์เก่าที่ไม่ตรงกับไฟล์ที่อัปโหลดล่าสุด
        if ("dbd_file" in body) {
            fieldsToUpdate.push(`verification_status = ?`);
            values.push("Pending");
            fieldsToUpdate.push(`verification_comment = ?`);
            values.push(null);
        }

        values.push(companyId);

        await db.query(
            `UPDATE company SET ${fieldsToUpdate.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE company_id = ?`,
            values,
        );

        const [rows]: any = await db.query(
            `SELECT * FROM company WHERE company_id = ?`,
            [companyId],
        );
        const company = rows[0];
        delete company.company_password;

        return NextResponse.json({ success: true, company }, { status: 200 });
    } catch (error: any) {
        console.error("Database Error:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", details: error.message },
            { status: 500 },
        );
    }
}