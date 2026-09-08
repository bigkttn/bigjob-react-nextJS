import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const province = searchParams.get('province') || '';
        const work_type = searchParams.get('work_type') || '';
        const education = searchParams.get('education') || '';
        const minAge = searchParams.get('minAge') || '18';
        const maxAge = searchParams.get('maxAge') || '60';
        const sort = searchParams.get('sort') || 'newest';

        let whereClauses: string[] = ["User.is_visible = 1", "User.role = 'seeker'"];
        let params: any[] = [];

        if (province) {
            whereClauses.push('User.province = ?');
            params.push(province);
        }

        if (work_type) {
            whereClauses.push('User.type_of_work LIKE ?');
            params.push(`%${work_type}%`);
        }

        if (minAge && maxAge) {
            whereClauses.push('(User.age >= ? AND User.age <= ? OR User.age IS NULL)');
            params.push(Number(minAge), Number(maxAge));
        }

        let havingClauses: string[] = [];
        if (education) {
            havingClauses.push('education_levels LIKE ?');
            params.push(`%${education}%`);
        }

        const whereSQL = `WHERE ${whereClauses.join(' AND ')}`;
        const havingSQL = havingClauses.length > 0 ? `HAVING ${havingClauses.join(' AND ')}` : '';
        const orderSQL = sort === 'oldest' ? 'ORDER BY User.created_at ASC' : 'ORDER BY User.created_at DESC';

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
          ${whereSQL}
          GROUP BY User.uid
          ${havingSQL}
          ${orderSQL}
          LIMIT 100;
        `;

        const [users]: any = await db.query(sql, params);
        return NextResponse.json({ users }, { status: 200 });

    } catch (error) {
        console.error("Fetch users API error:", error);
        return NextResponse.json({ users: [] }, { status: 500 });
    }
}