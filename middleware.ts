import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    const session = req.cookies.get("session")?.value;
    const pathname = req.nextUrl.pathname;
    const publicPaths = ['/login', '/register', '/forgotPassword'];
    const isPublicPath = pathname === '/' || publicPaths.some(path => req.nextUrl.pathname.startsWith(path));
    if (!session && !isPublicPath) {
        return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)',],
};