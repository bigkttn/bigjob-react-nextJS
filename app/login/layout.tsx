import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt, { JwtPayload } from "jsonwebtoken";

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (token) {
    try {
      const secret = process.env.JWT_SECRET || "fallback_secret";
      const decoded = jwt.verify(token, secret) as JwtPayload;

      if (decoded && decoded.role) {
        if (decoded.role === "seeker") redirect("/user/user-home");
        if (decoded.role === "company") redirect("/company/company-home");
        if (decoded.role === "admin") redirect("/admin/home");
      }
    } catch (error) {
      // Invalid token, just proceed to login page
    }
  }

  return <>{children}</>;
}
