import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function PUT(request: Request) {
    const connection = await db.getConnection();
    try {
        const { postId, questions } = await request.json();

        if (!postId) {
            return NextResponse.json({ message: "Missing Post ID" }, { status: 400 });
        }

        await connection.beginTransaction();

        // 1. ดึง ID คำถามเก่าทั้งหมดของโพสต์นี้ เพื่อเอาไปลบ Choice
        const [oldQuestions]: any = await connection.query(
            "SELECT question_id FROM question WHERE post_id = ?",
            [postId]
        );

        if (oldQuestions.length > 0) {
            const oldQuestionIds = oldQuestions.map((q: any) => q.question_id);

            // 2. ลบ Choice เก่าทั้งหมดที่ผูกกับคำถามเดิมก่อน
            await connection.query(
                `DELETE FROM choice WHERE question_id IN (${oldQuestionIds.join(",")})`
            );

            // 3. ลบ คำถามเก่า ทั้งหมดของโพสต์นี้
            await connection.query(
                "DELETE FROM question WHERE post_id = ?",
                [postId]
            );
        }

        // 4. Insert คำถามและ Choice ชุดใหม่ที่แก้ไขแล้วกลับเข้าไปแทน
        for (const q of questions) {
            const [qResult]: any = await connection.query(
                "INSERT INTO question (post_id, question) VALUES (?, ?)",
                [postId, q.text]
            );
            const questionId = qResult.insertId;

            for (const [index, optText] of q.options.entries()) {
                const isCorrect = q.correctIndex === index ? 1 : 0;
                await connection.query(
                    "INSERT INTO choice (question_id, choice, correct) VALUES (?, ?, ?)",
                    [questionId, optText, isCorrect]
                );
            }
        }

        await connection.commit();
        return NextResponse.json({ message: "Test updated successfully" }, { status: 200 });
    } catch (error) {
        await connection.rollback();
        console.error("Error updating test:", error);
        return NextResponse.json({ message: "Failed to update test" }, { status: 500 });
    } finally {
        connection.release();
    }
}