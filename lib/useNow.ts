"use client";
import { useEffect, useState } from "react";

// เวลาปัจจุบันที่อัปเดตเองทุก intervalMs ให้หน้าเปลี่ยนการ์ดตามเวลาได้โดยไม่ต้องรีเฟรช
export function useNow(intervalMs: number = 30_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
