import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * エッジランタイム互換なミドルウェア
 * 
 * auth.config.ts のみをインポートし、Prisma/bcrypt を含まないため
 * Vercel Edge Runtime で正常に動作する。
 */
export default NextAuth(authConfig).auth;

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
