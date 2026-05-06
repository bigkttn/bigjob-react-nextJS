"use client";
import Image from "next/image";
import styles from "./home.module.css";
import { useRouter } from "next/navigation";

interface Company {
  id: number;
  name: string;
  logo: string;
}

const Home = () => {
  const router = useRouter();
  const pendingCompanies: Company[] = [
    {
      id: 1,
      name: "Mekong Marketplace",
      logo: "/assets/images/suggestedCompanys.jpg",
    },
    {
      id: 2,
      name: "Urban Pulse Media",
      logo: "/assets/images/suggestedCompanys.jpg",
    },
    {
      id: 3,
      name: "Innovatech Solutions",
      logo: "/assets/images/suggestedCompanys.jpg",
    },
  ];

  const handleApprove = (id: number) => console.log("Approved", id);
  const handleReject = (id: number) => console.log("Rejected", id);

  return (
    <div className={styles.container}>
      <div className={styles.cardWrapper}>
        <h2 className={styles.headerTitle}>
          Display the Articles of Association or Company Registration
          Certificate submitted by the company.
        </h2>

        <div className={styles.list}>
          {pendingCompanies.map((company) => (
            <div key={company.id} className={styles.companyRow}>
              {/* ส่วนชื่อและโลโก้ */}
              <div className={styles.leftInfo}>
                <Image
                  src={company.logo}
                  alt={company.name}
                  width={120}
                  height={60}
                  className={styles.logo}
                />
                <span className={styles.companyName}>{company.name}</span>
              </div>

              {/* ส่วนกลุ่มปุ่มจัดการ */}
              <div className={styles.buttonGroup}>
                <button
                  onClick={() => handleApprove(company.id)}
                  className={`${styles.btn} ${styles.approve}`}
                >
                  approve
                </button>
                <button
                  onClick={() => handleReject(company.id)}
                  className={`${styles.btn} ${styles.reject}`}
                >
                  reject
                </button>

                <button
                  className={`${styles.btn} ${styles.seeInfo}`}
                  onClick={() => router.push("/company/profile")}
                >
                  See Info
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default Home;
