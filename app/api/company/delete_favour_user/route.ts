import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function DELETE(request: Request) {
    try {
        const body = await request.json();
        const { user_id, company_id } = body;

        if (!user_id || !company_id) {
            return NextResponse.json(
                { message: 'กรุณาส่ง user_id และ company_id มาให้ครบถ้วน' },
                { status: 400 }
            );
        }
        const [rows]: any = await db.query(
            `SELECT * FROM favour_user WHERE user_id = ? AND company_id = ?`,
            [user_id,company_id]
        );
        if(rows.length > 0 ){
              const query =
            `DELETE FROM favour_user WHERE user_id = ? AND company_id =?`;
        await db.execute(query, [user_id, company_id]);
        return NextResponse.json(
            { message: 'ลบข้อมูลใน favour_user เรียบร้อยแล้ว' },
            { status: 201 }
        )
        }else {
            return  NextResponse.json(
            { message: 'เคยลบรายการโปรดนี้ไว้แล้ว' },
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