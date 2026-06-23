import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const id = Number(resolvedParams.id);

        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const body = await request.json();
        const { is_visible } = body;

        // รับเฉพาะ 0 หรือ 1 เท่านั้น ป้องกันค่าแปลกปลอม
        if (is_visible !== 0 && is_visible !== 1) {
            return NextResponse.json(
                { error: 'is_visible must be 0 or 1' },
                { status: 400 }
            );
        }

        const [result]: any = await db.query(
            'UPDATE User SET is_visible = ? WHERE uid = ?',
            [is_visible, id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, is_visible }, { status: 200 });

    } catch (error: any) {
        console.error('Toggle visibility error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}