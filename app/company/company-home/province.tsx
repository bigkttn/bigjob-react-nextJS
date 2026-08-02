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

  // รายการตัวเลือก "ทุกจังหวัด" + รายการจังหวัดทั้งหมด
  const ALL_OPTIONS = ["ทุกจังหวัด", ...THAI_PROVINCES];

  // กรองจังหวัดตามคำค้นหา
  const filteredProvinces = ALL_OPTIONS.filter((prov) =>
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
    <div
      ref={wrapperRef}
      style={{
        position: "relative",
        display: "inline-block",
      }}
    >
      {/* ช่อง Input แต่งสไตล์ให้เป็นปุ่มสีดำมน ความสูง 50px เท่าตัวเลือกอื่น */}
      <input
        type="text"
        placeholder="ทุกจังหวัด"
        value={isOpen ? search : value || "ทุกจังหวัด"}
        onFocus={() => {
          setIsOpen(true);
          setSearch(""); // เคลียร์คำค้นหาเมื่อกดเปิด
        }}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        style={{
          height: "50px", // 📌 ปรับจาก 38px เป็น 50px เท่ากับ select ตัวอื่น
          padding: "0 32px 0 16px",
          borderRadius: "12px", // 📌 ความโค้งมน 12px เท่ากับปุ่มอื่น
          border: isOpen ? "1px solid #333" : "none",
          fontFamily: "inherit",
          fontSize: "14px",
          fontWeight: "500",
          cursor: isOpen ? "text" : "pointer",
          // 🎨 สไตล์ปุ่มสีดำข้อความขาว พอกดพิมพ์จะเปลี่ยนเป็นสีขาวข้อความดำ
          backgroundColor: isOpen ? "#ffffff" : "#000000",
          color: isOpen ? "#000000" : "#ffffff",
          outline: "none",
          transition: "all 0.2s ease",
          boxSizing: "border-box",
          minWidth: "150px",
        }}
      />

      {/* ลูกศร Dropdown ด้านขวา */}
      <span
        style={{
          position: "absolute",
          right: "12px",
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          fontSize: "10px",
          color: isOpen ? "#000000" : "#ffffff",
          transition: "color 0.2s ease",
        }}
      >
        ▼
      </span>

      {/* รายการเมนู Dropdown */}
      {isOpen && (
        <ul
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            minWidth: "100%",
            width: "max-content",
            maxHeight: "220px",
            overflowY: "auto",
            margin: 0,
            padding: "4px 0",
            listStyle: "none",
            backgroundColor: "#ffffff",
            color: "#000000",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            zIndex: 1000,
            fontSize: "14px",
          }}
        >
          {filteredProvinces.length > 0 ? (
            filteredProvinces.map((prov) => {
              const isSelected =
                value === prov || (value === "" && prov === "ทุกจังหวัด");

              return (
                <li
                  key={prov}
                  onClick={() => {
                    onChange(prov === "ทุกจังหวัด" ? "" : prov);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: "8px 16px",
                    cursor: "pointer",
                    backgroundColor: isSelected ? "#f3f4f6" : "transparent",
                    fontWeight: isSelected ? "600" : "400",
                    color: "#111827",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = isSelected
                      ? "#e5e7eb"
                      : "#f9fafb")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = isSelected
                      ? "#f3f4f6"
                      : "transparent")
                  }
                >
                  {prov}
                </li>
              );
            })
          ) : (
            <li
              style={{
                padding: "8px 16px",
                color: "#9ca3af",
                textAlign: "center",
                whiteSpace: "nowrap",
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
