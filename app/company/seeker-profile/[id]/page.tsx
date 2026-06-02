import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";
interface CustomJwtPayload extends JwtPayload {
  id: number;
  email: string;
  role: string;
}
export default async function UserFeedbackPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  let user: CustomJwtPayload | null = null;
  if (token) {
    try {
      const secret = process.env.JWT_SECRET || "fallback_secret";
      user = jwt.verify(token, secret) as CustomJwtPayload;
    } catch (error) {
      console.error("Token invalid");
    }
  }
  return (
    <div>
      <h1>User Feedback</h1>
      <p>This is the user feedback page.</p>
      {user ? (
        <p>
          Welcome, {user.email}! Your role is: {user.role}
        </p>
      ) : (
        <p>Please log in to view your feedback.</p>
      )}
    </div>
  );
}
