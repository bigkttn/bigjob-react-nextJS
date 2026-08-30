"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import UserHomeClient from "./user/user-home/userhome-client";
import CompanyHomeClient from "./company/company-home/page";

interface User {
  role: string;
  [key: string]: unknown;
}

interface HomeSwitcherProps {
  initialUser?: User;
}

type AppMode = "user" | "company";

const MODE_OPTIONS: { key: AppMode; label: string }[] = [
  { key: "user", label: "ผู้หางาน" },
  { key: "company", label: "บริษัท" },
];

export default function HomeSwitcher({ initialUser }: HomeSwitcherProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [mode, setMode] = useState<AppMode>("user");

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (data?.user) {
          const role = data.user.role;
          setUser(data.user);

          // เช็ค Role แล้วพาแยกไปหน้าตามบทบาททันที
          switch (role) {
            case "admin":
              router.replace("/admin/home");
              return;
            case "company":
              router.replace("/company/company-home");
              return;
            case "seeker":
            case "user":
              router.replace("/user/user-home");
              return;
            default:
              break;
          }
        }
      } catch (error) {
        console.error("Failed to check session:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSessionAndRedirect();
  }, [router]);

  // แสดงหน้า Loading ชั่วคราวก่อนย้ายหน้า เพื่อป้องกันหน้าจอกระตุก
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <p className="text-lg font-semibold">กำลังตรวจสอบสิทธิ์ผู้ใช้งาน...</p>
      </div>
    );
  }

  // กรณีที่เป็น Guest (ไม่ได้ Login) ให้แสดงหน้า Switcher/Landing ตามปกติ
  return (
    <main className="relative min-h-screen">
      {/* ---------- ปุ่มสลับโหมด ----------
       * ทรง segmented แทนสวิตช์เลื่อน เพราะผู้หางานกับบริษัทเป็นสองโหมด
       * ที่เท่ากัน ไม่มีอันไหนเป็นค่า "ปิด" ผู้ใช้จึงเห็นตัวเลือกทั้งคู่พร้อมกัน
       * และรู้ทันทีว่าอยู่โหมดไหน ไม่ต้องเดาว่าเลื่อนแล้วจะไปทางไหน
       */}
      <div className="mode-switcher">
        <span className="mode-label">MODE</span>

        <div
          className="mode-group"
          role="group"
          aria-label="เลือกโหมดการใช้งาน"
        >
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className="mode-option"
              aria-pressed={mode === opt.key}
              onClick={() => setMode(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {mode === "user" ? (
        <UserHomeClient initialUser={user} />
      ) : (
        <CompanyHomeClient initialUser={user} />
      )}

      <style jsx global>{`
        /* ---------- ปุ่มสลับโหมด ----------
         * อ้างอิงจากองค์ประกอบที่มีอยู่ในหน้า
         *   พื้นดำ #111111 เหมือน dropdown ในแถบฟิลเตอร์และปุ่ม Details
         *   มุมมน 10px
         *   สูง 44px เท่าแถวฟิลเตอร์ ปุ่มจะได้ไม่โดดออกมา
         */
        .mode-switcher {
          position: absolute;
          top: 20px;
          left: 16px;
          z-index: 50;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .mode-label {
          font-size: 0.8125rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #4a4a4a;
          white-space: nowrap;
        }

        .mode-group {
          display: inline-flex;
          align-items: center;
          height: 44px;
          padding: 4px;
          gap: 2px;
          background: #111111;
          border-radius: 10px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
        }

        .mode-option {
          appearance: none;
          border: none;
          cursor: pointer;
          height: 36px;
          padding: 0 16px;
          border-radius: 7px;
          background: transparent;
          color: rgba(255, 255, 255, 0.66);
          font-family: inherit;
          font-size: 0.8125rem;
          font-weight: 600;
          white-space: nowrap;
          transition:
            background-color 180ms ease,
            color 180ms ease;
        }

        .mode-option:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
        }

        .mode-option:focus-visible {
          outline: 2px solid #ffffff;
          outline-offset: 2px;
        }

        /* ตัวที่เลือกอยู่ = พื้นขาวตัวหนังสือดำ ตัดกันชัดที่สุดบนพื้นดำ */
        .mode-option[aria-pressed="true"] {
          background: #ffffff;
          color: #111111;
        }

        @media (max-width: 640px) {
          .mode-label {
            display: none;
          }

          .mode-group {
            height: 40px;
          }

          .mode-option {
            height: 32px;
            padding: 0 12px;
            font-size: 0.75rem;
          }
        }
      `}</style>
    </main>
  );
}
