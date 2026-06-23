import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const id = Number(resolvedParams.id);

        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        // 1. ดึงข้อมูล user หลัก
        const [users]: any = await db.query(
            `SELECT uid, fullname, email, profile_image, gender, date_of_birth,
              military_status, nationality, religion, weight, height,
              disability_status, marital_status, mobile_phone, line_id,
              country, address, province, district, sub_district, postal_code,
              type_of_work, desired_salary, desired_work_location,
              available_start_date, role, is_visible
       FROM User WHERE uid = ?`,
            [id]
        );

        if (!users || users.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 2. ดึงข้อมูลตารางที่เกี่ยวข้องพร้อมกัน (ชื่อตรงตาม schema จริง)
        const [
            [jobTitles],
            [educations],
            [skills],
            [typingSpeeds],
            [experiences],
            [languages],
            [files],
        ]: any = await Promise.all([
            // Image 1: table = JobTitle, cols = jobtitle_id, job_name, user_id
            db.query(
                'SELECT jobtitle_id, job_name FROM JobTitle WHERE user_id = ? ORDER BY jobtitle_id DESC',
                [id]
            ),
            // Image 2: table = education, cols = education_id, user_id, level, institution, faculty, major, year_start, year_end
            db.query(
                'SELECT education_id, level, institution, faculty, major, year_start, year_end FROM education WHERE user_id = ? ORDER BY year_start ASC',
                [id]
            ),
            // Image 5: table = skills, cols = skill_id, user_id, skill_name, skill_category, skill_detail
            db.query(
                'SELECT skill_id, skill_name, skill_category, skill_detail FROM skills WHERE user_id = ? ORDER BY skill_id DESC',
                [id]
            ),
            // Image 6: table = typing_speed, cols = typing_id, user_id, typing_language, typing_wpm
            db.query(
                'SELECT typing_id, typing_language, typing_wpm FROM typing_speed WHERE user_id = ? ORDER BY typing_id DESC',
                [id]
            ),
            // Image 3: table = experiences, cols = experience_id, user_id, ex_title, ex_description, type, start_date, end_date
            db.query(
                'SELECT experience_id, ex_title, ex_description, type, start_date, end_date FROM experiences WHERE user_id = ? ORDER BY end_date DESC',
                [id]
            ),
            // Image 7: table = language_proficiency, cols = lang_id, user_id, language_type, level, test_name, score
            db.query(
                'SELECT lang_id, language_type, level, test_name, score FROM language_proficiency WHERE user_id = ? ORDER BY lang_id DESC',
                [id]
            ),
            // Image 4: table = files, cols = file_id, user_id, file_path, file_name, file_type, uploaded_at, file_category
            db.query(
                'SELECT file_id, file_path, file_name, file_type, file_category, uploaded_at FROM files WHERE user_id = ? ORDER BY uploaded_at DESC',
                [id]
            ),
        ]);

        const fullProfile = {
            ...users[0],
            job_titles: jobTitles,
            educations: educations,
            skills: skills,
            typing_speeds: typingSpeeds,
            experiences: experiences,
            languages: languages,
            files: files,
        };

        return NextResponse.json({ user: fullProfile }, { status: 200 });

    } catch (error: any) {
        console.error('Fetch profile error:', error.message); // ดู error จริงใน terminal
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}