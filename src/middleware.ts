import { auth } from "@/auth";

// NextAuth.js v5の推奨パターン
// auth.tsの authorized コールバックでルート保護を処理
export default auth;

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
