"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function SessionRefresher() {
  const pathname = usePathname();

  useEffect(() => {
    const refreshSession = async () => {
      try {
        await fetch("/api/auth/refresh", { method: "POST" });
      } catch (error) {
        console.error("Failed to refresh session", error);
      }
    };

    // ส่ง request ไปต่ออายุทุกครั้งที่มีการเปลี่ยนหน้า (หรือโหลดเว็บครั้งแรก)
    refreshSession();
  }, [pathname]);

  return null;
}
