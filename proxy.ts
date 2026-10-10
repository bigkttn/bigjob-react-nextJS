import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, isAdmin, verifySessionToken } from "@/lib/auth";

// หน้าที่เข้าได้โดยไม่ต้อง login
const PUBLIC_PAGES = [
  "/",
  "/login",
  "/register",
  "/forgotPassword",
  "/user/user-home",
  "/company/company-home",
];

// API ที่เรียกได้โดยไม่ต้อง login: ระบบ login/สมัคร และข้อมูลที่ 2 หน้า home ใช้
const PUBLIC_APIS = [
  "/api/auth/login",
  "/api/auth/google",
  "/api/auth/registerB",
  "/api/auth/registerGoogle",
  "/api/auth/request-otp",
  "/api/auth/verify-otp",
  "/api/auth/reset-password",
  "/api/auth/me",
  "/api/auth/logout",
  "/api/auth/refresh",
  "/api/posts/getallPosts",
  "/api/posts/UserSuggested",
  "/api/posts/CompanySuggested",
  "/api/posts/user-search-post",
  "/api/posts/company-search-user",
  "/api/user/getUserAndJobtitle",
  "/api/footer-stats",
  "/api/visitor",
];

// หน้าที่ login แล้วเข้าได้ทุก role (เช่น บริษัทเปิดดูรายละเอียดงาน)
const SHARED_PAGES = ["/user/user-detail-job"];

const isPublicPage = (path: string) => PUBLIC_PAGES.includes(path);
const isSharedPage = (path: string) =>
  SHARED_PAGES.some((p) => path.startsWith(p));
const isPublicApi = (path: string) => PUBLIC_APIS.includes(path);

function handleApi(path: string, req: NextRequest) {
  if (isPublicApi(path)) return NextResponse.next();

  const user = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!user) {
    return NextResponse.json(
      { message: "กรุณาเข้าสู่ระบบ" },
      { status: 401 },
    );
  }
  if (path.startsWith("/api/admin") && !isAdmin(user)) {
    return NextResponse.json({ message: "ไม่มีสิทธิ์" }, { status: 403 });
  }
  return NextResponse.next();
}

function handlePage(path: string, req: NextRequest) {
  const user = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);

  if (!user) {
    if (isPublicPage(path)) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = user.role;
  const admin = isAdmin(user);

  // login แล้วไม่ต้องเห็นหน้า Login / Register
  if (path === "/login" || path === "/register") {
    if (admin) return NextResponse.redirect(new URL("/admin/home", req.url));
    if (role === "company") {
      return NextResponse.redirect(new URL("/company/company-home", req.url));
    }
    return NextResponse.redirect(new URL("/user/user-home", req.url));
  }

  if (isSharedPage(path)) return NextResponse.next();

  // แยกพื้นที่ตาม role (admin เข้าได้ทุกหน้า)
  if (path.startsWith("/admin") && !admin) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (path.startsWith("/company") && role !== "company" && !admin) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  const isSeeker = role === "seeker" || role === "user";
  if (path.startsWith("/user") && !isSeeker && !admin) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

// ไฟล์ static ใน public (รูป, svg, ฟอนต์ ฯลฯ) ไม่ต้องตรวจ login
const STATIC_FILE = /\.[a-zA-Z0-9]+$/;

export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  // API ต้องผ่านการตรวจเสมอ แม้ path จะลงท้ายเหมือนไฟล์ (เช่น /api/x/1.json)
  // เพราะ MySQL แปลง '1.json' เป็นเลข 1 ให้เอง ถ้าข้ามไปจะหลุดการตรวจ login
  if (path.startsWith("/api/")) return handleApi(path, req);
  if (STATIC_FILE.test(path)) return NextResponse.next();
  return handlePage(path, req);
}

export const config = {
  // ข้ามเฉพาะไฟล์ระบบของ Next (ไฟล์ static อื่นกรองใน proxy() เพื่อไม่ให้ข้าม /api)
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
