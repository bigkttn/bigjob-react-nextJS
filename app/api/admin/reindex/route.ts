import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getEmbeddings, hashOf } from "@/lib/vectorSimilarity";

export const maxDuration = 300;

const buildPostText = (p: any) =>
  [
    p.job_position,
    p.company_name,
    p.province,
    p.work_location,
    p.job_type,
    p.job_description,
    p.preferred_qualifications,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

const buildUserText = (u: any) =>
  [u.fullname, u.province, u.job_names_concat].filter(Boolean).join(" ").trim();

export async function POST() {
  try {
    // ---------- POSTS ----------
    const [posts]: any = await db.query(`
      SELECT p.*, c.company_name
      FROM posts p
      LEFT JOIN company c ON p.company_id = c.company_id
    `);

    const postTargets = posts
      .map((p: any) => ({ p, text: buildPostText(p) }))
      .filter(({ p, text }: any) => text && hashOf(text) !== p.embedding_hash);

    if (postTargets.length) {
      const vectors = await getEmbeddings(postTargets.map((t: any) => t.text));
      for (let i = 0; i < postTargets.length; i++) {
        await db.query(
          `UPDATE posts SET embedding = ?, embedding_hash = ? WHERE post_id = ?`,
          [
            JSON.stringify(vectors[i]),
            hashOf(postTargets[i].text),
            postTargets[i].p.post_id,
          ]
        );
      }
    }

    // ---------- USERS ----------
    const [users]: any = await db.query(`
      SELECT u.uid, u.fullname, u.province, u.embedding_hash,
             GROUP_CONCAT(j.job_name SEPARATOR ' ') AS job_names_concat
      FROM User u
      LEFT JOIN JobTitle j ON j.user_id = u.uid
      WHERE u.role = 'seeker'
      GROUP BY u.uid
    `);

    const userTargets = users
      .map((u: any) => ({ u, text: buildUserText(u) }))
      .filter(({ u, text }: any) => text && hashOf(text) !== u.embedding_hash);

    if (userTargets.length) {
      const vectors = await getEmbeddings(userTargets.map((t: any) => t.text));
      for (let i = 0; i < userTargets.length; i++) {
        await db.query(
          `UPDATE User SET embedding = ?, embedding_hash = ? WHERE uid = ?`,
          [
            JSON.stringify(vectors[i]),
            hashOf(userTargets[i].text),
            userTargets[i].u.uid,
          ]
        );
      }
    }

    return NextResponse.json({
      success: true,
      postsIndexed: postTargets.length,
      usersIndexed: userTargets.length,
    });
  } catch (e: any) {
    console.error("reindex error:", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}