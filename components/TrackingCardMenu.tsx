"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./TrackingCardMenu.module.css";

interface TrackingCardMenuProps {
  onDelete: () => void;
}

// เมนูสามจุดมุมขวาบนของการ์ดในรายการติดตามสถานะ กดแล้วแสดงปุ่มลบรายการ
// (การยืนยันการลบเป็นหน้าที่ของ onDelete)
export default function TrackingCardMenu({ onDelete }: TrackingCardMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // ปิดเมนูเมื่อคลิกนอกเมนู หรือกด Esc
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={styles.menu} ref={menuRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-label="ตัวเลือกเพิ่มเติม"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={(e) => {
          // ไม่ให้คลิกเมนูไปเลือกการ์ด
          e.stopPropagation();
          setIsOpen((open) => !open);
        }}
      >
        <span className="material-symbols-outlined">more_vert</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="menu">
          <button
            type="button"
            role="menuitem"
            className={styles.deleteItem}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              onDelete();
            }}
          >
            <span className="material-symbols-outlined">delete</span>
            ลบรายการ
          </button>
        </div>
      )}
    </div>
  );
}
