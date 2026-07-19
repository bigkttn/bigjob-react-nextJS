import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import SaveCompanyClient from "./savedCompanyClient";
import styles from "./savedCompany.module.css";

interface CustomJwtPayload {
  id: number;
  email: string;
  role: string;
}


export default async function Page() {
  
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  let viewer: CustomJwtPayload | null = null;

  if (token) {
    try {
      const secret = process.env.JWT_SECRET || "fallback_secret";
      viewer = jwt.verify(token, secret) as CustomJwtPayload;
    } catch {
      console.error("Token invalid");
    }
  }
  console.log("user id",viewer);

  
  if (!viewer) {
    return (
      <div className={styles.centerMessage}>
        <p>Please log in to view this profile.</p>
      </div>
    );
  }
  return <SaveCompanyClient userId={viewer.id} />;
}