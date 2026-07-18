import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // 1. รายงานเกี่ยวกับบริษัท: ผู้รายงานคือ user (คนหางาน), เป้าหมายคือ company
    const [companyReports]: any = await db.query(`
      SELECT 
        rc.report_id, rc.report_type, rc.description, rc.status, rc.report_date,
        u.fullname AS reporter_name,
        rc.user_id AS reporter_id,        -- เพิ่ม ID ผู้รายงาน
        'user' AS reporter_role,          -- เพิ่ม Role ผู้รายงาน (User เป็นคนรายงาน)
        c.company_name AS target_name,
        rc.company_id AS target_id,
        'company' AS source
      FROM report_company rc
      LEFT JOIN User u ON rc.user_id = u.uid
      LEFT JOIN company c ON rc.company_id = c.company_id
    `);

    // 2. รายงานเกี่ยวกับผู้ใช้: ผู้รายงานคือ company, เป้าหมายคือ user (คนหางาน)
    const [userReports]: any = await db.query(`
      SELECT 
        ru.report_id, ru.report_type, ru.description, ru.status, ru.report_date,
        c.company_name AS reporter_name,
        ru.company_id AS reporter_id,     -- เพิ่ม ID ผู้รายงาน
        'company' AS reporter_role,       -- เพิ่ม Role ผู้รายงาน (Company เป็นคนรายงาน)
        u.fullname AS target_name,
        ru.user_id AS target_id,
        'user' AS source
      FROM report_user ru
      LEFT JOIN company c ON ru.company_id = c.company_id
      LEFT JOIN User u ON ru.user_id = u.uid
    `);

    // 3. รายงานเกี่ยวกับโพสต์: ผู้รายงานคือ user (คนหางาน), เป้าหมายคือ post
    const [postReports]: any = await db.query(`
      SELECT 
        rp.report_id, rp.report_type, rp.description, rp.status, rp.report_date,
        u.fullname AS reporter_name,
        rp.user_id AS reporter_id,        -- เพิ่ม ID ผู้รายงาน
        'user' AS reporter_role,          -- เพิ่ม Role ผู้รายงาน (User เป็นคนรายงาน)
        p.job_position AS target_name,
        rp.post_id AS target_id,
        'post' AS source
      FROM report_post rp
      LEFT JOIN User u ON rp.user_id = u.uid
      LEFT JOIN posts p ON rp.post_id = p.post_id
    `);

    // รวมข้อมูลทั้ง 3 ตาราง และเรียงตามวันที่ล่าสุด
    const allReports = [...companyReports, ...userReports, ...postReports].sort(
      (a: any, b: any) =>
        new Date(b.report_date).getTime() - new Date(a.report_date).getTime()
    );

    return NextResponse.json({ data: allReports }, { status: 200 });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    );
  }
}