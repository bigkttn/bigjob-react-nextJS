import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. รายงานเกี่ยวกับบริษัท
    const [companyReports]: any = await db.query(`
      SELECT 
        rc.report_id, rc.report_type, rc.description, rc.status, rc.report_date, rc.warn_message,
        u.fullname AS reporter_name,
        rc.user_id AS reporter_id,
        'user' AS reporter_role,
        c.company_name AS target_name,
        rc.company_id AS target_id,
        c.banned_until AS target_banned_until,
        'company' AS source
      FROM report_company rc
      LEFT JOIN User u ON rc.user_id = u.uid
      LEFT JOIN company c ON rc.company_id = c.company_id
    `);

    // 2. รายงานเกี่ยวกับผู้ใช้
    const [userReports]: any = await db.query(`
      SELECT 
        ru.report_id, ru.report_type, ru.description, ru.status, ru.report_date, ru.warn_message,
        c.company_name AS reporter_name,
        ru.company_id AS reporter_id,
        'company' AS reporter_role,
        u.fullname AS target_name,
        ru.user_id AS target_id,
        u.banned_until AS target_banned_until,
        'user' AS source
      FROM report_user ru
      LEFT JOIN company c ON ru.company_id = c.company_id
      LEFT JOIN User u ON ru.user_id = u.uid
    `);

    // 3. รายงานเกี่ยวกับโพสต์
    const [postReports]: any = await db.query(`
      SELECT 
        rp.report_id, rp.report_type, rp.description, rp.status, rp.report_date, rp.warn_message,
        u.fullname AS reporter_name,
        rp.user_id AS reporter_id,
        'user' AS reporter_role,
        p.job_position AS target_name,
        rp.post_id AS target_id,
        p.ban_until AS target_banned_until,
        'post' AS source
      FROM report_post rp
      LEFT JOIN User u ON rp.user_id = u.uid
      LEFT JOIN posts p ON rp.post_id = p.post_id
    `);

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