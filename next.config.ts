import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ให้มือถือในวง Wi-Fi เดียวกันเปิด dev server ผ่าน IP ได้ (มีผลเฉพาะตอน npm run dev)
  allowedDevOrigins: ["192.168.*.*"],
};

export default nextConfig;
