import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getEmbedding, cosineSimilarity } from "@/lib/vectorSimilarity";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        let userJobTitles: any[] = [];

        // 1. ถ้ามี userId ส่งมา ให้ไปดึง JobTitle ของ User
        if (userId) {
            const [titles]: any = await db.query(
                "SELECT job_name FROM JobTitle WHERE user_id = ?",
                [userId]
            );
            userJobTitles = titles || [];
        }

        // 2. ถ้าไม่มี userId หรือ User คนนี้ยังไม่ได้ตั้งค่า JobTitle
        // ให้ดึงงานล่าสุด 6 อันดับแรกที่ยังเปิดรับสมัครอยู่ไปแสดงแทน
        if (!userId || userJobTitles.length === 0) {
            const [latestPosts]: any = await db.query(`
                SELECT 
                    p.*, 
                    c.company_name, 
                    c.logo_image,
                    CASE 
                        WHEN p.application_dates < NOW() THEN 'closed'
                        ELSE 'Open'  
                    END AS status
                FROM posts p
                LEFT JOIN company c ON p.company_id = c.company_id
                WHERE p.application_dates >= NOW()
                ORDER BY p.created_at DESC 
                LIMIT 6
            `);
            return NextResponse.json({ success: true, posts: latestPosts });
        }

        // 3. ถ้ามีข้อมูล JobTitle ให้คำนวณความคล้ายคลึงด้วย AI Vector
        const userInterestText = userJobTitles.map((j: any) => j.job_name).join(" ");
        const userVector = await getEmbedding(userInterestText);

        // ดึงเฉพาะประกาศงานที่ application_dates ยังไม่หมดอายุ
        const [allPosts]: any = await db.query(`
            SELECT 
                p.*, 
                c.company_name, 
                c.logo_image,
                CASE 
                    WHEN p.application_dates < NOW() THEN 'closed'
                    ELSE 'Open'  
                END AS status
            FROM posts p
            LEFT JOIN company c ON p.company_id = c.company_id
            WHERE p.application_dates >= NOW()
        `);

        // คำนวณความคล้ายคลึงระหว่างความสนใจของ User กับโพสต์งาน
        const postsWithScore = await Promise.all(
            allPosts.map(async (post: any) => {
                const postText = `${post.job_position} ${post.job_description || ""}`;
                const postVector = await getEmbedding(postText);
                const score = cosineSimilarity(userVector, postVector);

                return {
                    ...post,
                    similarityScore: score,
                };
            })
        );

        // กรองเฉพาะงานที่มีคะแนนความคล้ายคลึง > 0.2 แล้วเรียงลำดับคัดเอา 6 อันดับแรก
        const sortedPosts = postsWithScore
            .filter((post) => post.similarityScore > 0.2)
            .sort((a, b) => b.similarityScore - a.similarityScore)
            .slice(0, 6);

        return NextResponse.json({
            success: true,
            posts: sortedPosts,
        });
    } catch (error: any) {
        console.error("AI Matching Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}