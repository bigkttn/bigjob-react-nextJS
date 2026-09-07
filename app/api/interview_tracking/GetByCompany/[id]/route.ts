import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. ดึงข้อมูลหลัก (Tracking + Job + Profile)
    const sqlMain = `
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
      LEFT JOIN User u ON interview.user_id = u.uid
      LEFT JOIN posts ON interview.post_id = posts.post_id 
      LEFT JOIN company comp ON posts.company_id = comp.company_id
      WHERE posts.company_id = ?
    `;

    const [applicants] = await db.query(sqlMain, [id]) as [any[], unknown];

    if (!applicants.length) {
      return NextResponse.json({ rows: [] }, { status: 200 });
    }

    // 2. ดึงข้อมูลตารางประกอบ (Skills, Experiences, Files, Languages, Typing) ของผู้สมัครทั้งหมด
    const userIds = applicants.map((a) => a.user_id).filter(Boolean);

    if (userIds.length > 0) {
      const placeholders = userIds.map(() => "?").join(",");

      const [skills] = await db.query(
        `SELECT * FROM skills WHERE user_id IN (${placeholders})`, userIds
      ) as [any[], unknown];

      const [experiences] = await db.query(
        `SELECT * FROM experiences WHERE user_id IN (${placeholders})`, userIds
      ) as [any[], unknown];

      const [files] = await db.query(
        `SELECT * FROM files WHERE user_id IN (${placeholders})`, userIds
      ) as [any[], unknown];

      const [languages] = await db.query(
        `SELECT * FROM language_proficiency WHERE user_id IN (${placeholders})`, userIds
      ) as [any[], unknown];

      const [typingSpeed] = await db.query(
        `SELECT * FROM typing_speed WHERE user_id IN (${placeholders})`, userIds
      ) as [any[], unknown];

      // 3. นำข้อมูลย่อยแมปเข้ากับผู้สมัครแต่ละคน
      applicants.forEach((applicant) => {
        applicant.skills = skills.filter((s) => s.user_id === applicant.user_id);
        applicant.experiences = experiences.filter((e) => e.user_id === applicant.user_id);
        applicant.files = files.filter((f) => f.user_id === applicant.user_id);
        applicant.languages = languages.filter((l) => l.user_id === applicant.user_id);
        applicant.typing_speed = typingSpeed.filter((t) => t.user_id === applicant.user_id);
      });
    }

    return NextResponse.json({ rows: applicants }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("SQL Error:", errorMessage);
    return NextResponse.json(
      { message: "Error fetching tracking", error: errorMessage },
      { status: 500 }
    );
  }
}