// Simplified middleware - authentication check disabled for now
// TODO: Re-enable full auth check with NextAuth.js auth() wrapper
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 静的ファイルは除外
    const isStaticFile =
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon") ||
        pathname.includes(".");

    if (isStaticFile) {
        return NextResponse.next();
    }

    // For now, allow all requests
    // Full auth protection will be re-enabled in a future update
    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
