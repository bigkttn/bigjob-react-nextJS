import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const job_type = searchParams.get('job_type') || '';
        const province = searchParams.get('province') || '';
        const status = searchParams.get('status') || '';
        const sort = searchParams.get('sort') || 'newest';

        let whereClauses: string[] = [];
        let params: any[] = [];

        if (job_type) {
            whereClauses.push('posts.job_type = ?');
            params.push(job_type);
        }

        if (province) {
            whereClauses.push('(posts.province = ? OR posts.work_location LIKE ?)');
            params.push(province, `%${province}%`);
        }

        if (status) {
            if (status.toLowerCase() === 'open') {
                whereClauses.push('(posts.application_dates >= NOW() OR posts.application_dates IS NULL)');
            } else if (status.toLowerCase() === 'closed') {
                whereClauses.push('posts.application_dates < NOW()');
            }
        }

        const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        const orderSQL = sort === 'oldest' ? 'ORDER BY posts.created_at ASC' : 'ORDER BY posts.created_at DESC';

        const sql = `
            SELECT posts.*, 
                   company.company_name,
                   company.logo_image,
                   company.full_address,
                   CASE 
                       WHEN application_dates < NOW() THEN 'closed'
                       ELSE 'Open'  
                   END AS status
            FROM posts
            JOIN company ON posts.company_id = company.company_id
            ${whereSQL}
            ${orderSQL}
            LIMIT 100
        `;

        const [posts]: any = await db.query(sql, params);
        return NextResponse.json({ posts }, { status: 200 });

    } catch (error) {
        console.error("Fetch posts API error:", error);
        return NextResponse.json({ posts: [] }, { status: 500 });
    }
}