import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { OAuth2Client } from 'google-auth-library';
import { createSession } from "@/lib/session";
import bcrypt from 'bcryptjs';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const clientInformation = new OAuth2Client(GOOGLE_CLIENT_ID);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token, userType, fullname, company_name, business_type, contact_name, mobile_phone } = body;

        const ticket = await clientInformation.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        })
        const payload = ticket.getPayload();
        const googleID = payload?.sub;
        const email = payload?.email;

        const [existingUsers]: any = await db.query('SELECT * FROM `User` WHERE email = ?', [email]);
        const [existingCompany]: any = await db.query('SELECT * FROM `company` WHERE company_email = ?', [email]);

        let user = existingUsers[0] || existingCompany[0];
        let role = existingUsers.length > 0 ? 'seeker' : (existingCompany.length > 0 ? 'company' : null);

        if (
            !user
        ) {
            if (userType == 'seeker') {
                const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
                const [result]: any = await db.query(
                    'INSERT INTO `User` (email, google_id, fullname, role, password) VALUES (?, ?, ?, ?, ?)',
                    [email, googleID, fullname, 'seeker', randomPassword]
                );
                // ดึงข้อมูลที่เพิ่ง insert
                const [newUser]: any = await db.query('SELECT * FROM `User` WHERE uid = ?', [result.insertId]);
                user = newUser[0];
                role = 'seeker';
            } else if (userType == 'company') {
                const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
                const [result]: any = await db.query(
                    `INSERT INTO company (company_email, mobile_phone, company_name, business_type, contact_information, google_id, verification_status, password)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [email, mobile_phone, company_name, business_type, contact_name, googleID, 'pending', randomPassword]
                );
                // ดึงข้อมูลที่เพิ่ง insert
                const [newCompany]: any = await db.query('SELECT * FROM company WHERE company_id = ?', [result.insertId]);
                user = newCompany[0];
                role = 'company';
            }
        }

        const sessionId = role === 'company' ? user.company_id : user.uid;
        await createSession({ id: sessionId, email: email, role: role });

        return NextResponse.json({
            message: 'ลงทะเบียนด้วย Google สำเร็จ',
            user: { ...user, role }
        });


    } catch (error) {
        console.error('Error in /api/auth/registerGoogle:', error);
        return new Response(JSON.stringify({ message: 'เกิดข้อผิดพลาดในการลงทะเบียนด้วย Google' }), { status: 500 });
    }
}