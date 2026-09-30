// lib/db.ts
import mysql from 'mysql2/promise';

const db = mysql.createPool({
    host: process.env.DB_HOST ,
    port: Number(process.env.DB_PORT) ,
    user: process.env.DB_USER ,
    password: process.env.DB_PASSWORD ,
    database: process.env.DB_NAME ,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    // ส่งสัญญาณ TCP เป็นระยะ ไม่ให้เซิร์ฟเวอร์หรือไฟร์วอลล์มองว่าเงียบแล้วตัดทิ้ง
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,

    // ปล่อย connection ที่ว่างเกิน 1 นาทีทิ้งเอง ก่อนที่ฝั่งเซิร์ฟเวอร์จะตัด
    idleTimeout: 60000,
    // เก็บ connection ว่างไว้แค่ 2 เส้นพอ ลดโอกาสมีเส้นตายค้างในถัง
    maxIdle: 2,
});

export default db;