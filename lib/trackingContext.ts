// ดึงชื่อ/อีเมลของผู้เกี่ยวข้องกับใบสมัครจากฐานข้อมูล
// ใช้แทนค่าที่ฝั่ง client ส่งมา เพื่อไม่ให้ใครใช้ระบบส่งอีเมลไปหาคนอื่นได้
import db from "@/lib/db";

export interface PostContact {
  post_id: number;
  job_position: string;
  company_id: number;
  company_name: string;
  company_email: string;
}

export interface SeekerContact {
  uid: number;
  fullname: string;
  email: string;
}

export interface TrackingContact {
  tracking_id: number;
  user_id: number;
  post: PostContact;
  seeker: SeekerContact;
}

export async function getPostContact(postId: number): Promise<PostContact | null> {
  const [rows] = (await db.query(
    `SELECT p.post_id, p.job_position, p.company_id, c.company_name, c.company_email
     FROM posts p
     JOIN company c ON c.company_id = p.company_id
     WHERE p.post_id = ?
     LIMIT 1`,
    [postId],
  )) as [PostContact[], unknown];
  return rows[0] ?? null;
}

export async function getSeekerContact(userId: number): Promise<SeekerContact | null> {
  const [rows] = (await db.query(
    "SELECT uid, fullname, email FROM `User` WHERE uid = ? LIMIT 1",
    [userId],
  )) as [SeekerContact[], unknown];
  return rows[0] ?? null;
}

export async function getTrackingContact(
  trackingId: number,
): Promise<TrackingContact | null> {
  const [rows] = (await db.query(
    "SELECT tracking_id, user_id, post_id FROM interview_tracking WHERE tracking_id = ? LIMIT 1",
    [trackingId],
  )) as [{ tracking_id: number; user_id: number; post_id: number }[], unknown];
  const tracking = rows[0];
  if (!tracking) return null;

  const post = await getPostContact(tracking.post_id);
  const seeker = await getSeekerContact(tracking.user_id);
  if (!post || !seeker) return null;

  return { tracking_id: tracking.tracking_id, user_id: tracking.user_id, post, seeker };
}

// กันข้อความจากผู้ใช้ไปแทรก HTML/ลิงก์ในอีเมล
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
