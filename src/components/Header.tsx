import { useEffect, useState } from 'react';
import { SchoolLogo } from './SchoolLogo';
import { RotateCcw, QrCode, Calendar, ShieldCheck, Camera } from 'lucide-react';

interface HeaderProps {
  activeDate: string;
  isRealtime: boolean;
  onDateChange: (date: string) => void;
  onResetToToday: () => void;
  onOpenStudentCards: () => void;
  onResetDatabase: () => void;
  onOpenAdmin: () => void;
  onOpenMobileScanner?: () => void;
}

export function Header({
  activeDate,
  isRealtime,
  onDateChange,
  onResetToToday,
  onOpenStudentCards,
  onResetDatabase,
  onOpenAdmin,
  onOpenMobileScanner,
}: HeaderProps) {
  const [liveClock, setLiveClock] = useState<string>('Memuat jam...');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveClock(
        now.toLocaleDateString('id-ID', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-[1700px] mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4">
        {/* Left branding */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center bg-slate-950 border border-slate-700 shadow-md p-1 shrink-0">
            <SchoolLogo />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-wide text-white leading-tight">
              TERMINAL & DASHBOARD ABSENSI SISWA
            </h1>
            <h2 className="text-sm sm:text-base font-extrabold tracking-wide text-sky-400 leading-tight">
              SMA NEGERI 05 BOMBANA
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span className="font-mono">{liveClock}</span>
              <span>•</span>
              <span className="text-amber-400 font-semibold">
                Data Tanggal: {activeDate || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Mode Badge & Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isRealtime ? (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Real-Time (Hari Ini)
            </div>
          ) : (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              Arsip Tanggal: {activeDate}
            </div>
          )}

          {/* Date Picker & Today */}
          <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800">
            <input
              type="date"
              value={activeDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-xs text-slate-200 px-2 py-1 focus:outline-none cursor-pointer"
              title="Pilih tanggal absensi"
            />
            <button
              type="button"
              onClick={onResetToToday}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg transition font-bold ml-1 cursor-pointer"
            >
              Hari Ini
            </button>
          </div>

          {/* Mobile Camera QR Scanner Button */}
          {onOpenMobileScanner && (
            <button
              type="button"
              onClick={onOpenMobileScanner}
              className="inline-flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl border border-emerald-500/30 transition font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
              title="Buka Scan QR dengan Kamera HP untuk Datang & Pulang"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scan Kamera HP</span>
            </button>
          )}

          {/* Quick Simulation / Student Cards Button */}
          <button
            type="button"
            onClick={onOpenStudentCards}
            className="inline-flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-sky-400 px-3 py-1.5 rounded-xl border border-slate-700 transition font-bold cursor-pointer"
            title="Buka daftar kartu siswa & tes scan cepat"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Kartu Siswa</span>
          </button>

          {/* Panel Admin Button */}
          <button
            type="button"
            onClick={onOpenAdmin}
            className="inline-flex items-center gap-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-xl transition font-black shadow-md shadow-amber-500/20 cursor-pointer"
            title="Buka Panel Administrator & Pengaturan"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Panel Admin</span>
          </button>

          {/* Reset Database Button */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset data absensi ke pengaturan awal default?')) {
                onResetDatabase();
              }
            }}
            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 transition cursor-pointer"
            title="Reset data demo"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
}
