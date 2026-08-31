import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import UserHomeClient from "./userhome-client";
import { JwtPayload } from "jsonwebtoken";
export const dynamic = "force-dynamic"; // ✅ ต้องอยู่ที่นี่

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  let user: JwtPayload | null = null;

  if (token) {
    try {
      const secret = process.env.JWT_SECRET || "fallback_secret";
      const decoded = jwt.verify(token, secret);
      if (typeof decoded === "object" && decoded !== null) {
        user = decoded;
      }
    } catch (error) {
      console.error("Token invalid");
    }
  }

  return <UserHomeClient initialUser={user} />;
}
