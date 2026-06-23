import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyAk2I99JX5T7AR_E5Ex5sTEu5wxjmMTPrk",
    authDomain: "bigjobs-72ba5.firebaseapp.com",
    projectId: "bigjobs-72ba5",
    storageBucket: "bigjobs-72ba5.firebasestorage.app",
    messagingSenderId: "399284261906",
    appId: "1:399284261906:web:b5ef97eac4e36ab841f4cb"
};

// ป้องกันการ Initialize ซ้ำซ้อนในโหมด Dev ของ Next.js (Fast Refresh)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// ตัวแปรสำหรับเรียกใช้ Storage คลาวด์
export const storage = getStorage(app);