"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "./seekerProfile.module.css";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "@/lib/firebase";
import ProvinceSelect from "./province";
import LevelSelect from "./levelSelect";

const SeekerProfile = () => {
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  // สถานะ loading เฉพาะตอนกดปุ่มเปิด/ปิดการมองเห็นโปรไฟล์
  const [togglingVisibility, setTogglingVisibility] = useState(false);

  // สร้าง Array ปี (ปีปัจจุบัน + 5 ย้อนหลังไป 50 ปี)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from(
    { length: 50 },
    (_, idx) => currentYear - idx + 5,
  );

  // อ้างอิงอินพุตไฟล์ของรูปอวาตาร์
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // สถานะควบคุมไฟล์และ Popup
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(
    null,
  );
  const [activePreviewFile, setActivePreviewFile] = useState<{
    path: string;
    name: string;
  } | null>(null);

  // อ้างอิง Input File ตามหมวดหมู่
  const fileInputRefs = {
    transcript: useRef<HTMLInputElement>(null),
    resume: useRef<HTMLInputElement>(null),
    portfolio: useRef<HTMLInputElement>(null),
    certificate: useRef<HTMLInputElement>(null),
  };

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

  const fetchUserProfile = async (userId: string) => {
    try {
      const res = await fetch(`/api/user/getUserById/${userId}`);
      const data = await res.json();
      if (res.ok) {
        setProfile(data.user);
        setEditForm(JSON.parse(JSON.stringify(data.user)));
      } else {
        setError(data.error || "Failed to fetch profile");
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
    if (sessionUser?.id) fetchUserProfile(sessionUser.id);
  }, [sessionUser?.id]);

  // ─── อัปโหลดรูปอวาตาร์ ───
  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !sessionUser?.id) return;

    try {
      setSaving(true);
      // 1. อัปโหลดรูปภาพไปยัง Firebase Storage
      const filePath = `user_avatars/${sessionUser.id}_${Date.now()}_${file.name}`;
      const storageRef = ref(storage, filePath);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // 2. ยิง API บันทึก URL รูปภาพใหม่ลงในฐานข้อมูลทันที
      const res = await fetch(`/api/user/updateProfile/${sessionUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile, // ส่งข้อมูลเดิมไปด้วยป้องกันตารางอื่นหลุด
          profile_image: downloadURL, // เปลี่ยนเฉพาะ URL รูปโปรไฟล์
        }),
      });

      if (res.ok) {
        // 3. อัปเดตสถานะ (State) บนหน้าจอทันทีเพื่อให้รูปภาพเปลี่ยนตาม
        setProfile((prev: any) => ({ ...prev, profile_image: downloadURL }));
        setEditForm((prev: any) => ({ ...prev, profile_image: downloadURL }));
        alert("เปลี่ยนรูปโปรไฟล์เรียบร้อยแล้ว! 📷✨");
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึกรูปภาพลงระบบ");
      }
    } catch (err: any) {
      alert(`อัปโหลดล้มเหลว: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ─── อัปโหลดเอกสารอิสระทันที ───
  const onInstantFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    category: string,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !sessionUser?.id) return;
    event.target.value = "";

    try {
      setUploadingCategory(category);
      const filePath = `user_documents/${sessionUser.id}/${category.toLowerCase()}_${Date.now()}_${file.name}`;
      const storageRef = ref(storage, filePath);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      const res = await fetch("/api/user/saveFileRecord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: parseInt(sessionUser.id),
          file_path: downloadURL,
          file_name: file.name,
          file_type: file.type,
          file_category: category,
        }),
      });

      if (res.ok) {
        fetchUserProfile(sessionUser.id);
      } else {
        const errData = await res.json();
        alert(`เกิดข้อผิดพลาดคลังข้อมูล: ${errData.error}`);
      }
    } catch (err: any) {
      alert(`อัปโหลดล้มเหลว: ${err.message}`);
    } finally {
      setUploadingCategory(null);
    }
  };

  // ─── ลบเอกสารอิสระทันที ───
  const onInstantFileDelete = async (fileId: number, filePath: string) => {
    if (!confirm("คุณมั่นใจใช่ไหมที่จะลบไฟล์นี้ออกจากระบบอย่างถาวร? ❌"))
      return;
    try {
      try {
        const storageRef = ref(storage, filePath);
        await deleteObject(storageRef);
      } catch (e) {
        console.warn("ลบไฟล์คลาวด์ไม่ได้", e);
      }

      const res = await fetch(`/api/user/deleteFileRecord?file_id=${fileId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchUserProfile(sessionUser.id);
      } else {
        alert("ไม่สามารถลบแถวข้อมูลได้");
      }
    } catch (err: any) {
      alert(`การลบล้มเหลว: ${err.message}`);
    }
  };

  const getFilesByCategory = (category: string) => {
    if (!profile?.files || !Array.isArray(profile.files)) return [];
    return profile.files.filter(
      (f: any) => f.file_category?.toLowerCase() === category.toLowerCase(),
    );
  };

  // ─── บันทึกข้อมูลส่วนตัว (ฟอร์มหลัก) ───
  const handleSaveChanges = async () => {
    if (!sessionUser?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/user/updateProfile/${sessionUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        setProfile(JSON.parse(JSON.stringify(editForm)));
        setEditMode(false);
        alert("บันทึกการเปลี่ยนแปลงโปรไฟล์เรียบร้อยแล้ว!");
        window.location.reload();
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

  // ─── เปิด/ปิดการมองเห็นโปรไฟล์ (ยิง API ทันที ไม่ต้องกด Save) ───
  const handleToggleVisibility = async () => {
    if (!sessionUser?.id || !profile) return;
    const newValue = profile.is_visible === 1 ? 0 : 1;

    try {
      setTogglingVisibility(true);
      const res = await fetch(`/api/user/toggleVisibility/${sessionUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_visible: newValue }),
      });

      if (res.ok) {
        setProfile((prev: any) => ({ ...prev, is_visible: newValue }));
        setEditForm((prev: any) => ({ ...prev, is_visible: newValue }));
      } else {
        const data = await res.json();
        alert(data.error || "ไม่สามารถเปลี่ยนสถานะการมองเห็นได้");
      }
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setTogglingVisibility(false);
    }
  };

  const handleFieldChange = (field: string, value: any) =>
    setEditForm((prev: any) => ({ ...prev, [field]: value }));
  const handleArrayFieldChange = (
    arrayName: string,
    index: number,
    field: string,
    value: any,
  ) => {
    setEditForm((prev: any) => {
      const updated = [...(prev[arrayName] || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, [arrayName]: updated };
    });
  };
  const addArrayItem = (arrayName: string, defaultObj: any) =>
    setEditForm((prev: any) => ({
      ...prev,
      [arrayName]: [...(prev[arrayName] || []), defaultObj],
    }));
  const removeArrayItem = (arrayName: string, index: number) =>
    setEditForm((prev: any) => ({
      ...prev,
      [arrayName]: (prev[arrayName] || []).filter(
        (_: any, i: number) => i !== index,
      ),
    }));

  const handleToggleTypeOfWork = (type: string) => {
    const currentTypes = editForm.type_of_work
      ? editForm.type_of_work
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];
    let newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t: string) => t !== type)
      : [...currentTypes, type];
    handleFieldChange("type_of_work", newTypes.join(", "));
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!profile || !editForm) return <p>No user data</p>;

  const fmt = (val: any) =>
    val !== null && val !== undefined ? String(val) : "-";
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };
  const typeOfWorkList = (
    editMode ? editForm.type_of_work : profile.type_of_work
  )
    ? (editMode ? editForm.type_of_work : profile.type_of_work)
        .split(",")
        .map((s: string) => s.trim())
    : [];

  return (
    <div className={styles.container}>
      <div className={styles.profileGrid}>
        {/* ── Column 1: Personal Info ── */}
        <div className={styles.column}>
          <div
            className={styles.cardHeader}
            style={{
              position: "relative",
            }}
          >
            Personal Information
            {/* ── ปุ่มเปิด/ปิดการมองเห็นโปรไฟล์ (คลิกแล้วยิง API ทันที) ── */}
            <button
              type="button"
              onClick={handleToggleVisibility}
              disabled={togglingVisibility}
              title={
                profile.is_visible === 1
                  ? "โปรไฟล์กำลังเปิดให้มองเห็น (คลิกเพื่อซ่อน)"
                  : "โปรไฟล์ถูกซ่อนอยู่ (คลิกเพื่อเปิดให้มองเห็น)"
              }
              style={{
                position: "absolute",
                top: "20px",
                left: "20px",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: "none",
                cursor: togglingVisibility ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor:
                  profile.is_visible === 1 ? "#28a745" : "#888888",
                color: "#fff",
                opacity: togglingVisibility ? 0.6 : 1,
                transition: "background-color 0.2s ease",
              }}
            >
              {profile.is_visible === 1 ? (
                // ตาเปิด (มองเห็นได้)
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              ) : (
                // ตาปิด (ถูกซ่อน)
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              )}
            </button>
          </div>

          <div className={styles.personalInfoContent}>
            <div
              className={styles.avatarWrapper}
              onClick={() => avatarInputRef.current?.click()} // คลิกตรงไหนในกล่องก็เปิดหน้าต่างเลือกไฟล์
              style={{ position: "relative", cursor: "pointer" }}
            >
              {/* ตัวซ่อน Input File ดั้งเดิมเอาไว้ */}
              <input
                type="file"
                accept="image/*"
                ref={avatarInputRef}
                onChange={handleAvatarChange}
                style={{ display: "none" }}
              />

              {/* แสดงรูปโปรไฟล์ปัจจุบัน */}
              <img
                src={
                  editMode
                    ? (editForm.profile_image ?? "/assets/images/seeker.jpg")
                    : (profile.profile_image ?? "/assets/images/seeker.jpg")
                }
                className={styles.avatar}
                alt="avatar"
                style={{ width: "100%", height: "100%", display: "block" }}
              />

              {/* ตัวครอบเอฟเฟกต์ Overlay ปรากฏขึ้นเมื่อนำเมาส์มา Hover รูปภาพ */}
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

            {!editMode ? (
              <>
                <h2 className={styles.name} style={{ marginTop: "1rem" }}>
                  {fmt(profile.fullname)}
                </h2>
                <p className={styles.email}>{fmt(profile.email)}</p>
              </>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  margin: "1.5rem 0",
                }}
              >
                <input
                  type="text"
                  placeholder="Full Name"
                  value={editForm.fullname ?? ""}
                  onChange={(e) =>
                    handleFieldChange("fullname", e.target.value)
                  }
                  style={{
                    padding: "0.4rem",
                    borderRadius: "4px",
                    border: "1px solid #000000",
                  }}
                />
                <p className={styles.email}>{fmt(profile.email)}</p>
              </div>
            )}

            <div className={styles.detailsBox}>
              <div className={styles.titleinfoRow}>
                <strong>About</strong>
              </div>
              {[
                {
                  label: "Gender",
                  field: "gender",
                  type: "select",
                  options: ["Male", "Female", "Other"],
                },
                {
                  label: "Military Status",
                  field: "military_status",
                  type: "select",
                  options: ["Exempted", "Served", "None"],
                },
                {
                  label: "Date of Birth",
                  field: "date_of_birth",
                  type: "date",
                },
                { label: "Nationality", field: "nationality", type: "text" },
                { label: "Religion", field: "religion", type: "text" },
                { label: "Weight (Kg)", field: "weight", type: "number" },
                { label: "Height (Cm)", field: "height", type: "number" },
                {
                  label: "Disability",
                  field: "disability_status",
                  type: "text",
                },
                {
                  label: "Marital",
                  field: "marital_status",
                  type: "select",
                  options: ["Single", "Married", "Divorced"],
                },
                { label: "Mobile", field: "mobile_phone", type: "text" },
              ].map((item) => (
                <div className={styles.infoRow} key={item.field}>
                  {item.label}:{" "}
                  {!editMode ? (
                    item.field === "date_of_birth" ? (
                      formatDate(profile[item.field])
                    ) : (
                      fmt(profile[item.field])
                    )
                  ) : item.type === "select" ? (
                    <select
                      value={editForm[item.field] ?? ""}
                      onChange={(e) =>
                        handleFieldChange(item.field, e.target.value)
                      }
                      style={{
                        minWidth: "120px",
                        padding: "0.3rem",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                      }}
                    >
                      <option value="">-- เลือก --</option>
                      {item.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={item.type}
                      value={
                        item.field === "date_of_birth" && editForm[item.field]
                          ? editForm[item.field].substring(0, 10)
                          : (editForm[item.field] ?? "")
                      }
                      onChange={(e) =>
                        handleFieldChange(item.field, e.target.value)
                      }
                      style={{
                        minWidth: "120px",
                        padding: "0.3rem",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                      }}
                    />
                  )}
                </div>
              ))}

              <div className={styles.titleinfoRow}>
                <br />
                <strong>Contact</strong>
              </div>
              <div className={styles.infoRow}>
                Line ID:{" "}
                {!editMode ? (
                  fmt(profile.line_id)
                ) : (
                  <input
                    style={{
                      minWidth: "120px",
                      padding: "0.3rem",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                    type="text"
                    value={editForm.line_id ?? ""}
                    onChange={(e) =>
                      handleFieldChange("line_id", e.target.value)
                    }
                  />
                )}
              </div>

              <div className={styles.infoRow}>
                Country:{" "}
                {!editMode ? (
                  fmt(profile.country)
                ) : (
                  <input
                    style={{
                      minWidth: "120px",
                      padding: "0.3rem",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                    type="text"
                    value={editForm.country ?? ""}
                    onChange={(e) =>
                      handleFieldChange("country", e.target.value)
                    }
                  />
                )}
              </div>

              {/* เอา address กับ postal_code ออกตามที่คอมเมนต์ไว้ในลูปเดิม */}

              <div className={styles.infoRow}>
                Province:{" "}
                {!editMode ? (
                  fmt(profile.province)
                ) : (
                  // <input
                  //   style={{
                  //     minWidth: "120px",
                  //     padding: "0.3rem",
                  //     borderRadius: "4px",
                  //     border: "1px solid #ccc",
                  //   }}
                  //   type="text"
                  //   value={editForm.province ?? ""}
                  //   onChange={(e) =>
                  //     handleFieldChange("province", e.target.value)
                  //   }
                  // />
                  <ProvinceSelect
                    value={editForm.province ?? ""}
                    onChange={(value: string) => {
                      handleFieldChange("province", value);
                    }}
                  />
                )}
              </div>

              <div className={styles.infoRow}>
                District:{" "}
                {!editMode ? (
                  fmt(profile.district)
                ) : (
                  <input
                    style={{
                      minWidth: "120px",
                      padding: "0.3rem",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                    type="text"
                    value={editForm.district ?? ""}
                    onChange={(e) =>
                      handleFieldChange("district", e.target.value)
                    }
                  />
                )}
              </div>

              <div className={styles.infoRow}>
                Sub District:{" "}
                {!editMode ? (
                  fmt(profile.sub_district)
                ) : (
                  <input
                    style={{
                      minWidth: "120px",
                      padding: "0.3rem",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                    type="text"
                    value={editForm.sub_district ?? ""}
                    onChange={(e) =>
                      handleFieldChange("sub_district", e.target.value)
                    }
                  />
                )}
              </div>
            </div>

            {/* ── ปุ่ม Edit Profile / Save+Cancel (ย้ายมาไว้ด้านล่างสุดของคอลัมน์ Personal Information) ── */}
            <div
              style={{
                marginTop: "1.5rem",
                paddingTop: "1.25rem",
                borderTop: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              {!editMode ? (
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "11px 18px",
                    backgroundColor: "#111111",
                    color: "#ffffff",
                    borderRadius: "999px",
                    border: "none",
                    fontSize: "0.92rem",
                    fontWeight: 600,
                    letterSpacing: "0.01em",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
                    transition:
                      "transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#2a2a2a";
                    e.currentTarget.style.boxShadow =
                      "0 4px 10px rgba(0,0,0,0.24)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#111111";
                    e.currentTarget.style.boxShadow =
                      "0 2px 6px rgba(0,0,0,0.18)";
                    e.currentTarget.style.transform = "translateY(0)";
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
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Edit Profile
                </button>
              ) : (
                <div
                  style={{
                    display: "flex",
                    gap: "0.6rem",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleSaveChanges}
                    disabled={saving}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "11px 14px",
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      backgroundColor: saving ? "#5fb37b" : "#28a745",
                      color: "#ffffff",
                      borderRadius: "999px",
                      border: "none",
                      cursor: saving ? "wait" : "pointer",
                      boxShadow: "0 2px 6px rgba(40,167,69,0.35)",
                      transition:
                        "background-color 0.15s ease, transform 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!saving)
                        e.currentTarget.style.backgroundColor = "#239a3b";
                    }}
                    onMouseLeave={(e) => {
                      if (!saving)
                        e.currentTarget.style.backgroundColor = "#28a745";
                    }}
                  >
                    {saving ? (
                      "Saving..."
                    ) : (
                      <>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Save
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setEditForm(JSON.parse(JSON.stringify(profile)));
                    }}
                    disabled={saving}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "11px 14px",
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      backgroundColor: "#ffffff",
                      color: "#dc3545",
                      borderRadius: "999px",
                      border: "1.5px solid #dc3545",
                      cursor: "pointer",
                      transition:
                        "background-color 0.15s ease, color 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#dc3545";
                      e.currentTarget.style.color = "#ffffff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#ffffff";
                      e.currentTarget.style.color = "#dc3545";
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Column 2: Job Preferences ── */}
        <div className={styles.column}>
          <div className={styles.cardHeader}>Job Preferences</div>
          <div className={styles.contentPadding}>
            <section className={styles.section}>
              <h4>Job Title</h4>
              {!editMode ? (
                <ol className="list-decimal list-inside">
                  {profile.job_titles?.map((job: any, i: number) => (
                    <li key={i}>{fmt(job.job_name)}</li>
                  ))}
                </ol>
              ) : (
                <div>
                  {(editForm.job_titles || []).map((job: any, i: number) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: "0.2rem",
                        marginBottom: "0.3rem",
                      }}
                    >
                      <input
                        style={{
                          flex: 1,
                          padding: "0.3rem",
                          borderRadius: "4px",
                          border: "1px solid #000000",
                        }}
                        type="text"
                        value={job.job_name ?? ""}
                        onChange={(e) =>
                          handleArrayFieldChange(
                            "job_titles",
                            i,
                            "job_name",
                            e.target.value,
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayItem("job_titles", i)}
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                  <button
                    style={{ marginTop: "0.5rem", border: "1px solid #000000" }}
                    type="button"
                    className={styles.tag}
                    onClick={() => addArrayItem("job_titles", { job_name: "" })}
                  >
                    + Add Job
                  </button>
                </div>
              )}
            </section>

            <section className={styles.section}>
              <h4>Type Of Work</h4>
              <div className={styles.tagGroup}>
                {[
                  "Full-time",
                  "Freelance",
                  "Part-time",
                  "Internship",
                  "Contract",
                ].map((t) => (
                  <span
                    key={t}
                    className={
                      typeOfWorkList.includes(t) ? styles.tagActive : styles.tag
                    }
                    onClick={() => editMode && handleToggleTypeOfWork(t)}
                    style={{ cursor: editMode ? "pointer" : "default" }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <h4>Desired salary (baht)</h4>
              {!editMode ? (
                <p>{fmt(profile.desired_salary)} baht</p>
              ) : (
                <input
                  style={{
                    padding: "0.3rem",
                    borderRadius: "4px",
                    border: "1px solid #000000",
                  }}
                  type="number"
                  value={editForm.desired_salary ?? ""}
                  onChange={(e) =>
                    handleFieldChange("desired_salary", e.target.value)
                  }
                />
              )}
            </section>
            <section className={styles.section}>
              <h4 className={styles.section}>Education</h4>
              <section className={styles.Educontainer}>
                <div className={styles.timeline}>
                  {!editMode ? (
                    <div className={styles.centralLine}></div>
                  ) : (
                    <div></div>
                  )}

                  {!editMode ? (
                    profile.educations?.map((item: any, index: number) => (
                      <div
                        key={index}
                        className={`${styles.timelineItem} ${index % 2 === 0 ? styles.left : styles.right}`}
                      >
                        <div className={styles.content}>
                          <p className={styles.level}>{fmt(item.level)}</p>
                          <h4 className={styles.degree}>{fmt(item.major)}</h4>
                          <p className={styles.school}>
                            {fmt(item.institution)}
                          </p>
                          <p style={{ fontSize: "15px" }}>
                            {fmt(item.year_start)} – {fmt(item.year_end)}
                          </p>
                        </div>
                        <div className={styles.connector}></div>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1.5rem",
                        width: "100%",
                        maxWidth: "460px", // ขยายพื้นที่เพิ่มให้ไม่ดูอึดอัด
                        margin: "0 auto",
                      }}
                    >
                      {(editForm.educations || []).map(
                        (item: any, i: number) => (
                          <div
                            key={i}
                            style={{
                              border: "1px solid #ccc",
                              padding: "1.2rem",
                              borderRadius: "8px",
                              backgroundColor: "#ffffff", // เพิ่มพื้นหลังสีขาวเพื่อให้เด่นขึ้นมาจาก Educontainer สีเทา
                              position: "relative",
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.8rem",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                            }}
                          >
                            {/* ปุ่มลบ (ย้ายมาไว้ที่มุมขวาบนของการ์ด) */}
                            <button
                              type="button"
                              onClick={() => removeArrayItem("educations", i)}
                              style={{
                                position: "absolute",
                                top: "12px",
                                right: "12px",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "1.1rem",
                              }}
                            >
                              ❌
                            </button>

                            {/* ระดับการศึกษา */}
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.3rem",
                              }}
                            >
                              <label
                                style={{
                                  fontWeight: "500",
                                  fontSize: "0.9rem",
                                  color: "#333",
                                }}
                              >
                                Level:
                              </label>

                              <LevelSelect
                                value={item.level ?? ""}
                                onChange={(value: string) =>
                                  handleArrayFieldChange(
                                    "educations",
                                    i,
                                    "level",
                                    value,
                                  )
                                }
                              />
                            </div>

                            {/* สาขาวิชา */}
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.3rem",
                              }}
                            >
                              <label
                                style={{
                                  fontWeight: "500",
                                  fontSize: "0.9rem",
                                  color: "#333",
                                }}
                              >
                                Major:
                              </label>
                              <input
                                type="text"
                                placeholder="Major"
                                value={item.major ?? ""}
                                onChange={(e) =>
                                  handleArrayFieldChange(
                                    "educations",
                                    i,
                                    "major",
                                    e.target.value,
                                  )
                                }
                                style={{
                                  padding: "0.5rem",
                                  borderRadius: "4px",
                                  border: "1px solid #ccc",
                                  width: "100%",
                                }}
                              />
                            </div>

                            {/* สถาบันการศึกษา */}
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.3rem",
                              }}
                            >
                              <label
                                style={{
                                  fontWeight: "500",
                                  fontSize: "0.9rem",
                                  color: "#333",
                                }}
                              >
                                Institution:
                              </label>
                              <input
                                type="text"
                                placeholder="School / University"
                                value={item.institution ?? ""}
                                onChange={(e) =>
                                  handleArrayFieldChange(
                                    "educations",
                                    i,
                                    "institution",
                                    e.target.value,
                                  )
                                }
                                style={{
                                  padding: "0.5rem",
                                  borderRadius: "4px",
                                  border: "1px solid #ccc",
                                  width: "100%",
                                }}
                              />
                            </div>

                            {/* กลุ่มของปี (แบ่งครึ่งซ้าย-ขวาอย่างสมดุล) */}
                            <div style={{ display: "flex", gap: "1rem" }}>
                              {/* ปีที่เริ่ม */}
                              <div
                                style={{
                                  flex: 1,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "0.3rem",
                                }}
                              >
                                <label
                                  style={{
                                    fontWeight: "500",
                                    fontSize: "0.9rem",
                                    color: "#000000",
                                  }}
                                >
                                  Year Start:
                                </label>
                                <select
                                  value={item.year_start ?? ""}
                                  onChange={(e) =>
                                    handleArrayFieldChange(
                                      "educations",
                                      i,
                                      "year_start",
                                      e.target.value,
                                    )
                                  }
                                  style={{
                                    padding: "0.5rem",
                                    borderRadius: "4px",
                                    border: "1px solid #ccc",
                                    width: "100%",
                                    backgroundColor: "#fff",
                                  }}
                                >
                                  <option value="">year start</option>
                                  {yearOptions.map((year) => (
                                    <option key={`start-${year}`} value={year}>
                                      {year}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* ปีที่จบ */}
                              <div
                                style={{
                                  flex: 1,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "0.3rem",
                                }}
                              >
                                <label
                                  style={{
                                    fontWeight: "500",
                                    fontSize: "0.9rem",
                                    color: "#020202",
                                  }}
                                >
                                  Year End:
                                </label>
                                <select
                                  value={item.year_end ?? ""}
                                  onChange={(e) =>
                                    handleArrayFieldChange(
                                      "educations",
                                      i,
                                      "year_end",
                                      e.target.value,
                                    )
                                  }
                                  style={{
                                    padding: "0.5rem",
                                    borderRadius: "4px",
                                    border: "1px solid #ccc",
                                    width: "100%",
                                    backgroundColor: "#fff",
                                  }}
                                >
                                  <option value="">year end</option>
                                  <option value="Present">Present</option>
                                  {yearOptions.map((year) => (
                                    <option key={`end-${year}`} value={year}>
                                      {year}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        ),
                      )}

                      {/* ปุ่มกดเพิ่มประวัติการศึกษา (ถ้าต้องการใช้ต่อ) */}
                      <button
                        type="button"
                        className={styles.tag}
                        onClick={() =>
                          addArrayItem("educations", {
                            level: "",
                            major: "",
                            institution: "",
                            faculty: "",
                            year_start: "",
                            year_end: "",
                          })
                        }
                        style={{
                          alignSelf: "flex-start",
                          marginTop: "0.5rem",
                          border: "1px solid #000000",
                        }}
                      >
                        + เพิ่มประวัติการศึกษา
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </section>
          </div>
        </div>

        {/* ── Column 3: Skills ── */}
        <div className={styles.column}>
          <div className={styles.cardHeader}>Skills</div>
          <div className={styles.contentPadding}>
            <section className={styles.section}>
              <h4>Specific skills</h4>
              {!editMode ? (
                <ol className="list-decimal list-inside">
                  {profile.skills?.map((s: any, i: number) => (
                    <li key={i}>{fmt(s.skill_name)}</li>
                  ))}
                </ol>
              ) : (
                <div>
                  {(editForm.skills || []).map((s: any, i: number) => (
                    <div
                      key={i}
                      style={{
                        borderBottom: "1px solid #eee",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <input
                        style={{
                          width: "80%",
                          padding: "0.3rem",
                          borderRadius: "4px",
                          border: "1px solid #000000",
                        }}
                        type="text"
                        value={s.skill_name ?? ""}
                        onChange={(e) =>
                          handleArrayFieldChange(
                            "skills",
                            i,
                            "skill_name",
                            e.target.value,
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayItem("skills", i)}
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                  <button
                    style={{ border: "1px solid #000000" }}
                    type="button"
                    className={styles.tag}
                    onClick={() =>
                      addArrayItem("skills", {
                        skill_name: "",
                        skill_category: "General",
                        skill_detail: "",
                      })
                    }
                  >
                    + Add Skill
                  </button>
                </div>
              )}
            </section>
            <section className={styles.section}>
              <h4>Typing Speed:</h4>
              {!editMode ? (
                profile.typing_speeds?.map((t: any, i: number) => (
                  <ul key={i} style={{ marginBottom: "1rem" }}>
                    <li>
                      <h4>{fmt(t.typing_language)}</h4>
                    </li>
                    <li>- {fmt(t.typing_wpm)} WPM</li>
                  </ul>
                ))
              ) : (
                <div>
                  {(editForm.typing_speeds || []).map((t: any, i: number) => (
                    <div key={i} style={{ display: "flex", gap: "0.5rem" }}>
                      <input
                        style={{
                          flex: 1,
                          padding: "0.3rem",
                          borderRadius: "4px",
                          border: "1px solid #000000",
                          width: "10px",
                        }}
                        type="text"
                        value={t.typing_language ?? ""}
                        onChange={(e) =>
                          handleArrayFieldChange(
                            "typing_speeds",
                            i,
                            "typing_language",
                            e.target.value,
                          )
                        }
                      />
                      <input
                        style={{
                          width: "100px",
                          padding: "0.3rem",
                          borderRadius: "4px",
                          border: "1px solid #000000",
                        }}
                        type="number"
                        value={t.typing_wpm ?? ""}
                        onChange={(e) =>
                          handleArrayFieldChange(
                            "typing_speeds",
                            i,
                            "typing_wpm",
                            e.target.value,
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayItem("typing_speeds", i)}
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                  <button
                    style={{ marginTop: "0.5rem", border: "1px solid #000000" }}
                    type="button"
                    className={styles.tag}
                    onClick={() =>
                      addArrayItem("typing_speeds", {
                        typing_language: "",
                        typing_wpm: "",
                      })
                    }
                  >
                    + Add Typing
                  </button>
                </div>
              )}
            </section>
            <section className={styles.section}>
              <h4>Projects & Experiences</h4>
              {!editMode ? (
                profile.experiences?.map((exp: any, i: number) => (
                  <ul key={i} style={{ marginBottom: "1rem" }}>
                    <li>
                      - <strong>{fmt(exp.ex_title)}</strong>
                    </li>
                    <li className={styles.setLi}>{fmt(exp.ex_description)}</li>
                    <li className={styles.setLi}>
                      {formatDate(exp.start_date)} – {formatDate(exp.end_date)}
                    </li>
                  </ul>
                ))
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.5rem",
                    width: "100%",
                    maxWidth: "460px",
                    margin: "0 auto",
                  }}
                >
                  {(editForm.experiences || []).map((exp: any, i: number) => (
                    <div
                      key={i}
                      style={{
                        border: "1px solid #ccc",
                        padding: "1.2rem",
                        borderRadius: "8px",
                        backgroundColor: "#ffffff", // พื้นหลังขาวตัดกับพื้นเทา
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.8rem",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                      }}
                    >
                      {/* ปุ่มลบอยู่ที่มุมขวาบนของการ์ด */}
                      <button
                        type="button"
                        onClick={() => removeArrayItem("experiences", i)}
                        style={{
                          position: "absolute",
                          top: "12px",
                          right: "12px",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "1.1rem",
                        }}
                      >
                        ❌
                      </button>

                      {/* ชื่อโครงการ / ประสบการณ์ */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.3rem",
                        }}
                      >
                        <label
                          style={{
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            color: "#333",
                          }}
                        >
                          Experience Title:
                        </label>
                        <input
                          type="text"
                          placeholder="Title (e.g., Senior Developer)"
                          value={exp.ex_title ?? ""}
                          onChange={(e) =>
                            handleArrayFieldChange(
                              "experiences",
                              i,
                              "ex_title",
                              e.target.value,
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "0.5rem",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                          }}
                        />
                      </div>

                      {/* รายละเอียดโครงการ / ประสบการณ์ */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.3rem",
                        }}
                      >
                        <label
                          style={{
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            color: "#333",
                          }}
                        >
                          Experience Description:
                        </label>
                        <textarea
                          placeholder="Description of your responsibilities or achievements"
                          value={exp.ex_description ?? ""}
                          onChange={(e) =>
                            handleArrayFieldChange(
                              "experiences",
                              i,
                              "ex_description",
                              e.target.value,
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "0.5rem",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                            minHeight: "80px",
                            fontFamily: "inherit",
                            resize: "vertical",
                          }}
                        />
                      </div>

                      {/* วันที่เริ่มงาน */}
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.3rem",
                        }}
                      >
                        <label
                          style={{
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            color: "#333",
                          }}
                        >
                          Start Date:
                        </label>
                        <input
                          type="date"
                          value={
                            exp.start_date
                              ? new Date(exp.start_date)
                                  .toISOString()
                                  .substring(0, 10)
                              : ""
                          }
                          onChange={(e) =>
                            handleArrayFieldChange(
                              "experiences",
                              i,
                              "start_date",
                              e.target.value,
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "0.5rem",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                            backgroundColor: "#fff",
                          }}
                        />
                      </div>
                      {/* วันที่สิ้นสุดงาน */}
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.3rem",
                        }}
                      >
                        <label
                          style={{
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            color: "#333",
                          }}
                        >
                          End Date:
                        </label>
                        <input
                          type="date"
                          value={
                            exp.end_date
                              ? new Date(exp.end_date)
                                  .toISOString()
                                  .substring(0, 10)
                              : ""
                          }
                          onChange={(e) =>
                            handleArrayFieldChange(
                              "experiences",
                              i,
                              "end_date",
                              e.target.value,
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "0.5rem",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                            backgroundColor: "#fff",
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  {/* ปุ่มสำหรับกดเพิ่มประวัติโครงการ/ประสบการณ์ใหม่ */}
                  <button
                    type="button"
                    className={styles.tag}
                    onClick={() =>
                      addArrayItem("experiences", {
                        ex_title: "",
                        ex_description: "",
                        type: "",
                        start_date: null,
                        end_date: null,
                      })
                    }
                    style={{
                      alignSelf: "flex-start",
                      marginTop: "0.5rem",
                      border: "1px solid #000000",
                    }}
                  >
                    + Add Exp
                  </button>
                </div>
              )}
            </section>

            <section className={styles.section}>
              <h4>Language Proficiency</h4>
              {!editMode ? (
                profile.languages?.map((lang: any, i: number) => (
                  <ul key={i} style={{ marginBottom: "1rem" }}>
                    <li>
                      <h4>{fmt(lang.language_type)}</h4>
                    </li>
                    <li>- {fmt(lang.level)}</li>
                    {(lang.test_name || lang.score) && (
                      <li>
                        - {fmt(lang.test_name)}
                        {lang.score ? `: ${fmt(lang.score)}` : ""}
                      </li>
                    )}
                  </ul>
                ))
              ) : (
                <div>
                  {(editForm.languages || []).map((lang: any, i: number) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                        alignItems: "center",
                        borderBottom: "1px solid #eee",
                        paddingBottom: "0.5rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <input
                        style={{
                          flex: "1 1 120px",
                          padding: "0.3rem",
                          borderRadius: "4px",
                          border: "1px solid #000000",
                        }}
                        type="text"
                        placeholder="Language (e.g., English)"
                        value={lang.language_type ?? ""}
                        onChange={(e) =>
                          handleArrayFieldChange(
                            "languages",
                            i,
                            "language_type",
                            e.target.value,
                          )
                        }
                      />
                      <input
                        style={{
                          flex: "1 1 100px",
                          padding: "0.3rem",
                          borderRadius: "4px",
                          border: "1px solid #000000",
                        }}
                        type="text"
                        placeholder="Level (e.g., Advanced)"
                        value={lang.level ?? ""}
                        onChange={(e) =>
                          handleArrayFieldChange(
                            "languages",
                            i,
                            "level",
                            e.target.value,
                          )
                        }
                      />
                      <input
                        style={{
                          flex: "1 1 100px",
                          padding: "0.3rem",
                          borderRadius: "4px",
                          border: "1px solid #000000",
                        }}
                        type="text"
                        placeholder="Test (e.g., TOEIC)"
                        value={lang.test_name ?? ""}
                        onChange={(e) =>
                          handleArrayFieldChange(
                            "languages",
                            i,
                            "test_name",
                            e.target.value,
                          )
                        }
                      />
                      <input
                        style={{
                          flex: "0 1 80px",
                          padding: "0.3rem",
                          borderRadius: "4px",
                          border: "1px solid #000000",
                        }}
                        type="number"
                        step="any"
                        placeholder="Score"
                        value={lang.score ?? ""}
                        onChange={(e) =>
                          handleArrayFieldChange(
                            "languages",
                            i,
                            "score",
                            e.target.value,
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayItem("languages", i)}
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                  <button
                    style={{ marginTop: "0.5rem", border: "1px solid #000000" }}
                    type="button"
                    className={styles.tag}
                    onClick={() =>
                      addArrayItem("languages", {
                        language_type: "",
                        level: "",
                        test_name: "",
                        score: "",
                      })
                    }
                  >
                    + Add Language
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* ── Column 4: Files (อัปโหลดอิสระ ไม่สน EditMode) ── */}
        <div className={styles.columnTransparent}>
          <div className={styles.fileGroup}>
            {[
              { id: "transcript", label: "transcript" },
              { id: "resume", label: "resume" },
              { id: "portfolio", label: "portfolio" },
              { id: "certificate", label: "certificate" },
            ].map((cat) => {
              const currentFiles = getFilesByCategory(cat.id);
              const isUploading = uploadingCategory === cat.id;

              return (
                <div key={cat.id} className={styles.fileItem}>
                  <label
                    style={{ textTransform: "lowercase", marginBottom: "10px" }}
                  >
                    {cat.label} ({currentFiles.length})
                  </label>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    {currentFiles.map((file: any) => {
                      const shortName =
                        file.file_name?.length > 15
                          ? file.file_name.substring(0, 13) + "..."
                          : file.file_name || "File";
                      return (
                        <div
                          key={file.file_id}
                          className={styles.fileContainerBox}
                        >
                          <div
                            className={styles.fileNameDisplay}
                            title={file.file_name}
                          >
                            📄 {shortName}
                            <span
                              className={styles.deleteFileIcon}
                              onClick={() =>
                                onInstantFileDelete(
                                  file.file_id,
                                  file.file_path,
                                )
                              }
                            >
                              ❌
                            </span>
                          </div>
                          <div
                            className={styles.fileBox}
                            onClick={() =>
                              setActivePreviewFile({
                                path: file.file_path,
                                name: file.file_name,
                              })
                            }
                          >
                            view file
                          </div>
                        </div>
                      );
                    })}

                    <div style={{ width: "100%", marginTop: "5px" }}>
                      <input
                        type="file"
                        ref={
                          fileInputRefs[cat.id as keyof typeof fileInputRefs]
                        }
                        onChange={(e) => onInstantFileUpload(e, cat.id)}
                        className={styles.hiddenInput}
                      />
                      <button
                        type="button"
                        className={styles.addFileInlineBtn}
                        onClick={() =>
                          fileInputRefs[
                            cat.id as keyof typeof fileInputRefs
                          ].current?.click()
                        }
                        disabled={uploadingCategory !== null}
                      >
                        {isUploading ? "uploading..." : "+ add file"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── POPUP MODAL พรีวิวไฟล์ ─── */}
      {activePreviewFile && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                Preview: {activePreviewFile.name}
              </span>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setActivePreviewFile(null)}
              >
                ปิดหน้าต่าง ✖
              </button>
            </div>
            <div className={styles.modalBody}>
              {activePreviewFile.path.toLowerCase().includes(".pdf") ||
              (activePreviewFile.path.includes("alt=media") == false &&
                activePreviewFile.path.toLowerCase().endsWith(".pdf")) ? (
                <iframe
                  src={activePreviewFile.path}
                  className={styles.modalIframe}
                  title="PDF View"
                />
              ) : (
                <img
                  src={activePreviewFile.path}
                  className={styles.modalImg}
                  alt="Preview"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                    const iframe = document.createElement("iframe");
                    iframe.src = activePreviewFile.path;
                    iframe.className = styles.modalIframe;
                    (e.target as HTMLElement).parentElement?.appendChild(
                      iframe,
                    );
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeekerProfile;
