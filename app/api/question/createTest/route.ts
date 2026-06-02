import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request: Request) {
    const connection = await db.getConnection();
    try {
        const { postId, questions } = await request.json();
        console.log("Post ID:", postId); // เช็คว่ามีค่าไหม
        console.log("Questions:", questions); // เช็คว่ามีคำถามไหม
        await connection.beginTransaction();

        for (const q of questions) {
            const [qResult]: any = await connection.query(
                "INSERT INTO question (post_id, question) VALUES (?, ?)",
                [postId, q.text]
            );
            const questionId = qResult.insertId;

            for (const [index, optText] of q.options.entries()) {
                const inCorrect = q.correctIndex === index ? 1 : 0;
                await connection.query(
                    "INSERT INTO choice (question_id, choice, correct) VALUES (?, ?, ?)",
                    [questionId, optText, inCorrect]
                );
            }
        }

        await connection.commit();
        return NextResponse.json({ message: "Test created successfully" }, { status: 201 });
    } catch (error) {
        await connection.rollback();
        console.error("Error creating test:", error);
        return NextResponse.json({ message: "Failed to create test" }, { status: 500 });
    } finally {
        connection.release();
    }
}