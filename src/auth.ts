import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import { authConfig } from "./auth.config";

/**
 * 完全な NextAuth 設定
 * 
 * このファイルは API ルートで使用される。
 * Prisma や bcrypt などの Node.js 依存ライブラリを使用可能。
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            name: "Staff Login",
            credentials: {
                loginId: { label: "ログインID", type: "text" },
                password: { label: "パスワード", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.loginId || !credentials?.password) {
                    return null;
                }

                const staff = await prisma.staff.findUnique({
                    where: { loginId: credentials.loginId as string },
                });

                if (!staff || !staff.passwordHash || !staff.active) {
                    return null;
                }

                const isValid = await bcrypt.compare(
                    credentials.password as string,
                    staff.passwordHash
                );

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
    callbacks: {
        ...authConfig.callbacks,
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
});
