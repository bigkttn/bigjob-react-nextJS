import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getEmbedding, cosineSimilarity } from "@/lib/vectorSimilarity";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q")?.trim() || "";

        //  ถ้าไม่มีคำค้นหา ให้ดึง 10 ประกาศงานล่าสุด
        if (!query) {
            const [latestPosts]: any = await db.query(
                `SELECT 
                    p.*,
                    c.company_name,
                    c.logo_image
                 FROM posts p
                 LEFT JOIN company c ON p.company_id = c.company_id
                 ORDER BY p.created_at DESC
                 LIMIT 10`
            );
            return NextResponse.json({ success: true, posts: latestPosts });
        }

        const lowerQuery = query.toLowerCase();

        //  ดึงประกาศงานทั้งหมดพร้อมข้อมูลบริษัทสำหรับทำ AI Hybrid Search
        const [allPosts]: any = await db.query(`
            SELECT 
                p.*,
                c.company_name,
                c.logo_image
            FROM posts p
            LEFT JOIN company c ON p.company_id = c.company_id
        `);

        // สร้าง Vector จากคำค้นหา
        const queryVector = await getEmbedding(lowerQuery);

        // คำนวณคะแนน Hybrid Search โดยอิงชื่อคอลัมน์ตาม DB จริง
        const scoredPosts = await Promise.all(
            allPosts.map(async (post: any) => {
                let keywordScore = 0;

                // ดึงข้อมูลตามชื่อคอลัมน์จาก DB Schema ของคุณ
                const jobPosition = (post.job_position || "").toLowerCase();
                const jobDescription = (post.job_description || "").toLowerCase();
                const preferredQualifications = (post.preferred_qualifications || "").toLowerCase();
                const benefits = (post.Benefits || "").toLowerCase();
                const province = (post.province || "").toLowerCase();
                const workLocation = (post.work_location || "").toLowerCase();
                const jobType = (post.job_type || "").toLowerCase();
                const companyName = (post.company_name || "").toLowerCase();

                // เช็ค Keyword Match
                if (jobPosition.includes(lowerQuery)) keywordScore += 0.8;
                if (companyName.includes(lowerQuery)) keywordScore += 0.6;
                if (province.includes(lowerQuery) || workLocation.includes(lowerQuery)) keywordScore += 0.5;
                if (jobType.includes(lowerQuery)) keywordScore += 0.4;
                if (
                    jobDescription.includes(lowerQuery) ||
                    preferredQualifications.includes(lowerQuery) ||
                    benefits.includes(lowerQuery)
                ) {
                    keywordScore += 0.3;
                }

                // สร้าง Vector จากเนื้อหาทั้งหมด
                const postContent = `${jobPosition} ${companyName} ${province} ${workLocation} ${jobType} ${jobDescription} ${preferredQualifications}`.trim();
                const postVector = await getEmbedding(postContent.toLowerCase());
                const vectorScore = cosineSimilarity(queryVector, postVector);

                // รวมคะแนน Keyword + AI Vector
                const finalScore = keywordScore + vectorScore * 0.5;

                return {
                    ...post,
                    matchScore: finalScore,
                };
            })
        );

        // กรองเฉพาะอันที่มีความเกี่ยวข้อง เรียงลำดับจากคะแนนสูงสุด
        const filteredPosts = scoredPosts
            .filter((p) => p.matchScore > 0.25)
            .sort((a, b) => b.matchScore - a.matchScore);

        return NextResponse.json({
            success: true,
            posts: filteredPosts,
        });
    } catch (error: any) {
        console.error("Error occurred while searching posts:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}