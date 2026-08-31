"use client";
import React, { useEffect, useState } from "react";
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
import CountrySelect from "./CountrySelect";

/* ================= 1) Type ที่ใช้ในหน้าจอ ================= */

interface JobTitle {
  job_id?: number;
  job_name: string;
}

interface Skill {
  skill_id?: number;
  skill_name: string;
  skill_category: string;
  skill_detail: string;
}

interface Typing {
  typing_id?: number;
  typing_language: string;
  typing_wpm: string;
}

interface Education {
  education_id?: number;
  level: string;
  major: string;
  institution: string;
  faculty: string;
  year_start: string;
  year_end: string;
}

interface Experience {
  ex_id?: number;
  ex_title: string;
  ex_description: string;
  type: string;
  start_date: string;
  end_date: string;
}

interface Language {
  language_id?: number;
  language_type: string;
  level: string;
  test_name: string;
  score: string;
}

interface FileRecord {
  file_id: number;
  file_path: string;
  file_name: string;
  file_type: string;
  file_category: string;
}

interface UserProfile {
  id: string;
  fullname: string;
  email: string;
  profile_image: string;
  is_visible: number;
  type_of_work: string;
  gender: string;
  military_status: string;
  date_of_birth: string;
  nationality: string;
  religion: string;
  weight: string;
  height: string;
  disability_status: string;
  marital_status: string;
  mobile_phone: string;
  line_id: string;
  country: string;
  province: string;
  district: string;
  sub_district: string;
  desired_salary: string;
  job_titles: JobTitle[];
  skills: Skill[];
  typing_speeds: Typing[];
  educations: Education[];
  experiences: Experience[];
  languages: Language[];
  files: FileRecord[];
}

/* ================= 2) Type ของข้อมูลที่ API ส่งมา ================= */

interface ApiProfile {
  id?: string | number;
  fullname?: string | null;
  email?: string | null;
  profile_image?: string | null;
  is_visible?: number | null;
  type_of_work?: string | null;
  gender?: string | null;
  military_status?: string | null;
  date_of_birth?: string | null;
  nationality?: string | null;
  religion?: string | null;
  weight?: string | number | null;
  height?: string | number | null;
  disability_status?: string | null;
  marital_status?: string | null;
  mobile_phone?: string | null;
  line_id?: string | null;
  country?: string | null;
  province?: string | null;
  district?: string | null;
  sub_district?: string | null;
  desired_salary?: string | number | null;
  job_titles?: { job_id?: number; job_name?: string | null }[] | null;
  skills?:
    | {
        skill_id?: number;
        skill_name?: string | null;
        skill_category?: string | null;
        skill_detail?: string | null;
      }[]
    | null;
  typing_speeds?:
    | {
        typing_id?: number;
        typing_language?: string | null;
        typing_wpm?: string | number | null;
      }[]
    | null;
  educations?:
    | {
        education_id?: number;
        level?: string | null;
        major?: string | null;
        institution?: string | null;
        faculty?: string | null;
        year_start?: string | number | null;
        year_end?: string | number | null;
      }[]
    | null;
  experiences?:
    | {
        ex_id?: number;
        ex_title?: string | null;
        ex_description?: string | null;
        type?: string | null;
        start_date?: string | null;
        end_date?: string | null;
      }[]
    | null;
  languages?:
    | {
        language_id?: number;
        language_type?: string | null;
        level?: string | null;
        test_name?: string | null;
        score?: string | number | null;
      }[]
    | null;
  files?:
    | {
        file_id?: number;
        file_path?: string | null;
        file_name?: string | null;
        file_type?: string | null;
        file_category?: string | null;
      }[]
    | null;
}

/* ================= 3) ฟังก์ชันช่วยพื้นฐาน ================= */

function toText(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function show(value: string): string {
  return value === "" ? "-" : value;
}

function showDate(value: string): string {
  if (value === "") return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function toDateInput(value: string): string {
  if (value === "") return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().substring(0, 10);
}

function getErrorText(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "เกิดข้อผิดพลาด";
}

function openFilePicker(inputId: string) {
  const input = document.getElementById(inputId);
  if (input) input.click();
}

function cleanProfile(data: ApiProfile): UserProfile {
  return {
    id: toText(data.id),
    fullname: toText(data.fullname),
    email: toText(data.email),
    profile_image: toText(data.profile_image),
    is_visible: data.is_visible === 1 ? 1 : 0,
    type_of_work: toText(data.type_of_work),
    gender: toText(data.gender),
    military_status: toText(data.military_status),
    date_of_birth: toText(data.date_of_birth),
    nationality: toText(data.nationality),
    religion: toText(data.religion),
    weight: toText(data.weight),
    height: toText(data.height),
    disability_status: toText(data.disability_status),
    marital_status: toText(data.marital_status),
    mobile_phone: toText(data.mobile_phone),
    line_id: toText(data.line_id),
    country: toText(data.country),
    province: toText(data.province),
    district: toText(data.district),
    sub_district: toText(data.sub_district),
    desired_salary: toText(data.desired_salary),

    job_titles: (data.job_titles ?? []).map((item) => ({
      job_id: item.job_id,
      job_name: toText(item.job_name),
    })),

    skills: (data.skills ?? []).map((item) => ({
      skill_id: item.skill_id,
      skill_name: toText(item.skill_name),
      skill_category: toText(item.skill_category),
      skill_detail: toText(item.skill_detail),
    })),

    typing_speeds: (data.typing_speeds ?? []).map((item) => ({
      typing_id: item.typing_id,
      typing_language: toText(item.typing_language),
      typing_wpm: toText(item.typing_wpm),
    })),

    educations: (data.educations ?? []).map((item) => ({
      education_id: item.education_id,
      level: toText(item.level),
      major: toText(item.major),
      institution: toText(item.institution),
      faculty: toText(item.faculty),
      year_start: toText(item.year_start),
      year_end: toText(item.year_end),
    })),

    experiences: (data.experiences ?? []).map((item) => ({
      ex_id: item.ex_id,
      ex_title: toText(item.ex_title),
      ex_description: toText(item.ex_description),
      type: toText(item.type),
      start_date: toText(item.start_date),
      end_date: toText(item.end_date),
    })),

    languages: (data.languages ?? []).map((item) => ({
      language_id: item.language_id,
      language_type: toText(item.language_type),
      level: toText(item.level),
      test_name: toText(item.test_name),
      score: toText(item.score),
    })),

    files: (data.files ?? []).map((item) => ({
      file_id: item.file_id ?? 0,
      file_path: toText(item.file_path),
      file_name: toText(item.file_name),
      file_type: toText(item.file_type),
      file_category: toText(item.file_category),
    })),
  };
}

const emptyProfile: UserProfile = cleanProfile({});

/* ================= 4) Styles & Components สำหรับ UI ================= */

const baseInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.75rem",
  borderRadius: "6px",
  border: "1px solid #d1d5db",
  fontSize: "0.875rem",
  color: "#111827",
  backgroundColor: "#ffffff",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
};

const rowInputStyle: React.CSSProperties = {
  ...baseInputStyle,
  width: "auto",
  minWidth: "140px",
  padding: "0.35rem 0.6rem",
};

const editCardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  padding: "1rem",
  borderRadius: "8px",
  backgroundColor: "#f9fafb",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
  width: "100%",
  boxSizing: "border-box",
  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
};

const labelStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: "0.825rem",
  color: "#374151",
  marginBottom: "0.2rem",
  display: "block",
};

/* --- Component ปุ่มลบแบบ Modern Trash Icon --- */
const RemoveButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      background: "transparent",
      border: "none",
      color: "#9ca3af",
      cursor: "pointer",
      padding: "6px",
      borderRadius: "6px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.15s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.color = "#ef4444";
      e.currentTarget.style.backgroundColor = "#fee2e2";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.color = "#9ca3af";
      e.currentTarget.style.backgroundColor = "transparent";
    }}
    title="ลบรายการ"
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  </button>
);

/* --- Component ปุ่มเพิ่มข้อมูลแบบ Modern Gray --- */
const AddButton = ({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      marginTop: "0.5rem",
      padding: "0.45rem 0.9rem",
      fontSize: "0.825rem",
      fontWeight: 600,
      color: "#374151",
      backgroundColor: "#f3f4f6",
      border: "1px solid #e5e7eb",
      borderRadius: "6px",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      transition: "all 0.15s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = "#e5e7eb";
      e.currentTarget.style.color = "#111827";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = "#f3f4f6";
      e.currentTarget.style.color = "#374151";
    }}
  >
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
    {label}
  </button>
);

interface InfoRowProps {
  label: string;
  value: string;
  editing: boolean;
  onChange: (newValue: string) => void;
  type?: string;
  options?: string[];
}

function InfoRow(props: InfoRowProps) {
  const { label, value, editing, onChange, type, options } = props;

  if (!editing) {
    return (
      <div className={styles.infoRow}>
        {label}: {type === "date" ? showDate(value) : show(value)}
      </div>
    );
  }

  if (options) {
    return (
      <div className={styles.infoRow}>
        {label}:{" "}
        <select
          style={rowInputStyle}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">-- เลือก --</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={styles.infoRow}>
      {label}:{" "}
      <input
        style={rowInputStyle}
        type={type ?? "text"}
        value={type === "date" ? toDateInput(value) : value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/* ================= 5) หน้าจอหลัก ================= */

const SeekerProfile = () => {
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<UserProfile>(emptyProfile);
  const [form, setForm] = useState<UserProfile>(emptyProfile);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [uploadingCategory, setUploadingCategory] = useState("");
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);

  const currentYear = new Date().getFullYear();
  const yearOptions: number[] = [];

  for (let y = currentYear + 5; y > currentYear - 45; y--) {
    yearOptions.push(y);
  }

  /* ---------- โหลดข้อมูล ---------- */

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch("/api/auth/me");
        const data: { user?: { id?: string | number } } = await res.json();
        if (data.user && data.user.id !== undefined) {
          setUserId(String(data.user.id));
        } else {
          setLoading(false);
        }
      } catch (err: unknown) {
        setError(getErrorText(err));
        setLoading(false);
      }
    }
    loadSession();
  }, []);

  useEffect(() => {
    if (userId !== "") loadProfile(userId);
  }, [userId]);

  async function loadProfile(id: string) {
    try {
      const res = await fetch(`/api/user/getUserById/${id}`);
      const data: { user?: ApiProfile; error?: string } = await res.json();
      if (res.ok && data.user) {
        const clean = cleanProfile(data.user);
        setProfile(clean);
        setForm(clean);
      } else {
        setError(data.error ?? "โหลดข้อมูลไม่สำเร็จ");
      }
    } catch (err: unknown) {
      setError(getErrorText(err));
    } finally {
      setLoading(false);
    }
  }

  /* ---------- แก้ไขช่องเดี่ยว ---------- */

  function changeText(field: string, value: string) {
    setForm({ ...form, [field]: value });
  }

  /* ---------- Job Title ---------- */

  function addJob() {
    setForm({ ...form, job_titles: [...form.job_titles, { job_name: "" }] });
  }

  function changeJob(index: number, value: string) {
    const list = [...form.job_titles];
    list[index] = { ...list[index], job_name: value };
    setForm({ ...form, job_titles: list });
  }

  function removeJob(index: number) {
    setForm({
      ...form,
      job_titles: form.job_titles.filter((v, i) => i !== index),
    });
  }

  /* ---------- Skill ---------- */

  function addSkill() {
    const item: Skill = {
      skill_name: "",
      skill_category: "General",
      skill_detail: "",
    };
    setForm({ ...form, skills: [...form.skills, item] });
  }

  function changeSkill(index: number, value: string) {
    const list = [...form.skills];
    list[index] = { ...list[index], skill_name: value };
    setForm({ ...form, skills: list });
  }

  function removeSkill(index: number) {
    setForm({ ...form, skills: form.skills.filter((v, i) => i !== index) });
  }

  /* ---------- Typing ---------- */

  function addTyping() {
    const item: Typing = { typing_language: "", typing_wpm: "" };
    setForm({ ...form, typing_speeds: [...form.typing_speeds, item] });
  }

  function changeTypingLanguage(index: number, value: string) {
    const list = [...form.typing_speeds];
    list[index] = { ...list[index], typing_language: value };
    setForm({ ...form, typing_speeds: list });
  }

  function changeTypingWpm(index: number, value: string) {
    const list = [...form.typing_speeds];
    list[index] = { ...list[index], typing_wpm: value };
    setForm({ ...form, typing_speeds: list });
  }

  function removeTyping(index: number) {
    setForm({
      ...form,
      typing_speeds: form.typing_speeds.filter((v, i) => i !== index),
    });
  }

  /* ---------- Education ---------- */

  function addEducation() {
    const item: Education = {
      level: "",
      major: "",
      institution: "",
      faculty: "",
      year_start: "",
      year_end: "",
    };
    setForm({ ...form, educations: [...form.educations, item] });
  }

  function changeEducation(index: number, field: string, value: string) {
    const list = [...form.educations];
    list[index] = { ...list[index], [field]: value };
    setForm({ ...form, educations: list });
  }

  function removeEducation(index: number) {
    setForm({
      ...form,
      educations: form.educations.filter((v, i) => i !== index),
    });
  }

  /* ---------- Experience ---------- */

  function addExperience() {
    const item: Experience = {
      ex_title: "",
      ex_description: "",
      type: "",
      start_date: "",
      end_date: "",
    };
    setForm({ ...form, experiences: [...form.experiences, item] });
  }

  function changeExperience(index: number, field: string, value: string) {
    const list = [...form.experiences];
    list[index] = { ...list[index], [field]: value };
    setForm({ ...form, experiences: list });
  }

  function removeExperience(index: number) {
    setForm({
      ...form,
      experiences: form.experiences.filter((v, i) => i !== index),
    });
  }

  /* ---------- Language ---------- */

  function addLanguage() {
    const item: Language = {
      language_type: "",
      level: "",
      test_name: "",
      score: "",
    };
    setForm({ ...form, languages: [...form.languages, item] });
  }

  function changeLanguage(index: number, field: string, value: string) {
    const list = [...form.languages];
    list[index] = { ...list[index], [field]: value };
    setForm({ ...form, languages: list });
  }

  function removeLanguage(index: number) {
    setForm({
      ...form,
      languages: form.languages.filter((v, i) => i !== index),
    });
  }

  /* ---------- Type of work ---------- */

  function toggleTypeOfWork(type: string) {
    const list = form.type_of_work
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "");

    let newList: string[];
    if (list.includes(type)) {
      newList = list.filter((t) => t !== type);
    } else {
      newList = [...list, type];
    }
    setForm({ ...form, type_of_work: newList.join(", ") });
  }

  /* ---------- บันทึก / ยกเลิก ---------- */

  async function saveProfile() {
    if (userId === "") return;
    setSaving(true);
    try {
      const res = await fetch(`/api/user/updateProfile/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setProfile(form);
        setEditMode(false);
        alert("บันทึกการเปลี่ยนแปลงโปรไฟล์เรียบร้อยแล้ว!");
        window.location.reload();
      } else {
        const data: { error?: string } = await res.json();
        alert(data.error ?? "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (err: unknown) {
      alert(getErrorText(err));
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setForm(profile);
    setEditMode(false);
  }

  /* ---------- เปิด/ปิดการมองเห็นโปรไฟล์ ---------- */

  async function toggleVisibility() {
    if (userId === "") return;
    const newValue = profile.is_visible === 1 ? 0 : 1;

    try {
      setTogglingVisibility(true);
      const res = await fetch(`/api/user/toggleVisibility/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_visible: newValue }),
      });

      if (res.ok) {
        setProfile({ ...profile, is_visible: newValue });
        setForm({ ...form, is_visible: newValue });
      } else {
        const data: { error?: string } = await res.json();
        alert(data.error ?? "ไม่สามารถเปลี่ยนสถานะการมองเห็นได้");
      }
    } catch (err: unknown) {
      alert(`เกิดข้อผิดพลาด: ${getErrorText(err)}`);
    } finally {
      setTogglingVisibility(false);
    }
  }

  /* ---------- รูปโปรไฟล์ ---------- */

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files ? event.target.files[0] : null;
    if (!file || userId === "") return;

    try {
      setSaving(true);
      const path = `user_avatars/${userId}_${Date.now()}_${file.name}`;
      const result = await uploadBytes(ref(storage, path), file);
      const url = await getDownloadURL(result.ref);

      const res = await fetch(`/api/user/updateProfile/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, profile_image: url }),
      });

      if (res.ok) {
        setProfile({ ...profile, profile_image: url });
        setForm({ ...form, profile_image: url });
        alert("เปลี่ยนรูปโปรไฟล์เรียบร้อยแล้ว! 📷✨");
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึกรูปภาพลงระบบ");
      }
    } catch (err: unknown) {
      alert(`อัปโหลดล้มเหลว: ${getErrorText(err)}`);
    } finally {
      setSaving(false);
    }
  }

  /* ---------- ไฟล์เอกสาร ---------- */

  function getFilesByCategory(category: string): FileRecord[] {
    return profile.files.filter(
      (f) => f.file_category.toLowerCase() === category.toLowerCase(),
    );
  }

  async function uploadFile(
    event: React.ChangeEvent<HTMLInputElement>,
    category: string,
  ) {
    const file = event.target.files ? event.target.files[0] : null;
    if (!file || userId === "") return;
    event.target.value = "";

    try {
      setUploadingCategory(category);
      const path = `user_documents/${userId}/${category}_${Date.now()}_${file.name}`;
      const result = await uploadBytes(ref(storage, path), file);
      const url = await getDownloadURL(result.ref);

      const res = await fetch("/api/user/saveFileRecord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: Number(userId),
          file_path: url,
          file_name: file.name,
          file_type: file.type,
          file_category: category,
        }),
      });

      if (res.ok) {
        loadProfile(userId);
      } else {
        const data: { error?: string } = await res.json();
        alert(`เกิดข้อผิดพลาดคลังข้อมูล: ${data.error ?? "unknown"}`);
      }
    } catch (err: unknown) {
      alert(`อัปโหลดล้มเหลว: ${getErrorText(err)}`);
    } finally {
      setUploadingCategory("");
    }
  }

  async function deleteFile(fileId: number, filePath: string) {
    const ok = confirm("คุณมั่นใจใช่ไหมที่จะลบไฟล์นี้ออกจากระบบอย่างถาวร? ❌");
    if (!ok) return;

    try {
      await deleteObject(ref(storage, filePath));
    } catch (err: unknown) {
      console.warn("ลบไฟล์คลาวด์ไม่ได้", err);
    }

    try {
      const res = await fetch(`/api/user/deleteFileRecord?file_id=${fileId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadProfile(userId);
      } else {
        alert("ไม่สามารถลบแถวข้อมูลได้");
      }
    } catch (err: unknown) {
      alert(`การลบล้มเหลว: ${getErrorText(err)}`);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (error !== "") return <p>Error: {error}</p>;

  const workTypes = [
    "Full-time",
    "Freelance",
    "Part-time",
    "Internship",
    "Contract",
  ];
  const typeOfWorkList = (editMode ? form.type_of_work : profile.type_of_work)
    .split(",")
    .map((s) => s.trim());

  const fileCategories = ["transcript", "resume", "portfolio", "certificate"];

  return (
    <div className={styles.container}>
      <div className={styles.profileGrid}>
        {/* ── Column 1: Personal Info ── */}
        <div className={styles.column}>
          <div className={styles.cardHeader} style={{ position: "relative" }}>
            Personal Information
            <button
              type="button"
              onClick={toggleVisibility}
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
                  profile.is_visible === 1 ? "#111827" : "#9ca3af",
                color: "#fff",
                opacity: togglingVisibility ? 0.6 : 1,
                transition: "background-color 0.2s ease",
              }}
            >
              {profile.is_visible === 1 ? (
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
              onClick={() => openFilePicker("avatar-input")}
              style={{ position: "relative", cursor: "pointer" }}
            >
              <input
                id="avatar-input"
                type="file"
                accept="image/*"
                onChange={uploadAvatar}
                style={{ display: "none" }}
              />

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  (editMode ? form.profile_image : profile.profile_image) ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    (editMode ? form.fullname : profile.fullname) || "User",
                  )}&background=111827&color=ffffff`
                }
                className={styles.avatar}
                alt="avatar"
                style={{ width: "100%", height: "100%", display: "block" }}
              />

              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  backgroundColor: "rgba(17, 24, 39, 0.6)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "#fff",
                  fontSize: "0.85rem",
                  fontWeight: 600,
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
                  {show(profile.fullname)}
                </h2>
                <p className={styles.email}>{show(profile.email)}</p>
              </>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  margin: "1.25rem 0",
                  width: "100%",
                }}
              >
                <input
                  type="text"
                  placeholder="Full Name"
                  value={form.fullname}
                  onChange={(e) => changeText("fullname", e.target.value)}
                  style={baseInputStyle}
                />
                <p className={styles.email}>{show(profile.email)}</p>
              </div>
            )}

            <div className={styles.detailsBox}>
              <div className={styles.titleinfoRow}>
                <strong>About</strong>
              </div>

              <InfoRow
                label="Gender"
                editing={editMode}
                value={editMode ? form.gender : profile.gender}
                options={["Male", "Female", "Other"]}
                onChange={(v) => changeText("gender", v)}
              />
              <InfoRow
                label="Military Status"
                editing={editMode}
                value={
                  editMode ? form.military_status : profile.military_status
                }
                options={["Exempted", "Served", "None"]}
                onChange={(v) => changeText("military_status", v)}
              />
              <InfoRow
                label="Date of Birth"
                type="date"
                editing={editMode}
                value={editMode ? form.date_of_birth : profile.date_of_birth}
                onChange={(v) => changeText("date_of_birth", v)}
              />
              <InfoRow
                label="Nationality"
                editing={editMode}
                value={editMode ? form.nationality : profile.nationality}
                onChange={(v) => changeText("nationality", v)}
              />
              <InfoRow
                label="Religion"
                editing={editMode}
                value={editMode ? form.religion : profile.religion}
                onChange={(v) => changeText("religion", v)}
              />
              <InfoRow
                label="Weight (Kg)"
                type="number"
                editing={editMode}
                value={editMode ? form.weight : profile.weight}
                onChange={(v) => changeText("weight", v)}
              />
              <InfoRow
                label="Height (Cm)"
                type="number"
                editing={editMode}
                value={editMode ? form.height : profile.height}
                onChange={(v) => changeText("height", v)}
              />
              <InfoRow
                label="Disability"
                editing={editMode}
                value={
                  editMode ? form.disability_status : profile.disability_status
                }
                onChange={(v) => changeText("disability_status", v)}
              />
              <InfoRow
                label="Marital"
                editing={editMode}
                value={editMode ? form.marital_status : profile.marital_status}
                options={["Single", "Married", "Divorced"]}
                onChange={(v) => changeText("marital_status", v)}
              />
              <InfoRow
                label="Mobile"
                editing={editMode}
                value={editMode ? form.mobile_phone : profile.mobile_phone}
                onChange={(v) => changeText("mobile_phone", v)}
              />

              <div className={styles.titleinfoRow}>
                <br />
                <strong>Contact</strong>
              </div>

              <InfoRow
                label="Line ID"
                editing={editMode}
                value={editMode ? form.line_id : profile.line_id}
                onChange={(v) => changeText("line_id", v)}
              />
              <div className={styles.infoRow}>
                Country:{" "}
                {!editMode ? (
                  show(profile.country)
                ) : (
                  <CountrySelect
                    value={form.country}
                    onChange={(value: string) => changeText("country", value)}
                  />
                )}
              </div>

              <div className={styles.infoRow}>
                Province:{" "}
                {!editMode ? (
                  show(profile.province)
                ) : (
                  <ProvinceSelect
                    value={form.province}
                    onChange={(value: string) => changeText("province", value)}
                  />
                )}
              </div>

              <InfoRow
                label="District"
                editing={editMode}
                value={editMode ? form.district : profile.district}
                onChange={(v) => changeText("district", v)}
              />
              <InfoRow
                label="Sub District"
                editing={editMode}
                value={editMode ? form.sub_district : profile.sub_district}
                onChange={(v) => changeText("sub_district", v)}
              />
            </div>

            {/* ปุ่ม Edit / Save + Cancel */}
            <div
              style={{
                marginTop: "1.5rem",
                paddingTop: "1.25rem",
                borderTop: "1px solid #e5e7eb",
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
                    backgroundColor: "#111827",
                    color: "#ffffff",
                    borderRadius: "999px",
                    border: "none",
                    fontSize: "0.92rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#374151";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#111827";
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
                <div style={{ display: "flex", gap: "0.6rem" }}>
                  <button
                    type="button"
                    onClick={saveProfile}
                    disabled={saving}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "11px 14px",
                      fontSize: "0.88rem",
                      fontWeight: 600,
                      backgroundColor: saving ? "#6b7280" : "#111827",
                      color: "#ffffff",
                      borderRadius: "999px",
                      border: "none",
                      cursor: saving ? "wait" : "pointer",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!saving)
                        e.currentTarget.style.backgroundColor = "#374151";
                    }}
                    onMouseLeave={(e) => {
                      if (!saving)
                        e.currentTarget.style.backgroundColor = "#111827";
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
                    onClick={cancelEdit}
                    disabled={saving}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "11px 14px",
                      fontSize: "0.88rem",
                      fontWeight: 600,
                      backgroundColor: "#ffffff",
                      color: "#374151",
                      borderRadius: "999px",
                      border: "1px solid #d1d5db",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f3f4f6";
                      e.currentTarget.style.color = "#111827";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#ffffff";
                      e.currentTarget.style.color = "#374151";
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
            {/* Job Title */}
            <section className={styles.section}>
              <h4>Job Title</h4>
              {!editMode ? (
                <ol className="list-decimal list-inside">
                  {profile.job_titles.map((job, i) => (
                    <li key={job.job_id ?? `view-job-${i}`}>
                      {show(job.job_name)}
                    </li>
                  ))}
                </ol>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  {form.job_titles.map((job, i) => (
                    <div
                      key={job.job_id ?? `edit-job-${i}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <input
                        style={baseInputStyle}
                        type="text"
                        placeholder="Job Title"
                        value={job.job_name}
                        onChange={(e) => changeJob(i, e.target.value)}
                      />
                      <RemoveButton onClick={() => removeJob(i)} />
                    </div>
                  ))}
                  <div>
                    <AddButton label="Add Job" onClick={addJob} />
                  </div>
                </div>
              )}
            </section>

            {/* Type of Work */}
            <section className={styles.section}>
              <h4>Type Of Work</h4>
              <div className={styles.tagGroup}>
                {workTypes.map((t) => (
                  <span
                    key={t}
                    className={
                      typeOfWorkList.includes(t) ? styles.tagActive : styles.tag
                    }
                    onClick={() => {
                      if (editMode) toggleTypeOfWork(t);
                    }}
                    style={{ cursor: editMode ? "pointer" : "default" }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </section>

            {/* Desired Salary */}
            <section className={styles.section}>
              <h4>Desired salary (baht)</h4>
              {!editMode ? (
                <p>{show(profile.desired_salary)} baht</p>
              ) : (
                <input
                  style={baseInputStyle}
                  type="number"
                  placeholder="e.g. 35000"
                  value={form.desired_salary}
                  onChange={(e) => changeText("desired_salary", e.target.value)}
                />
              )}
            </section>

            {/* Education */}
            <section className={styles.section}>
              <h4 className={styles.section}>Education</h4>
              <section className={styles.Educontainer}>
                <div className={styles.timeline}>
                  {!editMode ? (
                    <>
                      <div className={styles.centralLine}></div>
                      {profile.educations.map((item, index) => (
                        <div
                          key={item.education_id ?? `view-edu-${index}`}
                          className={`${styles.timelineItem} ${
                            index % 2 === 0 ? styles.left : styles.right
                          }`}
                        >
                          <div className={styles.content}>
                            <p className={styles.level}>{show(item.level)}</p>
                            <h4 className={styles.degree}>
                              {show(item.major)}
                            </h4>
                            <p className={styles.school}>
                              {show(item.institution)}
                            </p>
                            <p style={{ fontSize: "15px" }}>
                              {show(item.year_start)} – {show(item.year_end)}
                            </p>
                          </div>
                          <div className={styles.connector}></div>
                        </div>
                      ))}
                    </>
                  ) : (
                    /* EDIT MODE - EDUCATION */
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                        width: "150%",
                        marginLeft: "-28%",
                        marginTop: "-25%",
                      }}
                    >
                      {form.educations.map((item, i) => (
                        <div
                          key={item.education_id ?? `edit-edu-${i}`}
                          style={editCardStyle}
                        >
                          <div
                            style={{
                              position: "absolute",
                              top: "10px",
                              right: "10px",
                            }}
                          >
                            <RemoveButton onClick={() => removeEducation(i)} />
                          </div>

                          <div>
                            <label style={labelStyle}>Level:</label>
                            <LevelSelect
                              value={item.level}
                              onChange={(value: string) =>
                                changeEducation(i, "level", value)
                              }
                            />
                          </div>

                          <div>
                            <label style={labelStyle}>Major:</label>
                            <input
                              type="text"
                              placeholder="Major / Field of Study"
                              value={item.major}
                              onChange={(e) =>
                                changeEducation(i, "major", e.target.value)
                              }
                              style={baseInputStyle}
                            />
                          </div>

                          <div>
                            <label style={labelStyle}>Institution:</label>
                            <input
                              type="text"
                              placeholder="School / University"
                              value={item.institution}
                              onChange={(e) =>
                                changeEducation(
                                  i,
                                  "institution",
                                  e.target.value,
                                )
                              }
                              style={baseInputStyle}
                            />
                          </div>

                          <div
                            style={{
                              display: "flex",
                              gap: "0.75rem",
                              flexWrap: "wrap",
                            }}
                          >
                            <div style={{ flex: "1 1 130px" }}>
                              <label style={labelStyle}>Year Start:</label>
                              <select
                                value={item.year_start}
                                onChange={(e) =>
                                  changeEducation(
                                    i,
                                    "year_start",
                                    e.target.value,
                                  )
                                }
                                style={baseInputStyle}
                              >
                                <option value="">Select year</option>
                                {yearOptions.map((year) => (
                                  <option key={`start-${year}`} value={year}>
                                    {year}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div style={{ flex: "1 1 130px" }}>
                              <label style={labelStyle}>Year End:</label>
                              <select
                                value={item.year_end}
                                onChange={(e) =>
                                  changeEducation(i, "year_end", e.target.value)
                                }
                                style={baseInputStyle}
                              >
                                <option value="">Select year</option>
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
                      ))}

                      <div>
                        <AddButton
                          label="เพิ่มประวัติการศึกษา"
                          onClick={addEducation}
                        />
                      </div>
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
            {/* Specific Skills */}
            <section className={styles.section}>
              <h4>Specific skills</h4>
              {!editMode ? (
                <ol className="list-decimal list-inside">
                  {profile.skills.map((s, i) => (
                    <li key={s.skill_id ?? `view-skill-${i}`}>
                      {show(s.skill_name)}
                    </li>
                  ))}
                </ol>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  {form.skills.map((s, i) => (
                    <div
                      key={s.skill_id ?? `edit-skill-${i}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <input
                        style={baseInputStyle}
                        type="text"
                        placeholder="Skill Name"
                        value={s.skill_name}
                        onChange={(e) => changeSkill(i, e.target.value)}
                      />
                      <RemoveButton onClick={() => removeSkill(i)} />
                    </div>
                  ))}
                  <div>
                    <AddButton label="Add Skill" onClick={addSkill} />
                  </div>
                </div>
              )}
            </section>

            {/* Typing Speed */}
            <section className={styles.section}>
              <h4>Typing Speed</h4>
              {!editMode ? (
                profile.typing_speeds.map((t, i) => (
                  <ul
                    key={t.typing_id ?? `view-typing-${i}`}
                    style={{ marginBottom: "1rem" }}
                  >
                    <li>
                      <h4>{show(t.typing_language)}</h4>
                    </li>
                    <li>- {show(t.typing_wpm)} WPM</li>
                  </ul>
                ))
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  {form.typing_speeds.map((t, i) => (
                    <div
                      key={t.typing_id ?? `edit-typing-${i}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <input
                        style={{ ...baseInputStyle, flex: 2 }}
                        type="text"
                        placeholder="Language (e.g. Thai)"
                        value={t.typing_language}
                        onChange={(e) =>
                          changeTypingLanguage(i, e.target.value)
                        }
                      />
                      <input
                        style={{ ...baseInputStyle, flex: 1 }}
                        type="number"
                        placeholder="WPM"
                        value={t.typing_wpm}
                        onChange={(e) => changeTypingWpm(i, e.target.value)}
                      />
                      <RemoveButton onClick={() => removeTyping(i)} />
                    </div>
                  ))}
                  <div>
                    <AddButton label="Add Typing" onClick={addTyping} />
                  </div>
                </div>
              )}
            </section>

            {/* Projects & Experiences */}
            <section className={styles.section}>
              <h4>Projects &amp; Experiences</h4>
              {!editMode ? (
                profile.experiences.map((exp, i) => (
                  <ul
                    key={exp.ex_id ?? `view-exp-${i}`}
                    style={{ marginBottom: "1rem" }}
                  >
                    <li>
                      - <strong>{show(exp.ex_title)}</strong>
                    </li>
                    <li className={styles.setLi}>{show(exp.ex_description)}</li>
                    <li className={styles.setLi}>
                      {showDate(exp.start_date)} – {showDate(exp.end_date)}
                    </li>
                  </ul>
                ))
              ) : (
                /* EDIT MODE - EXPERIENCE */
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    width: "100%",
                  }}
                >
                  {form.experiences.map((exp, i) => (
                    <div
                      key={exp.ex_id ?? `edit-exp-${i}`}
                      style={editCardStyle}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                        }}
                      >
                        <RemoveButton onClick={() => removeExperience(i)} />
                      </div>

                      <div>
                        <label style={labelStyle}>Experience Title:</label>
                        <input
                          type="text"
                          placeholder="Title (e.g., Senior Developer)"
                          value={exp.ex_title}
                          onChange={(e) =>
                            changeExperience(i, "ex_title", e.target.value)
                          }
                          style={baseInputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Description:</label>
                        <textarea
                          placeholder="Description of responsibilities or achievements"
                          value={exp.ex_description}
                          onChange={(e) =>
                            changeExperience(
                              i,
                              "ex_description",
                              e.target.value,
                            )
                          }
                          style={{
                            ...baseInputStyle,
                            minHeight: "75px",
                            fontFamily: "inherit",
                            resize: "vertical",
                          }}
                        />
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "0.75rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ flex: "1 1 130px" }}>
                          <label style={labelStyle}>Start Date:</label>
                          <input
                            type="date"
                            value={toDateInput(exp.start_date)}
                            onChange={(e) =>
                              changeExperience(i, "start_date", e.target.value)
                            }
                            style={baseInputStyle}
                          />
                        </div>

                        <div style={{ flex: "1 1 130px" }}>
                          <label style={labelStyle}>End Date:</label>
                          <input
                            type="date"
                            value={toDateInput(exp.end_date)}
                            onChange={(e) =>
                              changeExperience(i, "end_date", e.target.value)
                            }
                            style={baseInputStyle}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div>
                    <AddButton label="Add Exp" onClick={addExperience} />
                  </div>
                </div>
              )}
            </section>

            {/* Language Proficiency */}
            <section className={styles.section}>
              <h4>Language Proficiency</h4>
              {!editMode ? (
                profile.languages.map((lang, i) => (
                  <ul
                    key={lang.language_id ?? `view-lang-${i}`}
                    style={{ marginBottom: "1rem" }}
                  >
                    <li>
                      <h4>{show(lang.language_type)}</h4>
                    </li>
                    <li>- {show(lang.level)}</li>
                    {(lang.test_name !== "" || lang.score !== "") && (
                      <li>
                        - {show(lang.test_name)}
                        {lang.score !== "" ? `: ${lang.score}` : ""}
                      </li>
                    )}
                  </ul>
                ))
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {form.languages.map((lang, i) => (
                    <div
                      key={lang.language_id ?? `edit-lang-${i}`}
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                        alignItems: "center",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        backgroundColor: "#f9fafb",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <input
                        style={{ ...baseInputStyle, flex: "1 1 120px" }}
                        type="text"
                        placeholder="Language (e.g. English)"
                        value={lang.language_type}
                        onChange={(e) =>
                          changeLanguage(i, "language_type", e.target.value)
                        }
                      />
                      <input
                        style={{ ...baseInputStyle, flex: "1 1 100px" }}
                        type="text"
                        placeholder="Level (e.g. Advanced)"
                        value={lang.level}
                        onChange={(e) =>
                          changeLanguage(i, "level", e.target.value)
                        }
                      />
                      <input
                        style={{ ...baseInputStyle, flex: "1 1 100px" }}
                        type="text"
                        placeholder="Test (e.g. TOEIC)"
                        value={lang.test_name}
                        onChange={(e) =>
                          changeLanguage(i, "test_name", e.target.value)
                        }
                      />
                      <input
                        style={{ ...baseInputStyle, flex: "0 1 80px" }}
                        type="number"
                        step="any"
                        placeholder="Score"
                        value={lang.score}
                        onChange={(e) =>
                          changeLanguage(i, "score", e.target.value)
                        }
                      />
                      <RemoveButton onClick={() => removeLanguage(i)} />
                    </div>
                  ))}
                  <div>
                    <AddButton label="Add Language" onClick={addLanguage} />
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* ── Column 4: Files ── */}
        <div className={styles.columnTransparent}>
          <div className={styles.fileGroup}>
            {fileCategories.map((category) => {
              const currentFiles = getFilesByCategory(category);
              const isUploading = uploadingCategory === category;

              return (
                <div key={category} className={styles.fileItem}>
                  <label
                    style={{ textTransform: "lowercase", marginBottom: "10px" }}
                  >
                    {category} ({currentFiles.length})
                  </label>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    {currentFiles.map((file, i) => {
                      const name =
                        file.file_name === "" ? "File" : file.file_name;
                      const shortName =
                        name.length > 15 ? name.substring(0, 13) + "..." : name;
                      const fileKey =
                        file.file_id && file.file_id !== 0
                          ? file.file_id
                          : `file-${category}-${i}`;

                      return (
                        <div key={fileKey} className={styles.fileContainerBox}>
                          <div className={styles.fileNameDisplay} title={name}>
                            📄 {shortName}
                            <span
                              className={styles.deleteFileIcon}
                              onClick={() =>
                                deleteFile(file.file_id, file.file_path)
                              }
                            >
                              ❌
                            </span>
                          </div>
                          <div
                            className={styles.fileBox}
                            onClick={() => setPreviewFile(file)}
                          >
                            view file
                          </div>
                        </div>
                      );
                    })}

                    <div style={{ width: "100%", marginTop: "5px" }}>
                      <input
                        id={`file-input-${category}`}
                        type="file"
                        onChange={(e) => uploadFile(e, category)}
                        className={styles.hiddenInput}
                      />
                      <button
                        type="button"
                        className={styles.addFileInlineBtn}
                        onClick={() => openFilePicker(`file-input-${category}`)}
                        disabled={uploadingCategory !== ""}
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

      {/* ─── Popup พรีวิวไฟล์ ─── */}
      {previewFile && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                Preview: {previewFile.file_name}
              </span>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setPreviewFile(null)}
              >
                ปิดหน้าต่าง ✖
              </button>
            </div>
            <div className={styles.modalBody}>
              {previewFile.file_path.toLowerCase().includes(".pdf") ? (
                <iframe
                  src={previewFile.file_path}
                  className={styles.modalIframe}
                  title="PDF View"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewFile.file_path}
                  className={styles.modalImg}
                  alt="Preview"
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
