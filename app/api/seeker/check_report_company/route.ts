import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { user_id, company_id} = body;

        if (!user_id || !company_id) {
            return NextResponse.json(
                { message: 'กรุณาส่ง user_id,post_id มาให้ครบถ้วน' },
                { status: 400 }
            );
        }
        const [rows]: any = await db.query(
            `SELECT * FROM report_company WHERE user_id = ? AND company_id = ?`,
            [user_id,company_id]
        );
         return NextResponse.json(
            {rows},
            { status: 201 }
        )
     }catch(error){
           console.error('Database Error:', error);
        return NextResponse.json(
            { message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
            { status: 500 }
        );
     }
}