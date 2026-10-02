"use client";
import { useState, useRef, useEffect } from "react";
import styles from "./FilterSelect.module.css";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

// Dropdown ตัวกรองที่หน้าตาเหมือน ProvinceSelect (ปุ่มดำ ▼ + รายการพื้นขาว)
export default function FilterSelect({
  value,
  options,
  onChange,
}: FilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selected = options.find((opt) => opt.value === value) ?? options[0];

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

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setIsOpen(false);
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {selected?.label}
      </button>

      <span className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ""}`}>
        ▼
      </span>

      {isOpen && (
        <ul className={styles.menu} role="listbox">
          {options.map((opt) => {
            const isSelected = opt.value === selected?.value;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                className={`${styles.option} ${isSelected ? styles.optionSelected : ""}`}
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
