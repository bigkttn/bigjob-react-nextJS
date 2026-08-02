// 📂 app/company/profile/CompanyProfile.tsx
"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import styles from "./companyProfile.module.css";
import Link from "next/link";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import ProvinceSelect from "@/components/ProvinceSelect";
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

    try {
      setSaving(true);
      const filePath = `company_images/${sessionUser.id}_${targetField}_${Date.now()}_${file.name}`;
      const storageRef = ref(storage, filePath);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      const res = await fetch(`/api/company/updateProfile/${sessionUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [targetField]: downloadURL }),
      });

      if (res.ok) {
        setCompany((prev: any) => ({ ...prev, [targetField]: downloadURL }));
        setEditForm((prev: any) => ({ ...prev, [targetField]: downloadURL }));
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึกรูปภาพ");
      }
    } catch (err: any) {
      alert(`อัปโหลดล้มเหลว: ${err.message}`);
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
        alert("รองรับเฉพาะไฟล์ PDF, JPG, PNG, DOCX เท่านั้นครับ");
        return;
      }
      setSelectedCertFile(file);
    }
  };

  // 🆕 ฟังก์ชันกดส่งไฟล์ (ปุ่ม Send) ทำงานผ่านการคลิกแยกส่วนชัดเจน
  const handleCertUpload = async () => {
    if (!selectedCertFile || !sessionUser?.id) return;

    try {
      setUploadingCert(true);
      const filePath = `company_documents/${sessionUser.id}_dbd_${Date.now()}_${selectedCertFile.name}`;
      const storageRef = ref(storage, filePath);
      const uploadResult = await uploadBytes(storageRef, selectedCertFile);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      const res = await fetch(`/api/company/updateProfile/${sessionUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dbd_file: downloadURL }),
      });

      if (res.ok) {
        const data = await res.json();
        setCompany(data.company);
        setEditForm(JSON.parse(JSON.stringify(data.company)));
        setSelectedCertFile(null); // เคลียร์ไฟล์เก่าออกหลังอัปโหลดเสร็จเรียบร้อย
        if (certInputRef.current) certInputRef.current.value = "";
        alert(
          "อัปโหลดไฟล์เรียบร้อย! ระบบจะส่งให้ Admin ตรวจสอบใหม่อีกครั้ง 📄",
        );
      } else {
        const errData = await res.json();
        alert(errData.error || "เกิดข้อผิดพลาดในการอัปโหลดไฟล์");
      }
    } catch (err: any) {
      alert(`อัปโหลดล้มเหลว: ${err.message}`);
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
        alert("บันทึกการเปลี่ยนแปลงโปรไฟล์เรียบร้อยแล้ว!");
      } else {
        const data = await res.json();
        alert(data.error || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (err: any) {
      alert(err.message);
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
              src={company.cover_image || "/assets/images/company_2.jpg"}
              className={styles.banner}
              alt="Banner"
            />
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
                  company.logo_image || "/assets/images/suggestedCompanys.jpg"
                }
                className={styles.logo}
                alt="Logo"
              />
            </div>
          </div>

          <div className={styles.infoArea}>
            <h1 className={styles.companyName}>
              {!editMode ? (
                fmt(company.company_name)
              ) : (
                <input
                  type="text"
                  value={editForm.company_name ?? ""}
                  onChange={(e) =>
                    handleFieldChange("company_name", e.target.value)
                  }
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: "bold",
                    padding: "0.3rem 0.5rem",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    width: "100%",
                  }}
                />
              )}
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

            {!editMode ? (
              <p>{fmt(company.brief_history)}</p>
            ) : (
              <textarea
                value={editForm.brief_history ?? ""}
                onChange={(e) =>
                  handleFieldChange("brief_history", e.target.value)
                }
                style={{
                  width: "100%",
                  minHeight: "90px",
                  padding: "0.5rem",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  fontFamily: "inherit",
                  resize: "vertical",
                  marginTop: "0.5rem",
                }}
              />
            )}

            <hr />
            <div className={styles.contactGroup}>
              <h3>Contact & Location</h3>

              {!editMode ? (
                <>
                  <p>{fmt(company.contact_information)}</p>
                  <p>{fmt(company.full_address)}</p>
                  <p>{fmt(company.province)}</p>
                  <p>{fmt(company.postcode)}</p>
                  <p>Tel: {fmt(company.mobile_phone)}</p>
                  <p>Email: {fmt(company.company_email)}</p>
                  <p style={{ fontSize: "0.85rem", color: "#666" }}>
                    พิกัดแผนที่:{" "}
                    {company.company_latitude
                      ? `${company.company_latitude}, ${company.company_longitude}`
                      : "ยังไม่ได้กำหนด"}
                  </p>
                </>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  <input
                    type="text"
                    placeholder="ชื่อผู้ติดต่อ"
                    value={editForm.contact_information ?? ""}
                    onChange={(e) =>
                      handleFieldChange("contact_information", e.target.value)
                    }
                    style={{
                      padding: "0.4rem",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                  />
                  <textarea
                    placeholder="ที่อยู่บริษัท"
                    value={editForm.full_address ?? ""}
                    onChange={(e) =>
                      handleFieldChange("full_address", e.target.value)
                    }
                    style={{
                      padding: "0.4rem",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      minHeight: "60px",
                      fontFamily: "inherit",
                      resize: "vertical",
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          fontSize: "0.8rem",
                          color: "#666",
                          fontWeight: "bold",
                        }}
                      >
                        ละติจูด (Latitude)
                      </label>
                      <input
                        type="number"
                        placeholder="เช่น 13.7563"
                        value={editForm.company_latitude ?? ""}
                        onChange={(e) =>
                          handleFieldChange("company_latitude", e.target.value)
                        }
                        style={{
                          width: "100%",
                          padding: "0.4rem",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          fontSize: "0.8rem",
                          color: "#666",
                          fontWeight: "bold",
                        }}
                      >
                        ลองจิจูด (Longitude)
                      </label>
                      <input
                        type="number"
                        placeholder="เช่น 100.5018"
                        value={editForm.company_longitude ?? ""}
                        onChange={(e) =>
                          handleFieldChange("company_longitude", e.target.value)
                        }
                        style={{
                          width: "100%",
                          padding: "0.4rem",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                        }}
                      />
                    </div>
                  </div>
                  <p
                    style={{ fontSize: "0.75rem", color: "#1d9bf0", margin: 0 }}
                  >
                    *สามารถแก้ตัวเลขด้านบน หรือคลิก/ลากหมุดบนแผนที่ด้านล่างได้
                  </p>

                  <ProvinceSelect
                    value={editForm.province ?? ""}
                    onChange={(val) => handleFieldChange("province", val)}
                  />
                  <input
                    type="text"
                    placeholder="เบอร์โทรศัพท์"
                    value={editForm.mobile_phone ?? ""}
                    onChange={(e) =>
                      handleFieldChange("mobile_phone", e.target.value)
                    }
                    style={{
                      padding: "0.4rem",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                  />
                  <p style={{ margin: 0, color: "#888" }}>
                    Email: {fmt(company.company_email)} (ไม่สามารถแก้ไขได้)
                  </p>
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: "1.25rem",
                paddingTop: "1rem",
                borderTop: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              {!editMode ? (
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
                  Edit Profile
                </button>
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
                    {saving ? "Saving..." : "Save"}
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
                    Cancel
                  </button>
                </div>
              )}
            </div>
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
      </div>

      {/* ฝั่งขวา: ตำแหน่งงานและรีวิว */}
      <div className={styles.rightSection}>
        <div
          className={styles.VerifiedConfirm}
          style={{
            height: "auto",
            padding: "16px 20px",
            backgroundColor: "#fff",
            borderRadius: "16px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <h3 style={{ margin: 0 }}>Company Registration Certificate</h3>
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "#fff",
                backgroundColor: statusColor,
                borderRadius: "999px",
                padding: "4px 12px",
              }}
            >
              {statusLabel}
            </span>
          </div>

          {isRejected && company.verification_comment && (
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#b50000" }}>
              เหตุผลที่ถูกปฏิเสธ: {company.verification_comment}
            </p>
          )}

          <div>
            {company.dbd_file ? (
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                style={{
                  fontSize: "0.85rem",
                  color: "#1d9bf0",
                  textDecoration: "underline",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                📄 ดูไฟล์ที่อัปโหลดล่าสุด
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
              Add company incorporation documents or registration certificate
              for verification
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
                  ? `📄 Selected: ${selectedCertFile.name}`
                  : "Drag and drop files here, or click to select files. (PDF, JPG, PNG, DOCX)"}
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
                {uploadingCert ? "Sending..." : "Send"}
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
                    company.logo_image || "/assets/images/suggestedCompanys.jpg"
                  }
                  width={80}
                  height={80}
                  alt="Job Logo"
                />
                <div>
                  <h2>{fmt(job.job_position)}</h2>
                  <p>
                    <strong>Details:</strong> {fmt(job.job_description)}
                  </p>
                  <p>
                    <strong>Salary:</strong> THB {fmt(job.salary_min)} -{" "}
                    {fmt(job.salary_max)} / month
                  </p>
                  <Link href={`/company/detail/${job.post_id}`}>
                    <button className={styles.detailBtn}>Detail</button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;
