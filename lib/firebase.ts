import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// ค่า config อยู่ใน .env.local (ต้องขึ้นต้นด้วย NEXT_PUBLIC_ เพราะใช้ฝั่งเบราว์เซอร์)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ป้องกันการ Initialize ซ้ำซ้อนในโหมด Dev ของ Next.js (Fast Refresh)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// ตัวแปรสำหรับเรียกใช้ Storage คลาวด์
export const storage = getStorage(app);
