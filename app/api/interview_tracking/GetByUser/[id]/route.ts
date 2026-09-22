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
        interview.status,
        interview.interview_message,
        interview.interview_date AS interview_date,
        interview.date_time,
        interview.link,
        interview.location,
        posts.post_id,
        posts.job_position,
        posts.job_description AS details,
        posts.preferred_qualifications,
        posts.Benefits,
        posts.province,
        posts.work_location,
        posts.vacancy AS rate,
        posts.how_to_apply,
        posts.contact,
        posts.job_type,
        posts.salary_min,
        posts.salary_max,
        posts.age_min,
        posts.age_max,
        comp.company_email,
        comp.company_name,
        comp.logo_image 
      FROM interview_tracking interview
      JOIN posts ON interview.post_id = posts.post_id 
      LEFT JOIN company comp ON posts.company_id = comp.company_id
      WHERE interview.user_id = ?
    `;

    const [rows]: any = await db.query(sql, [id]);
    return NextResponse.json({ rows }, { status: 200 });
  } catch (error: any) {
    console.error("SQL Error:", error.message);
    return NextResponse.json(
      { message: "Error fetching tracking", error: error.message },
      { status: 500 }
    );
  }
}