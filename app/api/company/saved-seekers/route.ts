import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // รับ company_id เข้ามาเพื่อระบุตัวตนของบริษัทที่กำลังเรียกดูข้อมูล
    const { company_id } = body;

    if (!company_id) {
      return NextResponse.json(
        { message: "กรุณาส่ง company_id มาให้ครบถ้วน" },
        { status: 400 },
      );
    }

    // เขียนคำสั่ง SQL INNER JOIN ระหว่างตาราง favour_user และ User
    const [rows]: any = await db.query(
      `SELECT 
        fu.favour_id,
        fu.company_id,
        u.uid,
        u.fullname AS name,
        u.profile_image AS image,
        jobU.job_name AS jobtitle, 
        u.gender,
        u.age,
        u.military_status AS militaryStatus,
        u.date_of_birth AS dateOfBirth,
        u.nationality,
        u.religion,
        u.weight,
        u.height 
     FROM favour_user fu
     INNER JOIN User u ON fu.user_id = u.uid
     INNER JOIN JobTitle jobU ON u.uid = jobU.user_id
     WHERE fu.company_id = ?`,
      [company_id],
    );

    // จัดโครงสร้างข้อมูลให้อยู่ในรูปแบบ Object ตามโครงสร้าง Interface ที่เราออกแบบไว้ก่อนหน้านี้
    const formattedData = rows.map((row: any) => ({
      uid: row.uid,
      name: row.name,
      jobtitle: row.jobtitle || "General Seeker", //   -- 4. เปลี่ยนจากคำว่า "Seeker" มาใช้ค่าจริงที่ดึงจาก SQL
      image: row.image,
      details: {
        gender: row.gender,
        age: row.age,
        militaryStatus: row.militaryStatus || "N/A",
        dateOfBirth: row.dateOfBirth
          ? new Date(row.dateOfBirth).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "N/A",
        nationality: row.nationality || "N/A",
        religion: row.religion || "N/A",
        weight: row.weight ? `${row.weight} kg` : "N/A",
        height: row.height ? `${row.height} cm` : "N/A",
      },
    }));

    return NextResponse.json(
      formattedData, // ส่งข้อมูลที่พร้อมใช้งานให้ฝั่ง Frontend ไปวน Loop ได้ทันที
      { status: 200 },
    );
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 },
    );
  }
}
