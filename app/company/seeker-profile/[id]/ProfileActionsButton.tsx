"use client";

import { useState, useRef, useEffect } from "react";
import "material-symbols";
import styles from "./profile.module.css";

interface ProfileActionsProps {
  userId: number;
  companyId: number;
}

export default function ProfileActionsButton({
  userId,
  companyId,
}: ProfileActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isSaved, setIsSaved] = useState(false);

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
  console.log("check it")
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

  const checkSaved = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/company/check_favour_user",
        {
          method:"POST",
          headers:{"Content-Type": "application/json"},
          body: JSON.stringify({
            user_id: Number(userId),
            company_id: Number(companyId),
          }),
        }
        
      );
      const data = await response.json();
    if (data && data.rows && data.rows.length > 0){
        console.log("have data")
        console.log("->",data)
        setIsSaved(true)
      }
      else{
        console.log("No have data")
         console.log("->",data)
         setIsSaved(false)
      }
    } catch (error) {
      
    }
  }

  const handleReport = () => {
    // โค้ดสำหรับแจ้งรายงาน (Report)
    alert("Reported!");
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
          
            onClick={handleBookmark}
            className={`${styles.savedButton} ${isSaved ? styles.active : ""}`}
            style={{
              color: isSaved ? "#f4b400" : "#333", // เปลี่ยนสีตัวอักษรปุ่ม
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
              className="material-symbols-outlined"
              style={{
                fontSize: "18px",
                color: isSaved ? "#f4b400" : "#333", //  บังคับใส่สีที่ตัวไอคอนโดยตรงเพื่อป้องกัน CSS ตัวอื่นสืบทอดมาทับ
                fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              bookmark
            </span>
            {isSaved ? "Saved" : "Save"}
          </button>

          <button
            onClick={handleReport}
            style={{
              padding: "8px 12px",
              background: "none",
              border: "none",
              textAlign: "left",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#d93025", // สีแดงสำหรับ Report
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
    </div>
  );
}