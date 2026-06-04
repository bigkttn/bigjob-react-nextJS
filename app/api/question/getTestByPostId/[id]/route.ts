import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const [questions]: any = await db.query(
            "SELECT question_id, question FROM question WHERE post_id = ?",
            [id]
        );

        const formattedQuestions = [];

        for (const q of questions) {
            const [choices]: any = await db.query(
                "SELECT choice_id, choice, correct FROM choice WHERE question_id = ?",
                [q.question_id]
            );

            const correctIndex = choices.findIndex(
                (c: any) => c.correct === 1
            );

            formattedQuestions.push({
                questionId: q.question_id,
                text: q.question,
                correctIndex: correctIndex !== -1 ? correctIndex : 0,
                options: choices.map((c: any) => c.choice),
                choiceIds: choices.map((c: any) => c.choice_id),
            });
        }

        return NextResponse.json(
            { questions: formattedQuestions },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error fetching test for edit:", error);

        return NextResponse.json(
            {
                message: "Failed to fetch test data",
                error: error.message,
            },
            { status: 500 }
        );
    }
}