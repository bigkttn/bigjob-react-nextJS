"use client";
import styles from "./home.module.css";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface PendingCompany {
  company_id: number;
  company_name: string;
  logo_image: string | null;
  dbd_file: string | null;
  verification_status: string;
  verification_comment: string | null;
}

const Home = () => {
  const router = useRouter();
  const [companies, setCompanies] = useState<PendingCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);

  // ─── ดึงรายชื่อบริษัทที่ "รอตรวจสอบ" จาก backend จริง ───
  const fetchPendingCompanies = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/companies?status=Pending");
      const data = await res.json();
      if (res.ok) setCompanies(data.companies || []);
    } catch (err) {
      console.error("Failed to fetch pending companies", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingCompanies();
  }, []);

  // ─── อนุมัติบริษัท ───
  const handleApprove = async (id: number) => {
    if (!confirm("ยืนยันอนุมัติบริษัทนี้?")) return;
    try {
      setActingId(id);
      const res = await fetch(`/api/admin/verify/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verification_status: "Approved" }),
      });
      if (res.ok) {
        // เอาบริษัทที่อนุมัติแล้วออกจากลิสต์ "รอตรวจสอบ" ทันที
        setCompanies((prev) => prev.filter((c) => c.company_id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "ไม่สามารถอนุมัติได้");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActingId(null);
    }
  };

  // ─── ปฏิเสธบริษัท (ต้องระบุเหตุผล) ───
  const handleReject = async (id: number) => {
    const comment = prompt("ระบุเหตุผลที่ปฏิเสธบริษัทนี้:");
    if (!comment) return; // ยกเลิกถ้าไม่กรอกเหตุผล

    try {
      setActingId(id);
      const res = await fetch(`/api/admin/verify/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verification_status: "Rejected",
          verification_comment: comment,
        }),
      });
      if (res.ok) {
        setCompanies((prev) => prev.filter((c) => c.company_id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "ไม่สามารถปฏิเสธได้");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.cardWrapper}>
        <h2 className={styles.headerTitle}>
          Display the Articles of Association or Company Registration
          Certificate submitted by the company.
        </h2>

        {loading ? (
          <p style={{ textAlign: "center" }}>Loading...</p>
        ) : companies.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666" }}>
            ไม่มีบริษัทที่รอการตรวจสอบในขณะนี้ 🎉
          </p>
        ) : (
          <div className={styles.list}>
            {companies.map((company) => (
              <div key={company.company_id} className={styles.companyRow}>
                {/* ส่วนชื่อและโลโก้ */}
                <div className={styles.leftInfo}>
                 <img
                      src={
                        company.logo_image ||
                        "/assets/images/suggestedCompanys.jpg"
                      }
                      alt={company.company_name}
                      className={styles.logo}
                    />
                  <span className={styles.companyName}>
                    {company.company_name}
                  </span>
                </div>

                {/* ส่วนกลุ่มปุ่มจัดการ */}
                <div className={styles.buttonGroup}>
                  <button
                    onClick={() => handleApprove(company.company_id)}
                    disabled={actingId === company.company_id}
                    className={`${styles.btn} ${styles.approve}`}
                  >
                    approve
                  </button>
                  <button
                    onClick={() => handleReject(company.company_id)}
                    disabled={actingId === company.company_id}
                    className={`${styles.btn} ${styles.reject}`}
                  >
                    reject
                  </button>
                  <button
                    className={`${styles.btn} ${styles.seeInfo}`}
                    onClick={() =>
                      router.push(`/admin/company/${company.company_id}`)
                    }
                  >
                    See Info
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default Home;
