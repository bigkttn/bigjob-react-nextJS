import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getEmbedding, cosineSimilarity } from "@/lib/vectorSimilarity";


export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");

        let companyPosts: any[] = [];

        //  ดึงโพสต์งานที่ยังเปิดรับสมัครของบริษัทนี้ เพื่อเอา job_position มาสร้างข้อความสำหรับ embedding
        if (companyId) {
            const [posts]: any = await db.query(
                `SELECT job_position, job_description
         FROM posts
         WHERE company_id = ?
           AND application_dates >= NOW()`,
                [companyId],
            );
            companyPosts = posts || [];
        }

        // Fallback: ถ้าไม่มี companyId หรือบริษัทนี้ยังไม่มีโพสต์งานเปิดรับเลย
        // ให้แสดง user/job seeker ล่าสุด 6 คนแทน (ต้องมี JobTitle อย่างน้อย 1 รายการ)
        if (!companyId || companyPosts.length === 0) {
            const [latestUsers]: any = await db.query(`
        SELECT
          u.uid,
          u.fullname,
          u.profile_image,
          u.province,
          j.job_name
        FROM User u
        JOIN JobTitle j ON j.user_id = u.uid
        ORDER BY u.created_at DESC
        LIMIT 6
      `);
            return NextResponse.json({ success: true, users: latestUsers });
        }

        //  รวมตำแหน่งงานทั้งหมดของบริษัทเป็นข้อความเดียว แล้วสร้าง embedding
        const companyInterestText = companyPosts
            .map((p: any) => `${p.job_position} ${p.job_description || ""}`)
            .join(" ");
        const companyVector = await getEmbedding(companyInterestText);

        //  ดึง user ทุกคนที่มี JobTitle (ตำแหน่งที่สนใจ/ตำแหน่งของตัวเอง) อย่างน้อย 1 รายการ
        const [allUserJobTitles]: any = await db.query(`
      SELECT
        u.uid,
        u.fullname,
        u.profile_image,
        u.province,
        j.job_name
      FROM User u
      JOIN JobTitle j ON j.user_id = u.uid
    `);

        // รวม JobTitle หลายอันของ user คนเดียวกันให้เหลือ 1 รายการต่อคน
        const userMap = new Map<string, { uid: any; fullname: any; profile_image: any; province: any; job_names: string[] }>();
        for (const row of allUserJobTitles) {
            const key = String(row.uid);
            if (!userMap.has(key)) {
                userMap.set(key, {
                    uid: row.uid,
                    fullname: row.fullname,
                    profile_image: row.profile_image,
                    province: row.province,
                    job_names: [],
                });
            }
            if (row.job_name) {
                userMap.get(key)!.job_names.push(row.job_name);
            }
        }

        //  คำนวณความคล้ายคลึงระหว่างตำแหน่งงานของบริษัท กับ JobTitle ของแต่ละ user
        const usersWithScore = await Promise.all(
            Array.from(userMap.values()).map(async (u) => {
                const userText = u.job_names.join(" ");
                const userVector = await getEmbedding(userText);
                const score = cosineSimilarity(companyVector, userVector);

                return {
                    uid: u.uid,
                    fullname: u.fullname,
                    profile_image: u.profile_image,
                    province: u.province,
                    job_name: u.job_names.join(", "),
                    similarityScore: score,
                };
            }),
        );

        //  กรองเฉพาะที่คะแนน > 0.2 แล้วเรียงจากมากไปน้อย เอาแค่ 6 อันดับแรก
        const sortedUsers = usersWithScore
            .filter((u) => u.similarityScore > 0.2)
            .sort((a, b) => b.similarityScore - a.similarityScore)
            .slice(0, 6);

        return NextResponse.json({ success: true, users: sortedUsers });
    } catch (error: any) {
        console.error("AI Matching Error (CompanySuggested):", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal Server Error" },
            { status: 500 },
        );
    }
}