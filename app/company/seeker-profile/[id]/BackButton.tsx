"use client";
import { useRouter } from "next/navigation";
import styles from "./seekerProfile.module.css";

export default function BackButton() {
  const router = useRouter();
  return (
    <button className={styles.backBtn} onClick={() => router.back()}>
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
      Back
    </button>
  );
}
