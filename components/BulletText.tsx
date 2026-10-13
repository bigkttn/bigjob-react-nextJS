import styles from "./BulletText.module.css";

interface BulletTextProps {
  text?: string | null;
  fallback?: string;
}

// สัญลักษณ์นำหน้าที่ผู้ใช้อาจพิมพ์เอง (•, -, * ฯลฯ) ตัดออกเพื่อไม่ให้ซ้ำกับไอคอน
const LEADING_MARK = /^[•●⚫·\-*]\s*/;

// แยกข้อความตามการขึ้นบรรทัดใหม่ (Enter) ให้แต่ละบรรทัดเป็นหนึ่งข้อ
const toLines = (text: string) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim().replace(LEADING_MARK, ""))
    .filter((line) => line !== "");

export default function BulletText({ text, fallback = "-" }: BulletTextProps) {
  const lines = toLines(text ?? "");

  if (lines.length === 0) {
    return <span>{fallback}</span>;
  }

  return (
    <ul className={styles.list}>
      {lines.map((line, index) => (
        <li key={index} className={styles.item}>
          <span className={styles.dot} aria-hidden="true" />
          <span className={styles.text}>{line}</span>
        </li>
      ))}
    </ul>
  );
}
