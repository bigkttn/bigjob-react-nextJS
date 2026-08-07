import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getEmbedding, cosineSimilarity } from "@/lib/vectorSimilarity";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q")?.trim() || "";

        //  กรณีไม่มีคำค้นหา ดึงผู้ใช้ล่าสุด 10 รายการ
        if (!query) {
            const [latestUsers]: any = await db.query(
                `SELECT 
                    u.uid, 
                    u.fullname, 
                    u.profile_image, 
                    u.province, 
                    u.age,
                    u.created_at,
                    GROUP_CONCAT(j.job_name SEPARATOR ', ') AS job_name
                 FROM User u
                 LEFT JOIN JobTitle j ON j.user_id = u.uid
                 WHERE u.is_visible = 1 and u.role = 'seeker'
                 GROUP BY u.uid
                 ORDER BY u.created_at DESC
                 LIMIT 10`
            );
            return NextResponse.json({ success: true, users: latestUsers });
        }

        //  แปลงคำค้นหาเป็นตัวพิมพ์เล็กทั้งหมด
        const lowerQuery = query.toLowerCase();

        //  ดึงข้อมูลผู้ใช้ทั้งหมดเพื่อนำมาประมวลผล AI Hybrid Search
        const [allUsers]: any = await db.query(`
            SELECT 
                u.uid, 
                u.fullname, 
                u.profile_image, 
                u.province,
                u.age,
                u.created_at,
                GROUP_CONCAT(j.job_name SEPARATOR ' ') AS job_names_concat,
                GROUP_CONCAT(j.job_name SEPARATOR ', ') AS job_name
            FROM User u
            LEFT JOIN JobTitle j ON j.user_id = u.uid
            WHERE u.is_visible = 1 and u.role = 'seeker'
            GROUP BY u.uid
        `);

        // แปลงคำค้นหาที่เป็นตัวพิมพ์เล็กแล้วไปสร้าง Embedding Vector
        const queryVector = await getEmbedding(lowerQuery);

        // คำนวณคะแนน Hybrid (แปลงข้อความทุกจุดเป็นตัวพิมพ์เล็กก่อนประมวลผล)
        const scoredUsers = await Promise.all(
            allUsers.map(async (user: any) => {
                let keywordScore = 0;
                
                //  แปลงข้อมูลผู้ใช้ทุกฟิลด์เป็นตัวพิมพ์เล็กทั้งหมด
                const fullname = (user.fullname || "").toLowerCase();
                const province = (user.province || "").toLowerCase();
                const jobText = (user.job_names_concat || "").toLowerCase();

                // เช็ค Keyword Match (เปรียบเทียบด้วยตัวพิมพ์เล็กทั้งหมด)
                if (fullname.includes(lowerQuery)) keywordScore += 0.8;
                if (province.includes(lowerQuery)) keywordScore += 0.8;
                if (jobText.includes(lowerQuery)) keywordScore += 0.5;

                // สร้าง Vector จากข้อความรวมที่เป็นตัวพิมพ์เล็กทั้งหมด
                const userContent = `${fullname} ${province} ${jobText}`.trim();
                const userVector = await getEmbedding(userContent);
                const vectorScore = cosineSimilarity(queryVector, userVector);

                // รวมคะแนนแบบถ่วงน้ำหนัก
                const finalScore = keywordScore + vectorScore * 0.5;

                return {
                    uid: user.uid,
                    fullname: user.fullname,
                    profile_image: user.profile_image,
                    province: user.province,
                    job_name: user.job_name,
                    age: user.age,
                    created_at: user.created_at,
                    matchScore: finalScore,
                };    
            })
        );

        // กรองเฉพาะคนที่มีคะแนนผ่านเกณฑ์ แล้วเรียงลำดับจากมากไปน้อย
        const filteredUsers = scoredUsers
            .filter((u) => u.matchScore > 0.25)
            .sort((a, b) => b.matchScore - a.matchScore);

        return NextResponse.json({
            success: true,
            users: filteredUsers,
        });
    } catch (error: any) {
        console.error("Error occurred while fetching user data:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}