import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// 認証が無効化されているか確認
// NEXT_PUBLIC_AUTH_ENABLED=false で認証スキップ（開発用）
const isAuthDisabled = process.env.NEXT_PUBLIC_AUTH_ENABLED === "false";

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 静的ファイルは除外
    const isStaticFile =
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon") ||
        pathname.includes(".");

    if (isStaticFile) {
        return NextResponse.next();
    }

    // ログインページと認証APIは認証不要
    if (pathname === "/login" || pathname.startsWith("/api/auth")) {
        return NextResponse.next();
    }

    // 認証が無効の場合はすべて許可（開発モード）
    if (isAuthDisabled) {
        return NextResponse.next();
    }

    // JWTトークンを取得してセッションを確認
    const token = await getToken({
        req: request,
        secret: process.env.AUTH_SECRET,
    });

    // セッションがない場合はログインページへリダイレクト
    if (!token) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
