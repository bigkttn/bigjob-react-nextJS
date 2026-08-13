import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sql = `
      SELECT 
      interview.tracking_id,
        interview.post_id,
        interview.user_id,
        interview.status,
        interview.interview_message,
        interview.date_time,
        posts.job_position,
        posts.company_id,
        u.profile_image,
        u.email,
        u.fullname,
        u.gender,
        u.age,
        u.military_status,
        u.date_of_birth,
        u.nationality,
        u.religion,
        u.weight,
        u.height,
        u.disability_status,
        u.marital_status,
        u.mobile_phone,
        u.line_id,
        u.country,
        u.address,
        u.province,
        u.district,
        u.sub_district,
        u.postal_code,
        u.type_of_work,
        u.available_start_date,
        u.desired_salary,
        u.desired_work_location
      FROM interview_tracking interview
      JOIN User u ON interview.user_id = u.uid
      JOIN posts ON interview.post_id = posts.post_id 
      LEFT JOIN company comp ON posts.company_id = comp.company_id
      WHERE posts.company_id= ?
    `;

    const [rows]: any = await db.query(sql, [id]);
    return NextResponse.json({ rows }, { status: 200 });
  } catch (error: any) {
    console.error("SQL Error:", error.message); // เพิ่ม log ดู error ใน terminal
    return NextResponse.json(
      { message: "Error fetching tracking", error: error.message },
      { status: 500 }
    );
  }
}