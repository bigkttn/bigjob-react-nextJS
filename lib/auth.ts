// ตัวกลางตรวจ session (JWT ใน cookie "session") ใช้ทั้งใน proxy.ts และ API route
import jwt, { type JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "session";

export interface SessionUser {
  id: number;
  email: string;
  role: string;
}

export const ADMIN_ROLES = ["admin", "superadmin"];

export function isAdmin(user: SessionUser | null): boolean {
  return user !== null && ADMIN_ROLES.includes(user.role);
}

const getSecret = () => process.env.JWT_SECRET || "fallback_secret";

// ตรวจลายเซ็นและวันหมดอายุของ token ถ้าไม่ผ่านคืน null
export function verifySessionToken(
  token: string | undefined | null,
): SessionUser | null {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, getSecret()) as JwtPayload;
    if (payload.id === undefined || typeof payload.role !== "string") {
      return null;
    }
    return {
      id: Number(payload.id),
      email: String(payload.email ?? ""),
      role: payload.role,
    };
  } catch {
    return null;
  }
}

// ใช้ใน API route / server component: อ่าน cookie ของ request ปัจจุบัน
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

// ใช้ตอน server component เรียก API ของเว็บเอง: ส่ง cookie session ต่อไปด้วย
export async function sessionCookieHeader(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return token ? { Cookie: `${SESSION_COOKIE}=${token}` } : {};
}
