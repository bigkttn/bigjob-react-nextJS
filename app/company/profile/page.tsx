// 📂 app/company/profile/CompanyProfile.tsx
"use client";
import Swal from "sweetalert2";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import styles from "./companyProfile.module.css";
import Link from "next/link";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { deleteStorageFile } from "@/lib/storageFile";
import { showAlert } from "@/lib/customAlert";
import CompanyEditForm from "./CompanyEditForm";
import ReviewSection from "@/components/ReviewSection";
type LeafletMapProps = {
  lat: number | string | null;
  lng: number | string | null;
  isEditMode: boolean;
  onChangeLocation: (newLat: number, newLng: number) => void;
};

const CompanyProfile = () => {
  const MapWithNoSSR = dynamic<LeafletMapProps>(
    () => import("@/components/LeafletMap"),
    {
      ssr: false,
      loading: () => (
        <div
          style={{
            height: "300px",
            background: "#eee",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p>Loading Map...</p>
        </div>
      ),
    },
  );

  const [sessionUser, setSessionUser] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  // State สำหรับเปิด/ปิด Popup พรีวิวไฟล์
  const [showPreview, setShowPreview] = useState(false);

  // 🆕 State สำหรับระบบ Drag and Drop และการเลือกไฟล์ใหม่
  const [selectedCertFile, setSelectedCertFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  const fetchSessionUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) setSessionUser(data.user);
      else setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchCompanyProfile = async (companyId: string) => {
    try {
      const res = await fetch(`/api/company/getCompanyById/${companyId}`);
      const data = await res.json();
      if (res.ok) {
        setCompany(data.company);
        setEditForm(JSON.parse(JSON.stringify(data.company)));
        setPosts(data.posts || []);
        setReviews(data.reviews || []);
      } else {
        setError(data.error || "Failed to fetch company profile");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionUser();
  }, []);

  useEffect(() => {
    if (sessionUser?.id) fetchCompanyProfile(sessionUser.id);
  }, [sessionUser?.id]);

  const handleFieldChange = (field: string, value: any) =>
    setEditForm((prev: any) => ({ ...prev, [field]: value }));

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    targetField: "logo_image" | "cover_image",
  ) => {
    const file = event.target.files?.[0];
    if (!file || !sessionUser?.id) return;
    event.target.value = "";

    const oldUrl: string | null = company?.[targetField] ?? null;

    try {
      setSaving(true);
      showAlert.loading("กำลังอัปโหลดรูปภาพ...");
      const filePath = `company_images/${sessionUser.id}_${targetField}_${Date.now()}_${file.name}`;
      const storageRef = ref(storage, filePath);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      const res = await fetch(`/api/company/updateProfile/${sessionUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [targetField]: downloadURL }),
      });

      if (!res.ok) {
        // บันทึกไม่ผ่าน → ลบไฟล์ใหม่ทิ้ง ไม่ให้ค้างใน Firebase
        await deleteStorageFile(downloadURL);
        Swal.fire("เกิดข้อผิดพลาดในการบันทึกรูปภาพ");
        return;
      }

      setCompany((prev: any) => ({ ...prev, [targetField]: downloadURL }));
      setEditForm((prev: any) => ({ ...prev, [targetField]: downloadURL }));
      await deleteStorageFile(oldUrl);
      showAlert.close();
    } catch (err: any) {
      Swal.fire(`อัปโหลดล้มเหลว: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // 🆕 จัดการการเลือกไฟล์ผ่านคลิกปุ่ม
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedCertFile(file);
    }
  };

  // 🆕 จัดการโซนลากไฟล์มาวาง (Drag & Drop Events)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!uploadingCert && !isVerified && !isPending) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (uploadingCert || isVerified || isPending) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const allowedExtensions = /(\.pdf|\.jpg|\.jpeg|\.png|\.docx)$/i;
      if (!allowedExtensions.exec(file.name)) {
        Swal.fire("รองรับเฉพาะไฟล์ PDF, JPG, PNG, DOCX เท่านั้นครับ");
        return;
      }
      setSelectedCertFile(file);
    }
  };

  // 🆕 ฟังก์ชันกดส่งไฟล์ (ปุ่ม Send) ทำงานผ่านการคลิกแยกส่วนชัดเจน
  const handleCertUpload = async () => {
    if (!selectedCertFile || !sessionUser?.id) return;

    const oldUrl: string | null = company?.dbd_file ?? null;

    try {
      setUploadingCert(true);
      showAlert.loading("กำลังส่งไฟล์...");
      const filePath = `company_documents/${sessionUser.id}_dbd_${Date.now()}_${selectedCertFile.name}`;
      const storageRef = ref(storage, filePath);
      const uploadResult = await uploadBytes(storageRef, selectedCertFile);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      const res = await fetch(`/api/company/updateProfile/${sessionUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dbd_file: downloadURL }),
      });

      if (!res.ok) {
        // บันทึกไม่ผ่าน → ลบไฟล์ใหม่ทิ้ง ไม่ให้ค้างใน Firebase
        await deleteStorageFile(downloadURL);
        const errData = await res.json();
        Swal.fire(errData.error || "เกิดข้อผิดพลาดในการอัปโหลดไฟล์");
        return;
      }

      const data = await res.json();
      setCompany(data.company);
      setEditForm(JSON.parse(JSON.stringify(data.company)));
      setSelectedCertFile(null); // เคลียร์ไฟล์เก่าออกหลังอัปโหลดเสร็จเรียบร้อย
      if (certInputRef.current) certInputRef.current.value = "";
      await deleteStorageFile(oldUrl);
      Swal.fire("อัปโหลดไฟล์เรียบร้อย! ระบบจะส่งให้ Admin ตรวจสอบใหม่อีกครั้ง");
    } catch (err: any) {
      Swal.fire(`อัปโหลดล้มเหลว: ${err.message}`);
    } finally {
      setUploadingCert(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!sessionUser?.id) return;
    setSaving(true);
    try {
      const { dbd_file, ...restOfForm } = editForm;

      const payload = {
        ...restOfForm,
        company_latitude: editForm.company_latitude
          ? parseFloat(editForm.company_latitude)
          : null,
        company_longitude: editForm.company_longitude
          ? parseFloat(editForm.company_longitude)
          : null,
      };

      const res = await fetch(`/api/company/updateProfile/${sessionUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setCompany((prev: any) => ({ ...prev, ...payload }));
        setEditMode(false);
        Swal.fire("บันทึกการเปลี่ยนแปลงโปรไฟล์เรียบร้อยแล้ว!");
      } else {
        const data = await res.json();
        Swal.fire(data.error || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (err: any) {
      Swal.fire(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!company || !editForm) return <p>No company data</p>;

  const fmt = (val: any) =>
    val !== null && val !== undefined && val !== "" ? String(val) : "-";

  const isVerified =
    typeof company.verification_status === "string" &&
    company.verification_status.toLowerCase() === "approved";
  const isRejected =
    typeof company.verification_status === "string" &&
    company.verification_status.toLowerCase() === "rejected";

  const statusColor = isVerified ? "#1a8a2a" : isRejected ? "#b50000" : "#888";
  const statusLabel = isVerified
    ? "ยืนยันตัวตนแล้ว"
    : isRejected
      ? "ถูกปฏิเสธ"
      : "รอตรวจสอบ";

  const isPdf =
    typeof company.dbd_file === "string" &&
    company.dbd_file.toLowerCase().includes(".pdf");

  const isPending = !isVerified && !isRejected && company.dbd_file;
  /* ปุ่มแก้ไขโปรไฟล์ / บันทึก / ยกเลิก ใช้ 2 ที่:
   * ในการ์ดโปรไฟล์ (จอใหญ่) และใต้แผนที่ (มือถือ) */
  const profileActions = !editMode ? (
    <>
      {" "}
      <button
        type="button"
        onClick={() => setEditMode(true)}
        style={{
          width: "100%",
          padding: "10px 16px",
          backgroundColor: "#111111",
          color: "#fff",
          border: "none",
          borderRadius: "999px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        แก้ไขโปรไฟล์
      </button>
      <Link
        href="/company/forgot-password"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          marginTop: "0.6rem",
          padding: "10px 18px",
          backgroundColor: "#ffffff",
          color: "#111827",
          borderRadius: "999px",
          border: "1px solid #d1d5db",
          fontSize: "0.92rem",
          fontWeight: 600,
          textDecoration: "none",
          boxSizing: "border-box",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#f3f4f6";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#ffffff";
        }}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        ลืมรหัสผ่าน
      </Link>
    </>
  ) : (
    <div style={{ display: "flex", gap: "0.6rem" }}>
      <button
        type="button"
        onClick={handleSaveChanges}
        disabled={saving}
        style={{
          flex: 1,
          padding: "10px 14px",
          backgroundColor: saving ? "#5fb37b" : "#28a745",
          color: "#fff",
          border: "none",
          borderRadius: "999px",
          fontWeight: 700,
          cursor: saving ? "wait" : "pointer",
        }}
      >
        {saving ? "กำลังบันทึก..." : "บันทึก"}
      </button>
      <button
        type="button"
        onClick={() => {
          setEditMode(false);
          setEditForm(JSON.parse(JSON.stringify(company)));
        }}
        disabled={saving}
        style={{
          flex: 1,
          padding: "10px 14px",
          backgroundColor: "#fff",
          color: "#dc3545",
          border: "1.5px solid #dc3545",
          borderRadius: "999px",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        ยกเลิก
      </button>
    </div>
  );

  return (
    <div className={styles.container}>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
      />

      {/* ส่วน Modal Preview ไฟล์ */}
      {showPreview && company.dbd_file && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowPreview(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                Preview: Company Certificate
              </span>
              <button
                className={styles.closeModalBtn}
                onClick={() => setShowPreview(false)}
              >
                ปิดหน้าต่าง ✖
              </button>
            </div>
            <div className={styles.modalBody}>
              {isPdf ? (
                <iframe
                  src={company.dbd_file}
                  width="100%"
                  height="100%"
                  style={{ border: "none" }}
                />
              ) : (
                <img
                  src={company.dbd_file}
                  alt="Certificate Preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ฝั่งซ้าย: ข้อมูลบริษัท */}
      <div className={styles.leftSection}>
        <div className={styles.profileCard}>
          <div
            style={{ position: "relative", cursor: "pointer" }}
            onClick={() => bannerInputRef.current?.click()}
          >
            <input
              type="file"
              accept="image/*"
              ref={bannerInputRef}
              onChange={(e) => handleImageUpload(e, "cover_image")}
              style={{ display: "none" }}
            />
            <img
              src={
                company.cover_image ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(company.company_name || "Company")}&background=random`
              }
              className={styles.banner}
              alt="Banner"
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                // borderRadius: "50%",
                backgroundColor: "rgba(0, 0, 0, 0.4)", // สีดำโปร่งแสง
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "#fff",
                fontSize: "0.85rem",
                fontWeight: "bold",
                opacity: 0,
                transition: "opacity 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
            >
              เปลี่ยนรูป
            </div>
          </div>

          <div
            className={styles.logoWrapper}
            style={{ cursor: "pointer" }}
            onClick={() => logoInputRef.current?.click()}
          >
            <input
              type="file"
              accept="image/*"
              ref={logoInputRef}
              onChange={(e) => handleImageUpload(e, "logo_image")}
              style={{ display: "none" }}
            />
            <div style={{ position: "relative", width: 120, height: 120 }}>
              <img
                src={
                  company.logo_image ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(company.company_name || "Company")}&background=random`
                }
                className={styles.logo}
                alt="Logo"
              />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  backgroundColor: "rgba(0, 0, 0, 0.4)", // สีดำโปร่งแสง
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "#fff",
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                  opacity: 0,
                  transition: "opacity 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
              >
                เปลี่ยนรูป
              </div>
            </div>
          </div>

          <div className={styles.infoArea}>
            {editMode ? (
              <CompanyEditForm
                form={editForm}
                email={company.company_email ?? ""}
                onChange={handleFieldChange}
              />
            ) : (
              <>
                <h1 className={styles.companyName}>
                  {fmt(company.company_name)}
                  {isVerified ? (
                    <span
                      className="material-symbols-outlined"
                      title="บริษัทนี้ผ่านการยืนยันตัวตนแล้ว"
                      style={{ color: "#1d9bf0" }}
                    >
                      verified
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: statusColor,
                        border: `1px solid ${statusColor}`,
                        borderRadius: "999px",
                        padding: "2px 10px",
                        alignSelf: "center",
                      }}
                    >
                      {statusLabel}
                    </span>
                  )}
                </h1>

                <p>{fmt(company.brief_history)}</p>

                <hr />
                <div className={styles.contactGroup}>
                  <h3>ช่องทางการติดต่อและสถานที่ตั้ง</h3>
                  <p>
                    <strong>ข้อมูลติดต่อ:</strong>{" "}
                    {fmt(company.contact_information)}
                  </p>
                  <p>
                    <strong>รายละเอียดที่อยู่:</strong>{" "}
                    {fmt(company.full_address)}
                  </p>
                  <p>
                    <strong>จังหวัด:</strong> {fmt(company.province)}
                  </p>
                  <p>
                    <strong>รหัสไปรษณีย์:</strong> {fmt(company.postcode)}
                  </p>
                  <p>
                    <strong>เบอร์โทรศัพท์:</strong> {fmt(company.mobile_phone)}
                  </p>
                  <p>
                    <strong>อีเมล:</strong> {fmt(company.company_email)}
                  </p>
                  <p style={{ fontSize: "0.85rem", color: "#666" }}>
                    พิกัดแผนที่:{" "}
                    {company.company_latitude
                      ? `${company.company_latitude}, ${company.company_longitude}`
                      : "ยังไม่ได้กำหนด"}
                  </p>
                </div>
              </>
            )}

            <div className={styles.desktopActions}>{profileActions}</div>
          </div>
        </div>

        <div className={styles.mapWrapper}>
          <MapWithNoSSR
            lat={
              editMode ? editForm.company_latitude : company.company_latitude
            }
            lng={
              editMode ? editForm.company_longitude : company.company_longitude
            }
            isEditMode={editMode}
            onChangeLocation={(newLat: number, newLng: number) => {
              if (editMode) {
                handleFieldChange("company_latitude", newLat);
                handleFieldChange("company_longitude", newLng);
              }
            }}
          />
        </div>

        {/* มือถือ: ปุ่มแก้ไข / บันทึก อยู่ใต้แผนที่ */}
        <div className={styles.mobileActions}>{profileActions}</div>
      </div>

      {/* ฝั่งขวา: ตำแหน่งงานและรีวิว */}
      <div className={styles.rightSection}>
        <div className={styles.VerifiedConfirm}>
          <div className={styles.certHeader}>
            <div className={styles.certTitleGroup}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "32px", color: statusColor }}
              >
                {isVerified
                  ? "verified_user"
                  : isRejected
                    ? "gpp_bad"
                    : "pending_actions"}
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#1e293b" }}>
                  หนังสือรับรองการจดทะเบียนบริษัท
                </h3>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "0.85rem",
                    color: "#64748b",
                  }}
                >
                  {isVerified
                    ? "เอกสารนี้ได้รับการตรวจสอบและอนุมัติโดยระบบแล้ว"
                    : isRejected
                      ? "เอกสารนี้ถูกปฏิเสธหรือไม่ผ่านการตรวจสอบ"
                      : "เอกสารนี้อยู่ระหว่างการตรวจสอบ"}
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#fff",
                backgroundColor: statusColor,
                borderRadius: "999px",
                padding: "6px 16px",
                boxShadow: `0 2px 8px ${statusColor}40`,
              }}
            >
              {statusLabel}
            </span>
          </div>

          {isRejected && company.verification_comment && (
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#b50000" }}>
              <strong>เหตุผลที่ถูกปฏิเสธ:</strong>{" "}
              {company.verification_comment}
            </p>
          )}

          <div>
            {company.dbd_file ? (
              <button
                type="button"
                className={styles.viewCertBtn}
                onClick={() => setShowPreview(true)}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "18px" }}
                >
                  description
                </span>
                เปิดดูไฟล์ที่อัปโหลดล่าสุด
              </button>
            ) : (
              <span style={{ fontSize: "0.85rem", color: "#888" }}>
                ยังไม่มีไฟล์ที่อัปโหลด
              </span>
            )}
          </div>

          {/* 🆕 ส่วนแสดงผล UI อัปโหลดตามตัวอย่างรูปภาพของคุณ */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginTop: "4px",
            }}
          >
            <label
              style={{ fontSize: "0.88rem", color: "#222", fontWeight: 500 }}
            >
              เพิ่มเอกสารจดทะเบียนบริษัทหรือหนังสือรับรองเพื่อยืนยันตัวตน
            </label>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
              }}
            >
              {/* โซนลากไฟล์และคลิกเลือกไฟล์ ดีไซน์แบบวงรี มีเส้นประสีดำ */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => {
                  if (!uploadingCert && !isVerified && !isPending) {
                    certInputRef.current?.click();
                  }
                }}
                style={{
                  flex: 1,
                  border: isDragging
                    ? "1.5px dashed #1d9bf0"
                    : "1.5px dashed #000000",
                  borderRadius: "999px",
                  backgroundColor: isDragging ? "#f0f8ff" : "#ece6e2",
                  padding: "10px 24px",
                  textAlign: "center",
                  fontSize: "0.85rem",
                  color: "#000000",
                  cursor:
                    uploadingCert || isVerified || isPending
                      ? "not-allowed"
                      : "pointer",
                  opacity: uploadingCert || isVerified || isPending ? 0.6 : 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  userSelect: "none",
                  transition: "all 0.2s",
                }}
              >
                {selectedCertFile
                  ? `เลือกไฟล์: ${selectedCertFile.name}`
                  : "ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์ (PDF, JPG, PNG, DOCX)"}
              </div>

              {/* แท็ก Input ชนิดไฟล์ที่หลบไว้เบื้องหลัง เพิ่ม docx เข้าไปด้วย */}
              <input
                type="file"
                accept="image/*,.pdf,.docx"
                ref={certInputRef}
                onChange={handleFileChange}
                style={{ display: "none" }}
                disabled={uploadingCert || isVerified || isPending}
              />

              {/* ปุ่มกด Send ส่งข้อมูลยืนยัน */}
              <button
                type="button"
                onClick={handleCertUpload}
                disabled={
                  !selectedCertFile || uploadingCert || isVerified || isPending
                }
                style={{
                  padding: "10px 28px",
                  borderRadius: "999px",
                  border: "none",
                  backgroundColor:
                    !selectedCertFile ||
                    uploadingCert ||
                    isVerified ||
                    isPending
                      ? "#cccccc"
                      : "#000000",
                  color:
                    !selectedCertFile ||
                    uploadingCert ||
                    isVerified ||
                    isPending
                      ? "#666666"
                      : "#ffffff",
                  fontWeight: "bold",
                  fontSize: "0.9rem",
                  cursor:
                    !selectedCertFile ||
                    uploadingCert ||
                    isVerified ||
                    isPending
                      ? "not-allowed"
                      : "pointer",
                  transition: "background-color 0.2s",
                }}
              >
                {uploadingCert ? "กำลังส่ง..." : "ส่งไฟล์"}
              </button>
            </div>
          </div>

          <p style={{ margin: 0, fontSize: "0.75rem", color: "#aaa" }}>
            * เมื่ออัปโหลดไฟล์ใหม่ สถานะจะเปลี่ยนเป็น "รอตรวจสอบ" อัตโนมัติ
          </p>
        </div>

        {/* งานและรีวิว */}
        <div className={styles.jobScrollArea}>
          {posts.length === 0 ? (
            <p style={{ color: "#888" }}>ยังไม่มีตำแหน่งงานที่เปิดรับ</p>
          ) : (
            posts.map((job: any) => (
              <div key={job.post_id} className={styles.jobCard}>
                <img
                  src={
                    company.logo_image ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(company.company_name || "Company")}&background=random`
                  }
                  width={80}
                  height={80}
                  alt="Job Logo"
                />
                <div>
                  <h2>{fmt(job.job_position)}</h2>
                  <p>
                    <strong>รายละเอียดงาน:</strong> {fmt(job.job_description)}
                  </p>
                  <p>
                    <strong>เงินเดือน:</strong> {fmt(job.salary_min)} -{" "}
                    {fmt(job.salary_max)} บาท / เดือน
                  </p>
                  <Link href={`/company/detail/${job.post_id}`}>
                    <button className={styles.detailBtn}>แก้ไข</button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* รีวิวบริษัท */}
        <ReviewSection
          reviews={reviews}
          profileLinkPrefix="/company/seeker-profile/"
        />
      </div>
    </div>
  );
};

export default CompanyProfile;
