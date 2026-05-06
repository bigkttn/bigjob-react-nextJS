import Link from "next/link"; // Import Link Component มาก่อน
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BIG-JOBS",
  description: "This is the home page of our Next.js application",
};

export default function Home() {
  const age = 13;
  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">ยินดีต้อนรับสู่หน้า Home!</h1>
      <p>นี่คือหน้าหลักของแอปพลิเคชัน Next.js ของคุณ</p>
      <p>อายุของคุณคือ: {age}</p>
    </div>
  );
}
