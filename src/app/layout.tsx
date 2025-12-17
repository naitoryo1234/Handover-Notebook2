import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { Toaster } from 'sonner';
import { GlobalNavigation } from '@/components/GlobalNavigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Business Notebook',
  description: '顧客管理と予約管理のためのシンプルなノートブック',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="h-full">
      <body className={`${inter.className} h-full bg-mesh-gradient text-slate-900`}>
        <div className="h-full flex flex-col">
          {/* ガラスモーフィズムヘッダー */}
          <header className="sticky top-0 z-50 flex-none glass-header transition-all duration-300 isolate">
            <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
              <Link
                href="/"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
              >
                <div className="flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-indigo-50 text-indigo-600 p-1.5 shadow-sm ring-1 ring-indigo-100 group-hover:scale-105 transition-transform duration-200">
                  <span className="text-lg lg:text-2xl">📓</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg lg:text-2xl tracking-tight text-slate-900 leading-none">
                    <span className="font-medium text-slate-700">Business</span>
                    <span className="font-extrabold text-slate-900 ml-1">Notebook</span>
                  </span>
                </div>
              </Link>
              <GlobalNavigation />
            </div>
          </header>

          {/* メインコンテンツ */}
          <main className="flex-1 overflow-y-auto relative z-0">
            <div className="max-w-7xl mx-auto px-6 py-8">
              {children}
            </div>
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
