import Link from "next/link";
import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";
import styles from "./not-found.module.css";

interface CustomJwtPayload extends JwtPayload {
  id: number;
  email: string;
  role: string;
}

export default async function NotFound() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  let user = null;
  if (token) {
    try {
      const secret = process.env.JWT_SECRET || "fallback_secret";
      user = jwt.verify(token, secret) as CustomJwtPayload;
      /* console.log("User from token:", user) */;
    } catch (error) {
      console.error("Token invalid");
    }
  }

  const homeHref =
    user?.role === "seeker" ? "/user/user-home" : "/company/company-home";

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.hero}>
          <h1 className={styles.code} aria-label="404">
            4
            <span className={styles.zero} aria-hidden="true">
              <span className={`material-symbols-outlined ${styles.zeroIcon}`}>
                search_off
              </span>
            </span>
            4
          </h1>
          <span className={styles.badge}>PAGE NOT FOUND</span>
        </div>

        <div className={styles.body}>
          <h2 className={styles.title}>โอ๊ะโอ! ไม่พบหน้าที่คุณค้นหา</h2>
          <p className={styles.text}>
            ดูเหมือนว่าหน้าที่คุณพยายามเข้าถึงจะไม่มีอยู่จริง
            อาจจะถูกย้ายไปที่อื่น หรือลิงก์อาจจะเสียครับ
          </p>
          <Link href={homeHref} className={styles.homeBtn}>
            <span className={`material-symbols-outlined ${styles.btnIcon}`}>
              home
            </span>
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}
