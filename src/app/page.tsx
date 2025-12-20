import Link from 'next/link';
import { FileText, Calendar, Plus, ChevronRight, LayoutDashboard, Settings } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Home() {
  return (
    <div className="space-y-8 py-8">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between px-4 max-w-5xl mx-auto">
        <div>
          <div className="flex items-center space-x-3">
            <LayoutDashboard className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          </div>
          <p className="text-slate-600 text-sm mt-1 ml-11">ようこそ、本日も業務を開始しましょう</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="p-2.5 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-all"
            title="設定"
          >
            <Settings className="w-5 h-5" />
          </Link>
          <Link
            href="/customers/new"
            className={cn(buttonVariants({ size: "lg" }), "rounded-full px-6 shadow-md hover:shadow-lg transition-all")}
          >
            <Plus className="w-5 h-5 mr-2" />
            顧客登録
          </Link>
        </div>
      </div>

      {/* Main Apps Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
        {/* Customer Notebook */}
        <Link
          href="/customer-notebook"
          className="group relative bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 p-8 shadow-sm hover:shadow-2xl hover:bg-white/90 hover:scale-[1.02] hover:ring-2 hover:ring-indigo-500/20 transition-all duration-300 overflow-hidden min-h-[260px]"
        >
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-500 transform group-hover:scale-110 origin-top-right">
            <FileText className="w-48 h-48 text-indigo-600" />
          </div>

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl flex items-center justify-center shadow-inner group-hover:shadow-indigo-200/50 transition-all">
                <FileText className="w-7 h-7 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 group-hover:text-indigo-700 transition-colors tracking-tight">
                Customer Notebook
              </h2>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed mb-8 flex-grow font-medium">
              顧客ごとの詳細なプロフィール、重要事項（Pinned Note）、対応履歴を一元管理。
            </p>

            <div className="flex items-center text-sm font-bold text-indigo-600 group-hover:translate-x-2 transition-transform bg-indigo-50/50 w-fit px-4 py-2 rounded-full border border-indigo-100/50 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-md">
              ノートを開く <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </Link>

        {/* Reservation Notebook */}
        <Link
          href="/reservation-v2"
          className="group relative bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 p-8 shadow-sm hover:shadow-2xl hover:bg-white/90 hover:scale-[1.02] hover:ring-2 hover:ring-emerald-500/20 transition-all duration-300 overflow-hidden min-h-[260px]"
        >
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-500 transform group-hover:scale-110 origin-top-right">
            <Calendar className="w-48 h-48 text-emerald-600" />
          </div>

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl flex items-center justify-center shadow-inner group-hover:shadow-emerald-200/50 transition-all">
                <Calendar className="w-7 h-7 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors tracking-tight">
                Reservation Notebook
              </h2>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed mb-8 flex-grow font-medium">
              日々の予約状況の確認、新規予約の追加、スケジュールの調整。
            </p>

            <div className="flex items-center text-sm font-bold text-emerald-600 group-hover:translate-x-2 transition-transform bg-emerald-50/50 w-fit px-4 py-2 rounded-full border border-emerald-100/50 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-md">
              予約表を開く <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
