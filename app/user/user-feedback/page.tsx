import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export default async function UserFeedbackPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  let user = null;
  if (token) {
    try {
      const secret = process.env.JWT_SECRET || "fallback_secret";
      user = jwt.verify(token, secret);
    } catch (error) {
      console.error("Token invalid");
    }
  }
  return (
    <div>
      <h1>User Feedback</h1>
      <p>This is the user feedback page.</p>
    </div>
  );
}
