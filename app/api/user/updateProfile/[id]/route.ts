import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const connection = await db.getConnection();
    try {
        const resolvedParams = await params;
        const id = Number(resolvedParams.id);
        const body = await request.json();

        await connection.beginTransaction();

        await connection.query(
            `UPDATE User SET 
                fullname = ?, email = ?, gender = ?, date_of_birth = ?, military_status = ?,
                nationality = ?, religion = ?, weight = ?, height = ?, disability_status = ?,
                marital_status = ?, mobile_phone = ?, line_id = ?, country = ?, address = ?,
                province = ?, district = ?, sub_district = ?, postal_code = ?, type_of_work = ?,
                desired_salary = ?, profile_image = ?
             WHERE uid = ?`,
            [
                body.fullname ?? null, body.email ?? null, body.gender ?? null,
                body.date_of_birth ? new Date(body.date_of_birth) : null,
                body.military_status ?? null, body.nationality ?? null, body.religion ?? null,
                body.weight ? Number(body.weight) : null, body.height ? Number(body.height) : null,
                body.disability_status ?? null, body.marital_status ?? null, body.mobile_phone ?? null,
                body.line_id ?? null, body.country ?? null, body.address ?? null,
                body.province ?? null, body.district ?? null, body.sub_district ?? null,
                body.postal_code ?? null, body.type_of_work ?? null,
                body.desired_salary ? Number(body.desired_salary) : null, body.profile_image ?? null,
                id
            ]
        );

        if (body.job_titles !== undefined) {
            await connection.query('DELETE FROM JobTitle WHERE user_id = ?', [id]);
            if (body.job_titles.length > 0) {
                const values = body.job_titles.map((item: any) => [id, item.job_name]);
                await connection.query('INSERT INTO JobTitle (user_id, job_name) VALUES ?', [values]);
            }
        }

        if (body.educations !== undefined) {
            await connection.query('DELETE FROM education WHERE user_id = ?', [id]);
            if (body.educations.length > 0) {
                const values = body.educations.map((item: any) => [id, item.level, item.institution, item.faculty, item.major, item.year_start, item.year_end]);
                await connection.query('INSERT INTO education (user_id, level, institution, faculty, major, year_start, year_end) VALUES ?', [values]);
            }
        }

        if (body.skills !== undefined) {
            await connection.query('DELETE FROM skills WHERE user_id = ?', [id]);
            if (body.skills.length > 0) {
                const values = body.skills.map((item: any) => [id, item.skill_name, item.skill_category, item.skill_detail]);
                await connection.query('INSERT INTO skills (user_id, skill_name, skill_category, skill_detail) VALUES ?', [values]);
            }
        }

        if (body.typing_speeds !== undefined) {
            await connection.query('DELETE FROM typing_speed WHERE user_id = ?', [id]);
            if (body.typing_speeds.length > 0) {
                const values = body.typing_speeds.map((item: any) => [id, item.typing_language, Number(item.typing_wpm) || 0]);
                await connection.query('INSERT INTO typing_speed (user_id, typing_language, typing_wpm) VALUES ?', [values]);
            }
        }

        if (body.experiences !== undefined) {
            await connection.query('DELETE FROM experiences WHERE user_id = ?', [id]);
            if (body.experiences.length > 0) {
                const values = body.experiences.map((item: any) => [id, item.ex_title, item.ex_description, item.type, item.start_date ? new Date(item.start_date) : null, item.end_date ? new Date(item.end_date) : null]);
                await connection.query('INSERT INTO experiences (user_id, ex_title, ex_description, type, start_date, end_date) VALUES ?', [values]);
            }
        }

        if (body.languages !== undefined) {
            await connection.query('DELETE FROM language_proficiency WHERE user_id = ?', [id]);
            if (body.languages.length > 0) {
                const values = body.languages.map((item: any) => [
                    id,
                    item.language_type,
                    item.level,
                    item.test_name ?? null,
                    item.score !== undefined && item.score !== null && item.score !== ''
                        ? Number(item.score)
                        : null,
                ]);
                await connection.query('INSERT INTO language_proficiency (user_id, language_type, level, test_name, score) VALUES ?', [values]);
            }
        }

        await connection.commit();
        return NextResponse.json({ success: true });
    } catch (error: any) {
        await connection.rollback();
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        connection.release();
    }
}