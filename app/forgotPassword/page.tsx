"use client";
import React, { useState, useEffect } from "react";
import styles from "./forgotPassword.module.css";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [countdown, setCountdown] = useState(300); // 5 นาที
  const router = useRouter();
  // ⏱ countdown
  useEffect(() => {
    if (step !== "otp") return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  const countdownDisplay = () => {
    const m = Math.floor(countdown / 60);
    const s = countdown % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // 📧 validate email
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // 📩 ส่ง OTP
  const sendOtp = async () => {
    setErrorMsg("");

    if (!email) {
      setErrorMsg("Please enter your email");
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMsg("รูปแบบ Email ไม่ถูกต้อง");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep("otp");
        setCountdown(300); // reset timer
      } else {
        setErrorMsg(data.message);
      }
    } catch (err) {
      setErrorMsg("เกิดข้อผิดพลาด");
    } finally {
      setIsLoading(false);
    }
  };

  // 🔢 verify OTP
  const verifyOtp = async () => {
    setErrorMsg("");

    if (!otp) {
      setErrorMsg("กรุณากรอก OTP");
      return;
    }

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep("reset");
      } else {
        setErrorMsg(data.message);
      }
    } catch {
      setErrorMsg("เกิดข้อผิดพลาด");
    }
  };

  // 🔐 reset password
  const resetPassword = async () => {
    setErrorMsg("");

    if (!newPassword) {
      setErrorMsg("กรุณากรอกรหัสผ่านใหม่");
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("เปลี่ยนรหัสผ่านสำเร็จ");
        setStep("email");
        setEmail("");
        setOtp("");
        setNewPassword("");
        router.push("/login");
      } else {
        setErrorMsg(data.message);
      }
    } catch {
      setErrorMsg("เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className={styles.fpPage}>
      <div className={styles.fpCard}>
        <h2 className={styles.fpLogoText}>BIGJOBs</h2>

        {/* STEP 1: EMAIL */}
        {step === "email" && (
          <>
            <h3>ลืมรหัสผ่าน</h3>

            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {errorMsg && <div className={styles.fpError}>{errorMsg}</div>}

            <button
              onClick={sendOtp}
              className={styles.fpButton}
              disabled={isLoading}
            >
              {isLoading ? "กำลังส่ง..." : "ส่ง OTP"}
            </button>
          </>
        )}

        {/* STEP 2: OTP */}
        {step === "otp" && (
          <>
            <h3>กรอก OTP</h3>

            <p>
              ส่ง OTP ไปที่ <strong>{email}</strong>
            </p>

            <input
              type="text"
              placeholder="กรอก OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <div>
              หมดอายุใน <strong>{countdownDisplay()}</strong>
            </div>

            {errorMsg && <div className={styles.fpError}>{errorMsg}</div>}

            <button onClick={verifyOtp} className={styles.fpButton}>
              ยืนยัน OTP
            </button>
          </>
        )}

        {/* STEP 3: RESET PASSWORD */}
        {step === "reset" && (
          <>
            <h3>ตั้งรหัสผ่านใหม่</h3>

            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            {errorMsg && <div className={styles.fpError}>{errorMsg}</div>}

            <button onClick={resetPassword} className={styles.fpButton}>
              ยืนยัน
            </button>
          </>
        )}
      </div>
    </div>
  );
}
