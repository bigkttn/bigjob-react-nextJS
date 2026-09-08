export async function register() {
  // ยึดแนวทาง Lazy Load: ไม่ทำการ warmup โมเดลล่วงหน้าขณะเริ่มต้น instance
  // เพื่อป้องกันปัญหา Cold Start ช้าลงบน Serverless Environments
}