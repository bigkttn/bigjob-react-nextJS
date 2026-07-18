"use server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";

// 1. ประกาศ Interface เพื่อบอกว่าข้างใน Payload เราเก็บอะไรไว้บ้าง
export interface CustomJwtPayload extends JwtPayload {
  id: number;
  role?: string;
}

const secret = process.env.JWT_SECRET || "fallback_secret";

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) return null;

  try {
    // 2. ใส่ "as CustomJwtPayload" ต่อท้ายเพื่อบังคับระบุประเภทข้อมูล
    const decoded = jwt.verify(token, secret) as CustomJwtPayload;
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}
