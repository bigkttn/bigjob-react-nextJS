import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
    const token = req.cookies.get("session")?.value;
    const path = req.nextUrl.pathname;
    const publicPaths = ['/login', '/register', '/forgotPassword','/user/user-detail-job','/company/seeker-profile'];
    const isPublicPath = path === '/' || publicPaths.some(p => path.startsWith(p));
    
    if (!token && !isPublicPath) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    // ฟังก์ชันช่วยถอดรหัส JWT (แบบไม่อิง Signature เพราะทำงานบน Edge Runtime)
    const getRoleFromToken = (token: string) => {
        try {
            const payloadBase64 = token.split('.')[1];
            const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
            const payloadJson = Buffer.from(base64, 'base64').toString();
            const payload = JSON.parse(payloadJson);
            return payload.role;
        } catch (e) {
            return null;
        }
    };

    if (token) {
        const role = getRoleFromToken(token);

        // ป้องกันหน้า Login / Register
        if (path === '/login' || path === '/register') {
            if (role === 'admin') return NextResponse.redirect(new URL('/admin/home', req.url));
            if (role === 'company') return NextResponse.redirect(new URL('/company/company-home', req.url));
            if (role === 'seeker' || role === 'user') return NextResponse.redirect(new URL('/user/user-home', req.url));
        }

        // การเช็ก Role สำหรับแต่ละ Path
        if (path.startsWith('/admin') && role !== 'admin') {
            return NextResponse.redirect(new URL('/', req.url));
        }
        
        // Admin สามารถเข้าถึงหน้าของ company และ user ได้ทุกหน้า
        if (path.startsWith('/company') && role !== 'company' && role !== 'admin') {
            return NextResponse.redirect(new URL('/', req.url));
        }
        if (path.startsWith('/user') && role !== 'seeker' && role !== 'user' && role !== 'admin' && !publicPaths.some(p => path.startsWith(p))) {
            return NextResponse.redirect(new URL('/', req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};