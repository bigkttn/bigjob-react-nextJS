import { NextResponse } from 'next/server';
import { updateSession } from '@/lib/session';

export async function POST() {
    try {
        await updateSession();
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
