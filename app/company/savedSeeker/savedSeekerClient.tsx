"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./savedSeeker.module.css";

interface SeekerDetails {
  gender: string;
  age: number;
  militaryStatus: string;
  dateOfBirth: string;
  nationality: string;
  religion: string;
  weight: string;
  height: string;
}

interface Seeker {
  uid: number;
  name: string;
  jobtitle: string;
  image: string;
  details: SeekerDetails | null;
}

interface ClientProps {
  companyId: number;
}

export default function SavedSeekerClient({ companyId }: ClientProps) {
  const [seekerData, setSeekersData] = useState<Seeker[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSeekers = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/company/saved-seekers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ company_id: companyId }),
        });

        if (!res.ok) {
          throw new Error("ไม่สามารถดึงข้อมูลจากเซิร์ฟเวอร์ได้");
        }

        const data = await res.json();
        setSeekersData(data);
      } catch (err: any) {
        console.error("Fetch Error:", err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      fetchSeekers();
    }
  }, [companyId]);

  if (loading)
    return <div className={styles.centerMessage}>กำลังโหลดข้อมูล...</div>;
  if (error)
    return (
      <div className={styles.centerMessage} style={{ color: "red" }}>
        ข้อผิดพลาด: {error}
      </div>
    );
  if (seekerData.length === 0)
    return (
      <div className={styles.centerMessage}>
        ไม่พบข้อมูลผู้สมัครที่บันทึกไว้
      </div>
    );

  return (
    <div className={styles.container}>
      <main className={styles.mainContent}>
        {seekerData.map((seeker, index) => (
          // 🌟 ป้องกัน Key ซ้ำโดยนำ index มาร่วมต่อ String ด้วยตามข้อผิดพลาดก่อนหน้า
          <div key={`${seeker.uid}-${index}`} className={styles.card}>
            <div className={styles.cardFlex}>
              {/* Image Section */}
              <div className={styles.imageWrapper}>
                <img
                  src={seeker.image || "/images/default-avatar.jpg"}
                  alt={seeker.name}
                  width={240}
                  height={160}
                  className={styles.seekerImage}
                />
              </div>

              {/* Info Section */}
              <div className={styles.infoWrapper}>
                <h2 className={styles.seekerName}>{seeker.name}</h2>
                <h3 className={styles.seekerPosition}>{seeker.jobtitle}</h3>

                {seeker.details && (
                  <div className={styles.detailsGrid}>
                    <p>
                      <span>Gender:</span> {seeker.details.gender}
                    </p>
                    <p>
                      <span>Age:</span> {seeker.details.age}
                    </p>
                    <p className={styles.fullWidth}>
                      <span>Military Status:</span>{" "}
                      {seeker.details.militaryStatus}
                    </p>
                    <p className={styles.fullWidth}>
                      <span>Date of Birth:</span> {seeker.details.dateOfBirth}
                    </p>
                    <p>
                      <span>Nationality:</span> {seeker.details.nationality}
                    </p>
                    <p>
                      <span>Religion:</span> {seeker.details.religion}
                    </p>
                    <p>
                      <span>Weight:</span> {seeker.details.weight}
                    </p>
                    <p>
                      <span>Height:</span> {seeker.details.height}
                    </p>
                  </div>
                )}
              </div>

              {/* Button Section */}
              <div className={styles.buttonWrapper}>
                <Link href={`/company/seeker-profile/${seeker.uid}`}>
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
