import Link from 'next/link';
import type { Metadata } from "next"; 

export default function About() {
  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">ยินดีต้อนรับสู่หน้า About!</h1>
      <p>นี่คือหน้าข้อมูลของแอปพลิเคชัน Next.js ของคุณ</p>
    </div>
  );
}