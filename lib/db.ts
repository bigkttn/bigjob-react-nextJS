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
    queueLimit: 0
});

export default db;