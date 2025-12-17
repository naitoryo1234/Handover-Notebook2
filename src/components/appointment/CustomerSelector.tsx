import { useState, useEffect, useRef } from 'react';
import { Search, X, Check, User } from 'lucide-react';

interface Patient {
    id: string;
    name: string;
    kana: string;
    pId: number;
}

interface CustomerSelectorProps {
    patients: Patient[];
    selectedPatientId: string;
    onSelect: (patientId: string) => void;
}

export function CustomerSelector({ patients, selectedPatientId, onSelect }: CustomerSelectorProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedPatient = patients.find(p => p.id === selectedPatientId);

    // 選択されたら検索クエリをリセットし、メニューを閉じる
    // ただし、selectedPatientが変わったタイミングではなく、選択操作時に行う

    // クリック外で閉じる
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredPatients = patients.filter(p =>
        p.name.includes(searchQuery) ||
        p.kana.includes(searchQuery) ||
        p.pId.toString().includes(searchQuery)
    );

    const handleSelect = (patient: Patient) => {
        onSelect(patient.id);
        setIsOpen(false);
        setSearchQuery('');
    };

    const handleClear = () => {
        onSelect('');
        setSearchQuery('');
        setIsOpen(true); // Clearing allows searching again
    };

    if (selectedPatient) {
        return (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 p-2 rounded-lg">
                        <Check className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                                No.{selectedPatient.pId}
                            </span>
                            <span className="text-xs text-emerald-600">選択済み</span>
                        </div>
                        <div className="font-bold text-slate-800 text-lg">
                            {selectedPatient.name}
                        </div>
                        <div className="text-sm text-slate-500">
                            {selectedPatient.kana}
                        </div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleClear}
                    className="text-slate-400 hover:text-slate-600 p-2 hover:bg-emerald-100/50 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
                {/* Hidden input for form submission */}
                <input type="hidden" name="patientId" value={selectedPatient.id} />
            </div>
        );
    }

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="名前、カナ、No.で検索..."
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 focus:bg-white transition-colors"
                />
            </div>

            {isOpen && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {filteredPatients.length > 0 ? (
                        <ul className="divide-y divide-slate-50">
                            {filteredPatients.slice(0, 50).map((patient) => (
                                <li key={patient.id}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelect(patient)}
                                        className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="font-medium text-slate-800 flex items-center gap-2">
                                                {patient.name}
                                                <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                                    No.{patient.pId}
                                                </span>
                                            </p>
                                            <p className="text-xs text-slate-500">{patient.kana}</p>
                                        </div>
                                        <User className="w-4 h-4 text-slate-300" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-4 text-center text-slate-500 text-sm">
                            見つかりませんでした
                        </div>
                    )}
                </div>
            )}

            {/* Fallback hidden input ensuring form submission fails if nothing selected handled by parent or required logic */}
            <input type="hidden" name="patientId" value="" />
        </div>
    );
}
