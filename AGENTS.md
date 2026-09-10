<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md

## Project Overview
โปรเจกต์นี้เป็นเว็บแอปพลิเคชันจัดหางานและจับคู่งาน (BigJobs) พัฒนาด้วย Next.js 16 (App Router), React 19, TypeScript, MySQL (mysql2/promise), Firebase Storage, Leaflet Map และ Xenova Transformers สำหรับทำระบบ AI Vector Search

## Commands
- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Run lint: `npm run lint`
- Run type check: `npx tsc --noEmit`
- Run build: `npm run build`

## Project Structure
- `app/` ใช้สำหรับ Page Routes และ API Handlers (`route.ts`) ตามสถาปัตยกรรม Next.js App Router
  - `app/api/` สำหรับ Backend API endpoints ทั้งหมด (Admin, Auth, Company, Seeker, Posts)
  - `app/admin/` หน้าจัดการระบบและรายงานสำหรับ Admin
  - `app/company/` หน้าจัดการสำหรับฝั่งผู้ประกอบการ (Post Job, Tracking, Profiles)
  - `app/user/` หน้าค้นหางาน สมัครงาน และจัดการข้อมูลส่วนตัวของผู้สมัคร
- `components/` ใช้เก็บ UI Components ส่วนกลาง เช่น `Navbar.tsx`, `footer.tsx`, `ApplyModal.tsx` และ `LeafletMap.tsx`
- `lib/` ใช้เก็บ Utility Functions, Database Connection Pool (`db.ts`), Session Handler (`session.ts`), Firebase Config (`firebase.ts`) และ AI Vectors (`vectorSimilarity.ts`)
- `public/` ใช้เก็บ Static Assets ไฟล์ SVG และรูปภาพพื้นหลัง

## Code Style
- ใช้ TypeScript เท่านั้น และกำหนด Type ให้ชัดเจน (หลีกเลี่ยงการใช้ `any`)
- ตั้งชื่อ Component เป็น **PascalCase** (เช่น `AdminCompanyDetail.tsx`, `LeafletMap.tsx`)
- ตั้งชื่อฟังก์ชันและตัวแปรทั่วไปเป็น **camelCase**
- การจัดสไตล์หลักให้ใช้ **CSS Modules (`*.module.css`)** ประจำแต่ละคอมโพเนนต์ เพื่อคุมสโคปคลาสไม่ให้ตีกัน
- หลีกเลี่ยงการเขียน Logic หรือ State ใหญ่ๆ รวมไว้ใน Component เดียว ให้แยกเป็น Custom Hook หรือ Subcomponent
- **Next.js 16 Async Rules:** พารามิเตอร์ `params` และ `searchParams` ใน Page และ Route Handler มีสถานะเป็น `Promise` เสมอ ต้องใช้ `const { id } = await params;` หรือใส่ Type `{ params: Promise<{ id: string }> }`
- **React 19 Hooks Rules:** ห้ามเรียก `setState` แบบ Synchronous ภายในรูทของ `useEffect` เพื่อป้องกันปัญหา Cascading Re-render และ ESLint Warning
- **Leaflet & Window Check:** Leaflet ใช้งาน `window` ซึ่งรันฝั่ง Server ไม่ได้ ทุกคอมโพเนนต์ที่มีการเรียกใช้แผนที่ต้องโหลดผ่าน `dynamic(() => import(...), { ssr: false })` และมี `'use client'` กำกับเสมอ

## Testing and Validation
ก่อนส่งมอบงานหรือสรุปผลทุกครั้ง ต้องตรวจสอบคำสั่งต่อไปนี้ให้ผ่าน:
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

## Boundaries
- ห้ามแก้ไข Database Schema หรือตาราง MySQL โดยไม่มีการอธิบายเหตุผลและยืนยันก่อน
- ห้ามลบไฟล์สำคัญหรือฟังก์ชัน API ที่มีการเชื่อมต่อระหว่าง Client-Server อยู่แล้ว
- ห้ามส่งข้อมูลความลับ เช่น `password` หรือ `company_password` ผ่าน API Response กลับไปยังฝั่ง Frontend
- ใช้ `npm` เป็น Package Manager หลักตัวเดียวเท่านั้น (ห้ามสลับไปใช้ `pnpm` หรือ `yarn`)
- ถ้าไม่แน่ใจเรื่อง Data Flow หรือโครงสร้าง ให้ถามหรือเสนอ Plan ให้ตรวจสอบก่อนลงมือแก้ไขจริง