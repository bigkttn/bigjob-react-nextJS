"use client";
import { useRouter } from "next/navigation";
import styles from "./userProfileCompany.module.css";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      className={styles.backBtn}
      onClick={() => router.back()}
      style={{
        display: "inline-flex",
        alignItems: "center",
        whiteSpace: "nowrap", // ป้องกันไม่ให้ข้อความตัดขึ้นบรรทัดใหม่
        width: "auto", // ให้ความกว้างขยายตามข้อความข้างใน
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: "6px", flexShrink: 0 }}
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
      ย้อนกลับ
    </button>
  );
}
