import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { user_id, company_id, report_type, description } = body;

        if (!user_id || !company_id || !report_type || !description) {
            return NextResponse.json(
                { message: 'กรุณาส่ง user_id , company_id, report_type,description มาให้ครบถ้วน' },
                { status: 400 }
            );
        }
        const [rows]: any = await db.query(
            `SELECT * FROM report_company WHERE user_id = ? AND company_id = ?`,
            [user_id, company_id]
        );
        if (rows.length === 0) {
            const query =
                `INSERT INTO report_company (user_id, company_id, report_type, description, report_date)
                VALUES (?, ?, ?, ?, NOW())`;
            await db.execute(query, [user_id, company_id, report_type, description]);

            return NextResponse.json(
                { message: 'บันทึกข้อมูลการรายงาน (Report) เรียบร้อยแล้ว' },
                { status: 201 }
            )
        } else {
            return NextResponse.json(
                { message: 'คุณเคยรายงานผู้ใช้งาน/บริษัทนี้ไปแล้ว' },
                { status: 409 }
            )

        }



    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json(
            { message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
            { status: 500 }
        );
    }
}