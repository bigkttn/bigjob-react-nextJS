import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const role = searchParams.get("role");

    if (!userId || !role) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    if (role === "seeker") {
      const sql = `
        SELECT 
          interview.tracking_id,
          interview.status,
          interview.interview_date,
          interview.link,
          interview.location,
          posts.job_position,
          comp.company_name
        FROM interview_tracking interview
        JOIN posts ON interview.post_id = posts.post_id 
        LEFT JOIN company comp ON posts.company_id = comp.company_id
        WHERE interview.user_id = ? AND (interview.status = 'นัดสัมภาษณ์' OR interview.status = 'รอสัมภาษณ์' OR interview.interview_date >= CURDATE())
        ORDER BY interview.interview_date ASC
      `;
      const [rows] = await db.query(sql, [userId]) as [any[], any];
      return NextResponse.json({ rows }, { status: 200 });
    } else if (role === "company") {
      const sql = `
        SELECT 
          interview.tracking_id,
          interview.status,
          interview.interview_date,
          interview.date_time,
          interview.link,
          interview.location,
          posts.post_id,
          posts.job_position,
          u.fullname as applicant_name
        FROM interview_tracking interview
        JOIN posts ON interview.post_id = posts.post_id 
        JOIN User u ON interview.user_id = u.uid
        WHERE posts.company_id = ? AND (interview.status = 'นัดสัมภาษณ์' OR interview.status = 'รอสัมภาษณ์' OR interview.interview_date >= CURDATE())
        ORDER BY interview.interview_date ASC
      `;
      const [rows] = await db.query(sql, [userId]) as [any[], any];
      return NextResponse.json({ rows }, { status: 200 });
    }

    return NextResponse.json({ rows: [] }, { status: 200 });
  } catch (error) {
    console.error("Error fetching upcoming interviews:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
