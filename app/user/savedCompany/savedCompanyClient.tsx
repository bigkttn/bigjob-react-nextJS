"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./savedCompany.module.css";

interface Company {
  cid: number;
  post_id: number;
  name: string;
  job_title: string;
  logo: string;
}

interface ClientProps {
  userId: number;
}

export default function SavedSeekerClient({ userId }: ClientProps) {
  const [compayData, setCompanyData] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSeekers = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/user/saved-company", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: userId }),
        });

        if (!res.ok) {
          throw new Error("ไม่สามารถดึงข้อมูลจากเซิร์ฟเวอร์ได้");
        }

        const data = await res.json();
        // console.log("data in page:", data);
        setCompanyData(data);
      } catch (err: any) {
        console.error("Fetch Error:", err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchSeekers();
    }
  }, [userId]);

  if (loading)
    return <div className={styles.centerMessage}>กำลังโหลดข้อมูล...</div>;
  if (error)
    return (
      <div className={styles.centerMessage} style={{ color: "red" }}>
        ข้อผิดพลาด: {error}
      </div>
    );
  if (compayData.length === 0)
    return (
      <div className={styles.centerMessage}>
        ไม่พบข้อมูลผู้สมัครที่บันทึกไว้
      </div>
    );

  return (
    <div className={styles.container}>
      <main className={styles.mainContent}>
        {compayData.map((company, index) => (
          <div key={`${company.cid}-${index}`} className={styles.card}>
            <div className={styles.cardFlex}>
              {/* Image Section */}
              <div className={styles.imageWrapper}>
                <img
                  src={company.logo || "/images/default-avatar.jpg"}
                  alt={company.name}
                  width={240}
                  height={160}
                  className={styles.seekerImage}
                />
              </div>

              {/* Info Section */}
              <div className={styles.infoWrapper}>
                <h2 className={styles.seekerName}>{company.name}</h2>
                <h3 className={styles.seekerPosition}>{company.job_title}</h3>
              </div>

              {/* Button Section */}
              <div
                className={styles.buttonWrapper}
                // onClick={() => console.log("text = ", company.post_id)}
              >
                <Link href={"/user/user-detail-job/" + company.post_id}>
                  <button className={styles.infoButton}>See Info</button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
