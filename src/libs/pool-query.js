import { Pool } from 'pg'
import dotenv from 'dotenv'
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // ถ้ารันแล้วเจอปัญหา certificate บนบาง environment ให้ใช้ rejectUnauthorized:false
    // แต่การตั้งนี้จะลดการตรวจสอบใบรับรอง — ระวังความปลอดภัยใน production
    ssl: { rejectUnauthorized: false },
    // ปรับ pool ให้เหมาะกับ Neon (ปริมาณการเชื่อมต่อต่ำ)
    max: 5,               // ปรับให้ไม่มากเกินไป (serverless/DB ที่แชร์)
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
    console.error('Unexpected idle client error', err);
});

export const query = async (sql, params = []) => {
  const res = await pool.query(sql, params)
  return res
};