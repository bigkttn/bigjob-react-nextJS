"use client";
import { useState, useRef, useEffect } from "react";
import { EDUCATION_LEVELS } from "@/lib/educationLevels";

interface LevelSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function LevelSelect({ value, onChange }: LevelSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // กรองระดับการศึกษาตามคำค้นหา
  const filteredLevels = EDUCATION_LEVELS.filter((lvl) =>
    lvl.toLowerCase().includes(search.toLowerCase()),
  );

  // ปิด Dropdown เมื่อคลิกนอกกล่อง
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    // ใช้ display: inline-block + minWidth เหมือน ProvinceSelect ที่แก้แล้ว
    // เพื่อไม่ให้หลุดไปขึ้นบรรทัดใหม่/ผิดขนาดจาก input ตัวอื่นในฟอร์มเดียวกัน
    <div
      ref={wrapperRef}
      style={{
        position: "relative",
        display: "inline-block",
        width: "100%",
      }}
    >
      {/* ช่อง Input หลัก */}
      <input
        type="text"
        placeholder="พิมพ์ค้นหาหรือเลือกระดับการศึกษา..."
        value={isOpen ? search : value}
        onFocus={() => {
          setIsOpen(true);
          setSearch(""); // เคลียร์คำค้นหาเมื่อกดเปิด
        }}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        style={{
          width: "100%",
          padding: "0.5rem",
          borderRadius: "4px",
          border: "1px solid #ccc",
          fontFamily: "inherit",
        }}
      />

      {/* เมนู Dropdown รายการที่ค้นหาเจอ */}
      {isOpen && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            maxHeight: "200px",
            overflowY: "auto",
            margin: "4px 0 0 0",
            padding: 0,
            listStyle: "none",
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            borderRadius: "4px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            zIndex: 1000,
          }}
        >
          {filteredLevels.length > 0 ? (
            filteredLevels.map((lvl) => (
              <li
                key={lvl}
                onClick={() => {
                  onChange(lvl);
                  setIsOpen(false);
                }}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  borderBottom: "1px solid #eee",
                  backgroundColor: value === lvl ? "#f0f8ff" : "transparent",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f5f5f5")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    value === lvl ? "#f0f8ff" : "transparent")
                }
              >
                {lvl}
              </li>
            ))
          ) : (
            <li
              style={{
                padding: "8px 12px",
                color: "#999",
                textAlign: "center",
              }}
            >
              ไม่พบระดับการศึกษาที่ค้นหา
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
