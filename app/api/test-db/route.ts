// app/api/posts/seed/route.ts
//
// API สำหรับ seed ข้อมูลปลอมลงตาราง `posts` จำนวน 50 แถว
// ⚠️ ไม่มีการเช็ค session / JWT ใด ๆ ทั้งสิ้น ยิงเข้า DB ตรง ๆ
// ⚠️ ใช้สำหรับ dev/test เท่านั้น — ห้าม deploy ขึ้น production เด็ดขาด
//    เพราะใครก็สามารถเรียก endpoint นี้เพื่อยัดข้อมูลลง DB ได้โดยไม่ต้อง login
//
// เรียกใช้: POST /api/posts/seed

import { NextResponse } from "next/server";
import db from "@/lib/db";

// ---------- Mock data pools ----------
const jobPositions = [
    // --- Tech & Software Development ---
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Java Developer",
    "Node.js Developer",
    "Python Developer",
    "Golang Developer",
    "React / Next.js Developer",
    "Mobile Developer (iOS / Android)",
    "Flutter Developer",
    "Software Engineer",
    "DevOps Engineer",
    "Cloud Engineer",
    "System Analyst (SA)",
    "Business Analyst (BA)",
    "Software Tester / QA Engineer",
    "Automated Tester",
    "Data Engineer",
    "Data Scientist",
    "Data Analyst",
    "AI / Machine Learning Engineer",
    "Security Engineer / DevSecOps",
    "IT Support / Helpdesk",

    // --- Product & Design ---
    "Product Manager (PM)",
    "Product Owner (PO)",
    "UX/UI Designer",
    "Graphic Designer",

    // --- Business, Marketing & Supporting ---
    "Digital Marketing Specialist",
    "SEO / SEM Specialist",
    "Content Writer / Copywriter",
    "Sales Executive",
    "Business Development Manager",
    "Account Executive (AE)",
    "HR Specialist / Tech Recruiter",
    "Project Coordinator",
];

const provinces = [
    "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร",
    "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท",
    "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง",
    "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม",
    "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส",
    "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์",
    "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา",
    "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์",
    "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน",
    "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง",
    "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย",
    "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ",
    "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี",
    "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย",
    "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์",
    "อุทัยธานี", "อุบลราชธานี"
];

const workLocations = [
    "อาคาร A ชั้น 12 ถนนสุขุมวิท",
    "นิคมอุตสาหกรรมบางปู",
    "ย่านใจกลางเมือง ติด BTS/MRT",
    "ทำงานจากบ้าน (Remote 100%)",
    "สาขาออฟฟิศประจำจังหวัด",
    "อาคารซอฟต์แวร์ปาร์ค",
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
        const total = 150;
        const now = new Date().toISOString().slice(0, 19).replace("T", " ");
        const rows: any[] = [];

        for (let i = 0; i < total; i++) {
            const salary_min = randInt(10, 40) * 1000;
            const salary_max = salary_min + randInt(2, 20) * 1000;
            const age_min = randInt(18, 25);
            const age_max = age_min + randInt(5, 25);

            rows.push([
                randCompanyId(),               // 1. company_id
                randItem(jobPositions),         // 2. job_position
                randItem(provinces),            // 3. province ✨ (เพิ่มตรงนี้)
                randItem(workLocations),        // 4. work_location
                randInt(1, 10),                 // 5. vacancy
                randItem(jobTypes),              // 6. job_type
                randFutureDate(),               // 7. application_dates
                randItem(jobDescriptionPool),    // 8. job_description
                randItem(qualificationsPool),    // 9. preferred_qualifications
                randItem(benefitsPool),          // 10. benefits
                randItem(howToApplyPool),        // 11. how_to_apply
                randItem(contactPool),           // 12. contact
                randItem(statuses),              // 13. status
                now,                             // 14. created_at
                salary_min,                      // 15. salary_min
                salary_max,                      // 16. salary_max
                age_min,                         // 17. age_min
                age_max,                         // 18. age_max
            ]);
        }

        const sql = `
            INSERT INTO posts (
                company_id, job_position, province, work_location, vacancy, job_type,
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