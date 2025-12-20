import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { Toaster } from 'sonner';
import { GlobalNavigation } from '@/components/GlobalNavigation';
import { AuthProvider } from '@/components/auth/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Business Notebook',
  description: '顧客管理と予約管理のためのシンプルなノートブック',
};

export const dynamic = 'force-dynamic';

import { ToastProvider } from '@/components/ui/Toast';
import { ClientHeader } from '@/components/layout/ClientHeader';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="min-h-dvh">
      <body className={`${inter.className} min-h-dvh bg-mesh-gradient text-slate-900`}>
        <AuthProvider>
          <ToastProvider>
            <div className="h-full flex flex-col">
              {/* ガラスモーフィズムヘッダー (Client Componentで制御) */}
              <ClientHeader />

              {/* メインコンテンツ */}
              <main className="flex-1 overflow-hidden relative">
                <div className="h-full">
                  {children}
                </div>
              </main>
            </div>
            <Toaster />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
