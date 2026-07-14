import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { user_id, post_id } = body;

        if (!user_id || !post_id) {
            return NextResponse.json(
                { message: 'กรุณาส่ง user_id และ post_id มาให้ครบถ้วน' },
                { status: 400 }
            );
        }
        const [rows]: any = await db.query(
            `SELECT * FROM favour_post WHERE user_id = ? AND post_id = ?`,
            [user_id,post_id]
        );
        if(rows.length === 0 ){
              const query =
            `INSERT INTO favour_post (user_id, post_id, created_at)
          VALUES(?,?,NOW())`;
        await db.execute(query, [user_id, post_id]);
        return NextResponse.json(
            { message: 'บันทึกข้อมูลใน favour_user เรียบร้อยแล้ว' },
            { status: 201 }
        )
        }else {
            return  NextResponse.json(
            { message: 'เคยบันทึกเข้ารายการโปรดนี้ไว้แล้ว' },
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