// lib/db.ts
import mysql from 'mysql2/promise';

const db = mysql.createPool({
    host: '202.28.34.210',
    port: 3309,
    user: '66011212075',
    password: '0934308887',
    database: 'db66011212075',

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