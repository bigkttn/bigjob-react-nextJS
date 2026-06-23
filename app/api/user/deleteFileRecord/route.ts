import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const fileId = searchParams.get('file_id');

        if (!fileId) {
            return NextResponse.json({ error: 'ไม่ระบุ File ID' }, { status: 400 });
        }

        await db.query('DELETE FROM files WHERE file_id = ?', [fileId]);
        return NextResponse.json({ success: true, message: 'ลบเรียบร้อย' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}