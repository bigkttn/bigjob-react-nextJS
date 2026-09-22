import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { message: "กรุณาส่ง company_id มาให้ครบถ้วน" },
        { status: 400 },
      );
    }
    const [rows]: any = await db.query(
      `SELECT 
        fav_post.favour_id,
        fav_post.post_id,
        fav_post.created_at AS saved_at,
        posts.post_id,
        CASE 
            WHEN posts.application_dates < NOW() THEN 'closed'
            ELSE 'Open' 
        END AS status,
        posts.province,
        posts.job_type,
        posts.salary_min,
        posts.salary_max,
        posts.created_at AS post_created_at,
        co.company_id AS cid,
        co.company_name AS name,
        co.logo_image AS logo,
        posts.job_position as job_title
     FROM favour_post fav_post
     INNER JOIN posts ON fav_post.post_id = posts.post_id
     INNER JOIN company co ON posts.company_id = co.company_id
     WHERE fav_post.user_id = ?`,
      [user_id],
    );


    const formattedData = rows.map((row: any) => ({
      cid: row.cid,
      post_id: row.post_id,
      name: row.name,
      job_title: row.job_title || "General Company",
      logo: row.logo || null,
      created_at: row.saved_at,
      post_created_at: row.post_created_at,
      status: row.status,
      province: row.province,
      job_type: row.job_type,
      salary_min: row.salary_min,
      salary_max: row.salary_max
    }));

    return NextResponse.json(
      formattedData,
      { status: 200 },
    );
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", error },
      { status: 500 },
    );
  }
}
