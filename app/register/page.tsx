"use client";
import { showAlert } from "@/lib/customAlert";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReCAPTCHA from "react-google-recaptcha";
import styles from "./register.module.css";

const Register = () => {
  const router = useRouter();

  const [userType, setUserType] = useState<"seeker" | "company">("seeker");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [otpCode, setOtpCode] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0 && !isOtpVerified) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown, isOtpVerified]);

  const countdownDisplay = () => {
    const m = Math.floor(countdown / 60);
    const s = countdown % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullname: "",
    companyName: "",
    businessType: "", // เพิ่มรับค่าประเภทธุรกิจ
    contactName: "",
    phone: "",
  });

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // เชื่อมต่อ Google Auth และแสดงปุ่มสมัครสมาชิก
  useEffect(() => {
    const initGoogle = () => {
      const google = window.google;
      if (google) {
        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
        });
        google.accounts.id.renderButton(
          document.getElementById("google-btn-register-container"),
          {
            theme: "filled_back",
            size: "large",
            width: "350",
            shape: "pill",
            text: "signup_with",
          },
        );
      }
    };

    // เช็ค script โหลดหรือยัง
    if (!window.google) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
    } else {
      initGoogle();
    }
  }, [userType]);

  const handleGoogleCredentialResponse = async (response: any) => {
    /* console.log("Google Token:", response.credential) */ let payload: any = {
      token: response.credential,
      userType: userType,
    };

    if (userType === "seeker") {
      if (registerData.fullname) {
        payload.fullname = registerData.fullname;
      }
    } else if (userType === "company") {
      payload.company_name = registerData.companyName;
      payload.business_type = registerData.businessType;
      payload.contact_name = registerData.contactName;
      payload.mobile_phone = registerData.phone;

      if (
        !registerData.companyName ||
        !registerData.businessType ||
        !registerData.phone
      ) {
        showAlert.info(
          "แจ้งเตือน",
          "กรุณากรอกข้อมูลบริษัทให้ครบถ้วน",
        );
        return;
      }
    }

    try {
      const res = await fetch("/api/auth/registerGoogle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        showAlert.success("แจ้งเตือน", "สมัครสมาชิกสำเร็จ ยินดีต้อนรับ");
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        if (data.user.role === "seeker") {
          window.location.replace("/user/user-home");
        } else {
          window.location.replace("/company/company-home");
        }
      } else {
        showAlert.error(
          "แจ้งเตือน",
          "สมัครสมาชิกด้วย Google ไม่สำเร็จ: " + (data.message || "เกิดข้อผิดพลาดในระบบ"),
        );
      }
    } catch (err) {
      console.error("Google Sign-up Error:", err);
      showAlert.error("แจ้งเตือน", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const requestOtp = async () => {
    if (!registerData.email)
      return showAlert.error("แจ้งเตือน", "กรุณากรอกอีเมลก่อนขอรหัส OTP");
    setIsLoadingOtp(true);

    try {
      // เรียก API ไปยัง Route ที่เราสร้างไว้
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerData.email,
          purpose: "register",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsOtpSent(true);
        setCountdown(300);
        showAlert.success("แจ้งเตือน", "" + data.message); // แสดงข้อความ "ส่ง OTP สำเร็จ"
      } else {
        showAlert.error("แจ้งเตือน", "เกิดข้อผิดพลาด: " + data.message);
      }
    } catch (error) {
      console.error("Request OTP Error:", error);
      showAlert.error(
        "แจ้งเตือน",
        "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง",
      );
    } finally {
      setIsLoadingOtp(false); // ปิดสถานะโหลดไม่ว่าจะสำเร็จหรือล้มเหลว
    }
  };

  const verifyOtp = async () => {
    if (!otpCode) return showAlert.info("แจ้งเตือน", "กรุณากรอกรหัส OTP");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registerData.email, otp: otpCode }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsOtpVerified(true);
        setCountdown(0);
        showAlert.success(
          "แจ้งเตือน",
          "ยืนยัน OTP สำเร็จ กรุณากรอกข้อมูลส่วนอื่นต่อได้เลย",
        );
      } else {
        showAlert.error("แจ้งเตือน", data.message);
      }
    } catch (error) {
      console.error("Verify OTP Error:", error);
      showAlert.error("แจ้งเตือน", "ไม่สามารถยืนยัน OTP ได้");
    }
  };

  // --------------------------------------------------------
  // อัปเดต: ฟังก์ชันสมัครสมาชิกแบบปกติ
  // --------------------------------------------------------
  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. ตรวจสอบข้อมูลเบื้องต้น (Validation)
    if (!captchaToken)
      return showAlert.info("แจ้งเตือน", "กรุณายืนยันว่าคุณไม่ใช่โปรแกรมอัตโนมัติ (CAPTCHA)");
    if (registerData.password.length < 8)
      return showAlert.error("แจ้งเตือน", "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
    if (registerData.password !== registerData.confirmPassword)
      return showAlert.error("แจ้งเตือน", "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
    if (!isOtpVerified)
      return showAlert.info("แจ้งเตือน", "กรุณากดยืนยันรหัส OTP ก่อน"); // เช็ค OTP

    if (userType === "company") {
      if (!registerData.companyName || !registerData.phone) {
        return showAlert.info(
          "แจ้งเตือน",
          "กรุณากรอกข้อมูลบริษัทให้ครบถ้วน",
        );
      }
    } else {
      if (!registerData.fullname) {
        return showAlert.info("แจ้งเตือน", "กรุณากรอกชื่อ-นามสกุล");
      }
    }

    // 2. เตรียมข้อมูลส่งไป API
    const payload = {
      email: registerData.email,
      password: registerData.password,
      userType: userType,
      fullname: registerData.fullname,
      company_name: registerData.companyName,
      business_type: registerData.businessType,
      contact_name: registerData.contactName,
      mobile_phone: registerData.phone,
      otpCode: otpCode, // 👈 เพิ่มบรรทัดนี้ เพื่อส่ง OTP ไปให้หลังบ้านเช็ค!
      captchaToken: captchaToken, // ส่งให้หลังบ้านตรวจกับ Google
    };

    try {
      // 3. ยิง API สมัครสมาชิกแบบปกติ
      const res = await fetch("/api/auth/registerB", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // (โค้ดส่วนที่เหลือของคุณใช้งานได้ดีอยู่แล้วครับ)
      const data = await res.json();

      if (res.ok) {
        showAlert.success(
          "แจ้งเตือน",
          "สมัครสมาชิกสำเร็จ ยินดีต้อนรับสู่ BIGJOBs",
        );
        localStorage.setItem("currentUser", JSON.stringify(data.user));

        if (data.user.role === "seeker") {
          window.location.replace("/user/user-home");
        } else {
          window.location.replace("/company/company-home");
        }
      } else {
        // token ของ reCAPTCHA ใช้ได้ครั้งเดียว ต้องให้ติ๊กใหม่ก่อนส่งอีกรอบ
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
        showAlert.error(
          "แจ้งเตือน",
          "สมัครสมาชิกไม่สำเร็จ: " + (data.message || "เกิดข้อผิดพลาดในระบบ"),
        );
      }
    } catch (error) {
      console.error("Registration Error:", error);
      showAlert.error(
        "แจ้งเตือน",
        "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง",
      );
    }
  };

  return (
    <div className={styles.registerContainer}>
      <div className={styles.registerCard}>
        {/* Brand Side */}
        <div className={styles.brandSide}>
          <div className={styles.logo}>BIGJOBs</div>
          <div className={styles.slogan}>
            <h1>
              {userType === "seeker" ? "ร่วมงานกับเรา" : "เป็นพาร์ทเนอร์กับเรา"}
              <br />
              <span>
                {userType === "seeker"
                  ? "พร้อมเติบโตไปด้วยกัน"
                  : "ขยายธุรกิจของคุณ"}
              </span>
            </h1>
          </div>
          <div className={styles.decorationCircle}></div>
        </div>

        {/* Form Side */}
        <div className={styles.formSide}>
          <div className={styles.userTypeSelector}>
            <button
              className={`${styles.typeBtn} ${userType === "seeker" ? styles.typeBtnActive : ""}`}
              onClick={() => setUserType("seeker")}
            >
              ผู้หางาน
            </button>
            <button
              className={`${styles.typeBtn} ${userType === "company" ? styles.typeBtnActive : ""}`}
              onClick={() => setUserType("company")}
            >
              ผู้ประกอบการ
            </button>
          </div>

          <div className={styles.formContent}>
            <h2>
              สร้างบัญชีสำหรับ{" "}
              {userType === "seeker" ? "ผู้หางาน" : "ผู้ประกอบการ"}
            </h2>

            <form onSubmit={onRegister}>
              {/* Input: Full Name (Seeker Only) */}
              {userType === "seeker" && (
                <div className={styles.inputGroup}>
                  <label>ชื่อ - นามสกุล</label>
                  <input
                    type="text"
                    placeholder="กรอกชื่อและนามสกุลของคุณ"
                    value={registerData.fullname}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        fullname: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              )}

              {/* Input: Email */}
              <div className={styles.inputGroup}>
                <label>อีเมล</label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={registerData.email}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, email: e.target.value })
                  }
                  required
                />
              </div>

              {/* Input: OTP */}
              <div className={styles.inputGroup}>
                <label>รหัสยืนยัน (OTP)</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    type="text"
                    placeholder="กรอกรหัส 6 หลัก"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      letterSpacing: "2px",
                      fontWeight: "bold",
                    }}
                    required
                    disabled={isOtpVerified}
                  />
                  {isOtpSent && !isOtpVerified && (
                    <button
                      type="button"
                      onClick={verifyOtp}
                      disabled={!otpCode || otpCode.length < 6}
                      style={{
                        padding: "0 15px",
                        borderRadius: "5px",
                        border: "none",
                        backgroundColor: "#0d6efd",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: "14px",
                        minWidth: "100px",
                      }}
                    >
                      ยืนยัน OTP
                    </button>
                  )}
                  {isOtpVerified && (
                    <button
                      type="button"
                      disabled
                      style={{
                        padding: "0 15px",
                        borderRadius: "5px",
                        border: "none",
                        backgroundColor: "#28a745",
                        color: "#fff",
                        cursor: "not-allowed",
                        fontSize: "14px",
                        minWidth: "100px",
                      }}
                    >
                      ยืนยันแล้ว
                    </button>
                  )}
                  {!isOtpVerified && (
                    <button
                      type="button"
                      onClick={requestOtp}
                      disabled={
                        !registerData.email || isLoadingOtp || countdown > 0
                      }
                      className={styles.otpRequestBtn}
                      style={{
                        padding: "0 15px",
                        borderRadius: "5px",
                        border: "none",
                        backgroundColor: "#333",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: "14px",
                        minWidth: "100px",
                      }}
                    >
                      {isLoadingOtp
                        ? "กำลังส่ง..."
                        : countdown > 0
                          ? countdownDisplay()
                          : isOtpSent
                            ? "ส่งอีกครั้ง"
                            : "รับ OTP"}
                    </button>
                  )}
                </div>
                {isOtpSent && !isOtpVerified && (
                  <small
                    style={{
                      color: "#28a745",
                      marginTop: "5px",
                      display: "block",
                    }}
                  >
                    ส่ง OTP แล้ว{" "}
                    {countdown > 0 && `(ส่งใหม่ได้ใน ${countdownDisplay()})`}
                  </small>
                )}
                {isOtpVerified && (
                  <small
                    style={{
                      color: "#28a745",
                      marginTop: "5px",
                      display: "block",
                    }}
                  >
                    อีเมลได้รับการยืนยันแล้ว
                    สามารถกรอกข้อมูลและกดสมัครสมาชิกได้เลย
                    (ไม่ต้องกังวลเรื่องเวลา)
                  </small>
                )}
              </div>

              {/* Password Row */}
              <div className={styles.inputGroupRow}>
                <div className={styles.inputGroup}>
                  <label>รหัสผ่าน</label>
                  <input
                    type="password"
                    placeholder="รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)"
                    minLength={8}
                    value={registerData.password}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        password: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>ยืนยันรหัสผ่าน</label>
                  <input
                    type="password"
                    placeholder="ยืนยันรหัสผ่าน"
                    minLength={8}
                    value={registerData.confirmPassword}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              {/* Company Fields */}
              {userType === "company" && (
                <div className={styles.companyFields}>
                  <div className={styles.inputGroupRow}>
                    <div className={styles.inputGroup}>
                      <label>ชื่อบริษัท</label>
                      <input
                        type="text"
                        value={registerData.companyName}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            companyName: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>ประเภทธุรกิจ</label>
                      <input
                        type="text"
                        placeholder="เช่น IT, สุขภาพ"
                        value={registerData.businessType}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            businessType: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className={styles.inputGroupRow}>
                    <div className={styles.inputGroup}>
                      <label>ชื่อผู้ประสานงาน</label>
                      <input
                        type="text"
                        value={registerData.contactName}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            contactName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>เบอร์โทรศัพท์</label>
                      <input
                        type="tel"
                        value={registerData.phone}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            phone: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ReCaptcha */}
              <div style={{ padding: "10px 0" }}>
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={
                    process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY || ""
                  }
                  onChange={(token) => setCaptchaToken(token)}
                  onExpired={() => setCaptchaToken(null)}
                />
              </div>

              <button type="submit" className={styles.btnRegister}>
                สมัครสมาชิก
              </button>
            </form>

            <div className={styles.divider}>
              <span>หรือ</span>
            </div>

            {/* Google Button Container */}
            <div
              id="google-btn-register-container"
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "15px",
              }}
            ></div>

            <div className={styles.footerLink}>
              <p>
                มีบัญชีอยู่แล้วใช่ไหม? <Link href="/login">เข้าสู่ระบบ</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
