import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import type { NextAuthConfig } from "next-auth";

// NextAuth設定を分離（middleware用）
export const authConfig: NextAuthConfig = {
    providers: [
        Credentials({
            name: "Staff Login",
            credentials: {
                loginId: { label: "ログインID", type: "text" },
                password: { label: "パスワード", type: "password" },
            },
            async authorize(credentials) {
                console.log('[Auth] authorize called with loginId:', credentials?.loginId);

                if (!credentials?.loginId || !credentials?.password) {
                    console.log('[Auth] Missing credentials');
                    return null;
                }

                const staff = await prisma.staff.findUnique({
                    where: { loginId: credentials.loginId as string },
                });

                console.log('[Auth] Staff found:', staff ? { id: staff.id, name: staff.name, active: staff.active, hasPasswordHash: !!staff.passwordHash } : 'null');

                if (!staff || !staff.passwordHash || !staff.active) {
                    console.log('[Auth] Staff invalid - staff:', !!staff, 'passwordHash:', !!staff?.passwordHash, 'active:', staff?.active);
                    return null;
                }

                const isValid = await bcrypt.compare(
                    credentials.password as string,
                    staff.passwordHash
                );

                console.log('[Auth] Password valid:', isValid);

                if (!isValid) {
                    return null;
                }

                return {
                    id: staff.id,
                    name: staff.name,
                    role: staff.role,
                };
            },
        }),
    ],
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

            // 認証無効モード
            if (process.env.NEXT_PUBLIC_AUTH_ENABLED === 'false') {
                return true;
            }

            // 静的ファイル、ログインページ、認証APIは常に許可
            if (isStaticFile || isOnLogin || isAuthEndpoint) {
                return true;
            }

            // ログイン済みならダッシュボードへ
            if (isLoggedIn) {
                return true;
            }

            // 未ログインはログインページへリダイレクト
            return false;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as { role?: string }).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                (session.user as { role?: string }).role = token.role as string;
            }
            return session;
        },
    },
    session: {
        strategy: "jwt",
    },
    trustHost: true,
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
