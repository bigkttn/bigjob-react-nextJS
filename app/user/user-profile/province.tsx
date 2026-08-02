"use client";
import { useState, useRef, useEffect } from "react";
import { THAI_PROVINCES } from "@/lib/thaiProvinces";

interface ProvinceSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ProvinceSelect({
  value,
  onChange,
}: ProvinceSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // กรองจังหวัดตามคำค้นหา
  const filteredProvinces = THAI_PROVINCES.filter((prov) =>
    prov.toLowerCase().includes(search.toLowerCase()),
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
    // ⚠️ เดิมตรงนี้เป็น <div style={{ position: "relative", flex: 1 }}>
    // <div> เป็น block element เสมอ (flex: 1 ไม่มีผลอะไรเพราะ parent ที่เรียกใช้
    // component นี้ใน seekerProfile.tsx ไม่ใช่ display:flex) เลยไปขึ้นบรรทัดใหม่
    // และกว้างเต็ม container ต่างจาก input ตัวอื่น (Line ID, Country ฯลฯ) ที่เป็น
    // inline element เลยลอยต่อท้าย label ได้ปกติ
    // แก้โดยใช้ display: inline-block + minWidth ให้เท่ากับ input ตัวอื่น
    <div
      ref={wrapperRef}
      style={{
        position: "relative",
        display: "inline-block",
        minWidth: "120px",
      }}
    >
      {/* ช่อง Input หลัก */}
      <input
        type="text"
        placeholder="พิมพ์ค้นหาหรือเลือกจังหวัด..."
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
          minWidth: "120px",
          padding: "0.3rem",
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
          {filteredProvinces.length > 0 ? (
            filteredProvinces.map((prov) => (
              <li
                key={prov}
                onClick={() => {
                  onChange(prov);
                  setIsOpen(false);
                }}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  borderBottom: "1px solid #eee",
                  backgroundColor: value === prov ? "#f0f8ff" : "transparent",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f5f5f5")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    value === prov ? "#f0f8ff" : "transparent")
                }
              >
                {prov}
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
              ไม่พบจังหวัดที่ค้นหา
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
