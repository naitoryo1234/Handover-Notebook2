'use client';

import { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MiniCalendarProps {
    currentDate: string;
    onDateSelect: (date: string) => void;
    highlightSelected?: boolean;
}

export function MiniCalendar({ currentDate, onDateSelect, highlightSelected = true }: MiniCalendarProps) {
    // 表示中の月（カレンダーのページ）
    // 初期値は選択中の日付の月、もしくは今日
    const selectedDate = parseISO(currentDate);
    const [viewDate, setViewDate] = useState(selectedDate);

    // カレンダーの期間計算
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const calendarStart = startOfWeek(monthStart); // 日曜始まり
    const calendarEnd = endOfWeek(monthEnd);

    const days = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd,
    });

    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

    // 月移動
    const prevMonth = () => setViewDate(subMonths(viewDate, 1));
    const nextMonth = () => setViewDate(addMonths(viewDate, 1));

    return (
        <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100 w-full max-w-[320px]">
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={prevMonth}
                    className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="font-bold text-slate-700">
                    {format(viewDate, 'yyyy年M月', { locale: ja })}
                </div>
                <button
                    onClick={nextMonth}
                    className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* 曜日ヘッダー */}
            <div className="grid grid-cols-7 mb-2">
                {weekDays.map(day => (
                    <div key={day} className="text-center text-xs text-slate-400 font-medium py-1">
                        {day}
                    </div>
                ))}
            </div>

            {/* 日付グリッド */}
            <div className="grid grid-cols-7 gap-y-2">
                {days.map((day, idx) => {
                    const isSelected = highlightSelected && isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, viewDate);
                    const isToday = isSameDay(day, new Date());

                    return (
                        <div key={idx} className="flex justify-center">
                            <button
                                onClick={() => onDateSelect(format(day, 'yyyy-MM-dd'))}
                                className={`
                                    w-8 h-8 flex items-center justify-center text-sm rounded-md transition-all
                                    ${isSelected
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'hover:bg-slate-100'
                                    }
                                    ${!isSelected && !isCurrentMonth ? 'text-slate-300' : ''}
                                    ${!isSelected && isCurrentMonth ? 'text-slate-700' : ''}
                                    ${!isSelected && isToday ? 'font-bold text-indigo-600' : ''}
                                `}
                            >
                                {format(day, 'd')}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
