import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export default async function UserHome() {
  // 1. ดึง Cookie ที่ชื่อว่า 'session'
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  
  let user = null;

  // 2. ถ้ามี Token ให้ทำการถอดรหัส
  if (token) {
    try {
      const secret = process.env.JWT_SECRET || 'fallback_secret';
      user = jwt.verify(token, secret) as any;
    } catch (error) {
      console.error("Token หมดอายุหรือไม่ถูกต้อง");
    }
  }

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">ยินดีต้อนรับสู่หน้า Home!</h1>
      
      {/* 3. เช็คว่ามีข้อมูล User ไหม แล้วเอามาแสดงผล */}
      {user ? (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-semibold text-green-600">ล็อกอินสำเร็จ 🎉</h2>
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          {user.name && <p><strong>Name:</strong> {user.name}</p>}
        </div>
      ) : (
        <div className="mt-4 p-4 bg-red-100 rounded-lg text-red-600">
          <p>คุณยังไม่ได้เข้าสู่ระบบ หรือ Session หมดอายุ</p>
        </div>
      )}
    </div>
  );
}