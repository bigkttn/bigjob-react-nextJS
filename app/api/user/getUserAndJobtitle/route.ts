import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        const sql = `
          SELECT 
            User.uid,
            User.fullname,
            User.province,
            User.age,
            User.created_at,
            User.profile_image,
            User.type_of_work,
            GROUP_CONCAT(DISTINCT JobTitle.job_name SEPARATOR ', ') AS job_name,
            GROUP_CONCAT(DISTINCT education.level SEPARATOR ', ') AS education_levels
          FROM User 
          LEFT JOIN JobTitle ON User.uid = JobTitle.user_id
          LEFT JOIN education ON User.uid = education.user_id
          WHERE User.is_visible = 1 AND User.role = 'seeker'
          GROUP BY User.uid;
        `;

        const [users]: any = await db.query(sql);
        return NextResponse.json({ users }, { status: 200 });

    } catch (error) {
        console.error("Fetch users API error:", error);
        return NextResponse.json({ users: [] }, { status: 500 });
    }
}