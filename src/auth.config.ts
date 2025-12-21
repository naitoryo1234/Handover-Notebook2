import type { NextAuthConfig } from "next-auth";

/**
 * エッジランタイム互換な NextAuth 設定
 * 
 * このファイルはミドルウェアで使用されるため、
 * Prisma や bcrypt などの Node.js 依存ライブラリをインポートしてはいけない。
 * 
 * 認証の実際のロジック（DB検索、パスワード照合）は auth.ts で行う。
 */
export const authConfig: NextAuthConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnLogin = nextUrl.pathname === '/login';
            const isAuthEndpoint = nextUrl.pathname.startsWith('/api/auth');
            const isStaticFile = nextUrl.pathname.startsWith('/_next') ||
                nextUrl.pathname.includes('.') ||
                nextUrl.pathname.startsWith('/favicon');

            // 認証無効モード（開発用）
            if (process.env.NEXT_PUBLIC_AUTH_ENABLED === 'false') {
                return true;
            }

            // 静的ファイル、ログインページ、認証APIは常に許可
            if (isStaticFile || isOnLogin || isAuthEndpoint) {
                return true;
            }

            // ログイン済みならアクセス許可
            if (isLoggedIn) {
                return true;
            }

            // 未ログインはログインページへリダイレクト
            return false;
        },
    },
    providers: [], // auth.ts で設定
    session: {
        strategy: "jwt",
    },
    trustHost: true,
};
