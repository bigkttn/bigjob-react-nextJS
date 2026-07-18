import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import SavedSeekerClient from "./savedSeekerClient"; // นำเข้าไฟล์ Client
import styles from "./savedSeeker.module.css";

interface CustomJwtPayload {
  id: number;
  email: string;
  role: string;
}

interface PageProps {
  params: Promise<{ cid: string }>;
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const companyId = Number(resolvedParams.cid);

  
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
  console.log("1111111111111111111111",viewer);

  
  if (!viewer) {
    return (
      <div className={styles.centerMessage}>
        <p>Please log in to view this profile.</p>
      </div>
    );
  }
  return <SavedSeekerClient companyId={viewer.id} />;
}