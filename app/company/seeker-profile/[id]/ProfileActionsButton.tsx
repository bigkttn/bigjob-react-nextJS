"use client";

import { useState, useRef, useEffect } from "react";
import "material-symbols";
import styles from "./profile.module.css";

//  แก้พรอพให้รับเฉพาะสิ่งที่ส่งมาจากหน้าหลักจริง ๆ 
interface ProfileActionsProps {
  userId: number;
  companyId: number;
}

type ReportType = 'identity_fraud' | 'job_no_show' | 'harassment_to_staff';

export default function ProfileActionsButton({
  userId,
  companyId,
}: ProfileActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isSaved, setIsSaved] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false); // ✅ ควบคุมการเปิด/ปิด Modal ป็อปอัพ
  // ✅ State สำหรับเก็บค่าข้อมูลในฟอร์มรายงาน
  const [selectedType, setSelectedType] = useState<ReportType | "">("");
  const [description, setDescription] = useState("");
  
  //  แก้ไขชื่อฟังก์ชัน Set State ให้ถูกต้องตรงกัน
  const [isReported, setIsReported] = useState(false); 

  // ปิดเมนูเมื่อคลิกพื้นที่ด้านนอก
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    checkSaved();
  }, []);

  // โค้ดสำหรับเซฟ/บุ๊กมาร์ก
  const handleBookmark = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/company/favour_user",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: Number(userId),
            company_id: Number(companyId),
          }),
        },
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error Details:", errorData);
        alert(`Failed to Save (Status: ${response.status}) เคยบันทึกแล้ว`);
        return;
      }
      setIsSaved(true);
      alert("Saved Successfully!");
    } catch (error) {
      console.error("Network Error:", error);
      alert("Unable to connect to the server.");
    }
  };

  const handleDeleteBookmark = async () => {
    if (isSaved) {
      await handleDeleteSaved(Number(userId), Number(companyId));
    } else {
      await handleBookmark(); 
    }
  };

  const checkSaved = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/company/check_favour_user",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: Number(userId),
            company_id: Number(companyId),
          }),
        }
      );
      const data = await response.json();
      if (data && data.rows && data.rows.length > 0) {
        setIsSaved(true);
      } else {
        setIsSaved(false);
      }
    } catch (error) {
      console.error("Error in checkSaved:", error);
    }
  };

  const handleDeleteSaved = async (userId: number, companyId: number) => {
    const confirmDelete = confirm("คุณแน่ใจหรือไม่ว่าต้องการลบผู้สมัครงานออกจากรายการบันทึก?");
    if (!confirmDelete) return;
    try {
      const response = await fetch("/api/company/delete_favour_user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: Number(userId),
          company_id: Number(companyId),
        }),
      });
      if (response.ok) {
        setIsSaved(false);
        alert("ลบออกจากรายการบันทึกแล้ว");
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`ไม่สามารถลบได้: ${errorData.message || 'เกิดข้อผิดพลาด'}`);
      }
    } catch (error) {
      console.error("Error in handleDeleteSaved:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

  // ✅ ฟังก์ชันเปิด Modal และเคลียร์ค่าเก่าออกก่อน
  const openReportModal = () => {
    setSelectedType("");
    setDescription("");
    setIsModalOpen(true);
    setIsOpen(false); // ปิดเมนูสามจุดไปด้วยเลย
  };

  // ✅ ฟังก์ชันส่งข้อมูลรายงานจากใน Modal
 

  const handleReport = async (reportType: ReportType, description: string) => {
     if (!selectedType || !description.trim()) {
      alert("กรุณาเลือกประเภทการรายงานและกรอกรายละเอียดให้ครบถ้วน");
      return;
    }
    try {
      const response = await fetch("/api/company/report_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: Number(userId),
          company_id: Number(companyId),
          report_type: reportType,
          description: String(description).trim(),
        })
      });

      if (response.status === 409) {
        alert("คุณเคยส่งรายงานพฤติกรรมสำหรับผู้สมัครงานคนนี้ไปแล้ว ระบบกำลังอยู่ระหว่างตรวจสอบ");
        setIsModalOpen(false); // ปิดโมดอลป็อปอัพ
        setIsOpen(false);      // ปิดเมนูสามจุด
        return;
      }
      
      if (response.ok) {
        console.log("reported!!");
        setIsReported(true); //  แก้ไขชื่อตัวแปรให้ตรงกับ State
        alert("Reported Successfully!");
        setIsModalOpen(false); // ปิดโมดอลป็อปอัพ
      } else {
        console.log("fail report!!");
        alert("เกิดข้อผิดพลาดจากเซิร์ฟเวอร์");
      }
    } catch (error) {
      console.error("Error Report", error);
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
    setIsOpen(false);
  };

  return (
    <div
      style={{ position: "relative", display: "inline-block" }}
      ref={menuRef}
    >
      <span
        className="material-symbols-outlined"
        style={{
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        more_vert
      </span>

      {/* Dropdown เมนูย่อย */}
      {isOpen && (
        <div 
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            backgroundColor: "#fff",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
            borderRadius: "6px",
            zIndex: 10,
            minWidth: "120px",
            padding: "4px 0",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <button
            onClick={handleDeleteBookmark}
            className={`${styles.savedButton} ${isSaved ? styles.active : ""}`}
            style={{
              color: isSaved ? "#f4b400" : "#333",
              padding: "8px 12px",
              background: "none",
              border: "none",
              textAlign: "left",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
            }}
          >
            <span
              className={`material-symbols-outlined ${styles.savedButton}`}
              style={{
                fontSize: "18px",
                color: isSaved ? "#f4b400" : "#333",
                fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              bookmark
            </span>
            {isSaved ? "Saved" : "Save"}
          </button>

          <button
            onClick={openReportModal} //  เปลี่ยนมาเรียก Flow กรอกข้อมูลก่อนส่ง
         className={`${styles.reportedButton} ${isReported ? styles.active : ""}`}
            style={{
              padding: "8px 12px",
              background: "none",
              border: "none",
              textAlign: "left",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#d93025",
              fontSize: "14px",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "18px" }}
            >
              flag_2
            </span>
            Report
          </button>
        </div>
      )}
      {/* ========================================================= */}
      {/* ✅ หน้าต่าง MODAL POPUP (จะแสดงผลเมื่อคลิก Report เท่านั้น) */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)", // พื้นหลังมืดโปร่งแสง
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999, // ให้อยู่ชั้นบนสุดของหน้าจอเสมอ
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "24px",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "450px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              fontFamily: "sans-serif",
            }}
          >
            {/* หัวข้อโมดอล */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#333" }}>รายงานพฤติกรรมผู้สมัครงาน</h3>
              <span
                className="material-symbols-outlined"
                style={{ cursor: "pointer", color: "#666" }}
                onClick={() => setIsModalOpen(false)} // ปุ่มกากบาทปิดโมดอล
              >
                close
              </span>
            </div>

            <hr style={{ border: "0.5px solid #eee", margin: 0 }} />

            {/* ฟอร์มเลือกประเภท */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "14px", fontWeight: "bold", color: "#555" }}>ประเภทความผิดปกติ</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as ReportType)}
                style={{
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  fontSize: "14px",
                  outline: "none",
                  backgroundColor: "#fff"
                }}
              >
                <option value="">-- โปรดเลือกหัวข้อรายงาน --</option>
                <option value="identity_fraud">ข้อมูลโปรไฟล์ไม่ตรงกับความจริง / แอบอ้างตัวตน</option>
                <option value="job_no_show">ตกลงรับงานแล้วแต่ไม่มาเริ่มงาน (No Show)</option>
                <option value="harassment_to_staff">ใช้คำพูดไม่สุภาพ / คุกคามเจ้าหน้าที่</option>
              </select>
            </div>

            {/* ฟอร์มพิมพ์รายละเอียด */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "14px", fontWeight: "bold", color: "#555" }}>รายละเอียดเพิ่มเติม</label>
              <textarea
                placeholder="กรุณาระบุรายละเอียด เช่น วันนัดหมาย พฤติกรรม หรือหลักฐานประกอบเบื้องต้น..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                style={{
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  resize: "none",
                  outline: "none"
                }}
              />
            </div>

            {/* ปุ่มกดยืนยันหรือยกเลิก */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  backgroundColor: "#fff",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleReport(selectedType as ReportType, description)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "#d93025", // สีแดง
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "bold"
                }}
              >
                ส่งรายงาน
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
  
  

