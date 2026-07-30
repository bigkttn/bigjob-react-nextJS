// app/api/posts/seed/route.ts
//
// API สำหรับ seed ข้อมูลปลอมลงตาราง `posts` จำนวน 100 แถว
// ⚠️ ไม่มีการเช็ค session / JWT ใด ๆ ทั้งสิ้น ยิงเข้า DB ตรง ๆ
// ⚠️ ใช้สำหรับ dev/test เท่านั้น — ห้าม deploy ขึ้น production เด็ดขาด
//    เพราะใครก็สามารถเรียก endpoint นี้เพื่อยัดข้อมูลลง DB ได้โดยไม่ต้อง login
//
// เรียกใช้: POST /api/posts/seed

import { NextResponse } from "next/server";
import db from "@/lib/db";

// ---------- Mock data pools ----------
const jobPositions = [
    "Sales Executive", "Frontend Developer", "Backend Developer",
    "Accountant", "Administrative Officer", "Graphic Designer", "Marketing Manager",
    "Software Engineer", "HR Officer", "Warehouse Staff",
    "Purchasing Officer", "Technician", "Delivery Driver",
    "Customer Service Representative (Call Center)", "Digital Marketing Specialist",
];

const workLocations = [
    "กรุงเทพมหานคร", "เชียงใหม่", "ขอนแก่น", "อุดรธานี", "ชลบุรี (ศรีราชา)",
    "นนทบุรี", "ปทุมธานี", "ภูเก็ต", "นครราชสีมา", "สมุทรปราการ",
];

const jobTypes = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"];

const statuses = ["Open", "Closed"];

const qualificationsPool = [
    "จบการศึกษาระดับปริญญาตรีขึ้นไปในสาขาที่เกี่ยวข้อง มีทักษะการสื่อสารดี",
    "มีประสบการณ์ทำงานอย่างน้อย 1-2 ปี สามารถทำงานภายใต้แรงกดดันได้",
    "มีความละเอียดรอบคอบ ขยัน ตรงต่อเวลา สามารถทำงานเป็นทีมได้",
    "มีทักษะด้านคอมพิวเตอร์ Microsoft Office และสามารถใช้ภาษาอังกฤษพื้นฐานได้",
    "มีใบขับขี่และยานพาหนะส่วนตัว สามารถเดินทางต่างจังหวัดได้",
];

const benefitsPool = [
    "ประกันสังคม, ประกันสุขภาพกลุ่ม, โบนัสประจำปี, วันหยุดพักผ่อนประจำปี",
    "ค่าคอมมิชชั่น, ค่าเดินทาง, เบี้ยขยัน, ตรวจสุขภาพประจำปี",
    "ทำงานสัปดาห์ละ 5 วัน, OT, กองทุนสำรองเลี้ยงชีพ",
    "เครื่องแบบพนักงาน, ที่พักพนักงาน, อาหารกลางวันฟรี",
];

const howToApplyPool = [
    "ส่ง Resume มาที่อีเมลบริษัท หรือสมัครผ่านระบบออนไลน์",
    "ติดต่อฝ่ายบุคคลโดยตรงเพื่อนัดสัมภาษณ์งาน",
    "สมัครผ่านเว็บไซต์บริษัท แนบ Portfolio (ถ้ามี)",
];

const contactPool = [
    "ฝ่ายบุคคล โทร. 02-123-4567 อีเมล hr@company.com",
    "คุณสมชาย โทร. 08x-xxx-xxxx อีเมล recruit@company.com",
    "แผนกทรัพยากรบุคคล โทร. 09x-xxx-xxxx",
];

const jobDescriptionPool = [
    "รับผิดชอบงานตามที่ได้รับมอบหมาย ประสานงานกับทีมภายในและภายนอกองค์กร",
    "ดูแลงานประจำวัน วางแผนงาน และรายงานผลต่อผู้บังคับบัญชา",
    "ให้บริการลูกค้า แก้ไขปัญหาเฉพาะหน้า และดูแลความพึงพอใจของลูกค้า",
    "พัฒนาและดูแลระบบ วิเคราะห์ปัญหา และปรับปรุงกระบวนการทำงาน",
];

// ---------- Helpers ----------
function randItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// company_id ฟิกให้เป็นแค่ 1 หรือ 10 เท่านั้น
function randCompanyId(): number {
    return randItem([1, 10]);
}

function randFutureDate(): string {
    const days = randInt(7, 90);
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 19).replace("T", " ");
}

export async function POST(request: Request) {
    try {
        const total = 100;
        const now = new Date().toISOString().slice(0, 19).replace("T", " ");
        const rows: any[] = [];

        for (let i = 0; i < total; i++) {
            const salary_min = randInt(10, 40) * 1000;
            const salary_max = salary_min + randInt(2, 20) * 1000;
            const age_min = randInt(18, 25);
            const age_max = age_min + randInt(5, 25);

            rows.push([
                randCompanyId(),                    // company_id
                randItem(jobPositions),              // job_position
                randItem(workLocations),             // work_location
                randInt(1, 10),                      // vacancy
                randItem(jobTypes),                   // job_type
                randFutureDate(),                     // application_dates
                randItem(jobDescriptionPool),         // job_description
                randItem(qualificationsPool),         // preferred_qualifications
                randItem(benefitsPool),               // benefits
                randItem(howToApplyPool),             // how_to_apply
                randItem(contactPool),                // contact
                randItem(statuses),                   // status
                now,                                  // created_at
                salary_min,
                salary_max,
                age_min,
                age_max,
            ]);
        }

        const sql = `
            INSERT INTO posts (
                company_id, job_position, work_location, vacancy, job_type,
                application_dates, job_description, preferred_qualifications,
                benefits, how_to_apply, contact, status, created_at,
                salary_min, salary_max, age_min, age_max
            ) VALUES ?
        `;

        const [result]: any = await db.query(sql, [rows]);

        return NextResponse.json(
            { message: "Seed posts successfully", inserted: result.affectedRows },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error seeding posts:", error);
        return NextResponse.json({ message: "Error seeding posts" }, { status: 500 });
    }
}