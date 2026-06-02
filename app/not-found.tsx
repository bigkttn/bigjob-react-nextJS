import Link from "next/link";
import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";

interface CustomJwtPayload extends JwtPayload {
  id: number;
  email: string;
  role: string;
}

export default async function NotFound() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  let user = null;
  if (token) {
    try {
      const secret = process.env.JWT_SECRET || "fallback_secret";
      user = jwt.verify(token, secret) as CustomJwtPayload;
      console.log("User from token:", user);
    } catch (error) {
      console.error("Token invalid");
    }
  }

  return (
    // เปลี่ยนเป็นพื้นหลังสว่าง (Light Theme)
    <div className="bg-slate-50 flex items-center justify-center min-h-screen text-slate-800 font-sans p-6">
      <div className="text-center max-w-2xl mx-auto flex flex-col items-center">
        {/* รูปแบบ 404 แบบคลีนๆ ใช้สีฟ้า */}
        <h1 className="text-8xl sm:text-[150px] font-extrabold text-blue-600 mb-2 sm:mb-6 tracking-tighter drop-shadow-sm">
          404
        </h1>
        {/* หัวข้อ */}
        <h2 className="text-2xl sm:text-4xl font-bold mb-4 text-slate-900">
          โอ๊ะโอ! ไม่พบหน้าที่คุณค้นหา
        </h2>
        {/* คำอธิบาย */}
        <p className="text-base sm:text-lg text-slate-500 mb-10 max-w-lg leading-relaxed">
          ดูเหมือนว่าหน้าที่คุณพยายามเข้าถึงจะไม่มีอยู่จริง
          อาจจะถูกย้ายไปที่อื่น หรือลิงก์อาจจะเสียครับ
        </p>
        {/* ส่วนปุ่มกด: ปรับให้ใหญ่ขึ้นและกว้างขึ้น 
          - w-full sm:w-auto: ในมือถือเต็มจอ, ในจอใหญ่ปรับตามเนื้อหา
          - px-12 py-5: เพิ่ม Padding ทั้งแนวตั้งและแนวนอนให้ปุ่มดูอ้วนและใหญ่ขึ้น (ตรงตามที่คุณต้องการ)
          - text-lg: ตัวอักษรใหญ่ขึ้น
        */}
        {user?.role === "seeker" ? (
          <Link
            href="/user/user-home"
            className="w-full sm:w-auto inline-flex items-center justify-center px-12 py-5 text-lg font-bold text-white transition-all duration-200 bg-blue-600 rounded-xl hover:bg-blue-700 hover:shadow-lg hover:-translate-y-1 active:translate-y-0 active:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-200 group"
          >
            {/* ไอคอนบ้าน */}
            <svg
              className="w-6 h-6 mr-3 transition-transform group-hover:scale-110"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            กลับสู่หน้าหลัก
          </Link>
        ) : (
          <Link
            href="/company/company-home"
            className="w-full sm:w-auto inline-flex items-center justify-center px-12 py-5 text-lg font-bold text-white transition-all duration-200 bg-blue-600 rounded-xl hover:bg-blue-700 hover:shadow-lg hover:-translate-y-1 active:translate-y-0 active:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-200 group"
          >
            {/* ไอคอนบ้าน */}
            <svg
              className="w-6 h-6 mr-3 transition-transform group-hover:scale-110"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            กลับสู่หน้าหลัก
          </Link>
        )}
      </div>
    </div>
  );
}
