import { useState } from 'react';
import { AdminStudentsTab } from './AdminStudentsTab';
import { AdminKeteranganTab } from './AdminKeteranganTab';
import { AdminAbsensiLogTab } from './AdminAbsensiLogTab';
import { AdminLogWATab } from './AdminLogWATab';
import { AdminSettingsTab } from './AdminSettingsTab';
import { AdminBackupTab } from './AdminBackupTab';
import { AdminPrintModal } from './AdminPrintModal';
import {
  Users,
  ClipboardList,
  FileSpreadsheet,
  MessageCircle,
  Settings,
  Database,
  ArrowLeft,
  Lock,
  GraduationCap,
  ShieldCheck,
  LayoutDashboard,
  Printer,
} from 'lucide-react';

export type AdminTabType =
  | 'students'
  | 'keterangan'
  | 'absen_log'
  | 'log_wa'
  | 'settings'
  | 'backup';

interface AdminPageProps {
  onBackToApp: () => void;
  onLogoutAdmin: () => void;
  onDataChanged: () => void;
  onOpenCards: () => void;
}

export function AdminPage({
  onBackToApp,
  onLogoutAdmin,
  onDataChanged,
  onOpenCards,
}: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<AdminTabType>('students');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const tabs: { id: AdminTabType; label: string; icon: any; badge?: string }[] = [
    { id: 'students', label: 'Master Data Siswa', icon: Users },
    { id: 'keterangan', label: 'Sakit & Izin', icon: ClipboardList },
    { id: 'absen_log', label: 'Log Scan Realtime', icon: FileSpreadsheet },
    { id: 'log_wa', label: 'Log Notifikasi WA', icon: MessageCircle },
    { id: 'settings', label: 'Pengaturan Sistem', icon: Settings },
    { id: 'backup', label: 'Cadangkan & Pulihkan', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Branding & Back button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition border border-slate-700/60 cursor-pointer shadow-sm"
              title="Kembali ke Dashboard Absensi"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Kembali ke Dashboard</span>
            </button>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-amber-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
                  <span>PANEL ADMINISTRATOR</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    AUTH LEVEL 1
                  </span>
                </h1>
                <p className="text-[10px] text-slate-400">
                  SMA Negeri 05 Bombana • Konfigurasi & Manajemen Data
                </p>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/25 cursor-pointer"
              title="Cetak Laporan & Unduh PDF Resmi Sekolah"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / PDF</span>
            </button>

            <button
              type="button"
              onClick={onBackToApp}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/25 cursor-pointer"
              title="Buka Halaman Dashboard Absensi"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Halaman Dashboard</span>
            </button>

            <button
              type="button"
              onClick={onLogoutAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold transition border border-rose-500/30 cursor-pointer"
              title="Kunci sesi admin"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kunci Sesi</span>
            </button>
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto no-scrollbar gap-1 border-t border-slate-800/60 items-center">
          <button
            type="button"
            onClick={onBackToApp}
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-600 transition cursor-pointer shrink-0 rounded-xl my-1 border border-indigo-500/20"
            title="Buka Halaman Dashboard"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-600 transition cursor-pointer shrink-0 rounded-xl my-1 border border-emerald-500/20"
            title="Pusat Cetak Laporan & Unduh PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak / PDF</span>
          </button>

          <div className="w-px h-5 bg-slate-800 mx-1 shrink-0" />
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Admin Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'students' && (
          <AdminStudentsTab onDataChanged={onDataChanged} onOpenCards={onOpenCards} />
        )}
        {activeTab === 'keterangan' && <AdminKeteranganTab onDataChanged={onDataChanged} />}
        {activeTab === 'absen_log' && <AdminAbsensiLogTab onDataChanged={onDataChanged} />}
        {activeTab === 'log_wa' && <AdminLogWATab onDataChanged={onDataChanged} />}
        {activeTab === 'settings' && <AdminSettingsTab onSettingsSaved={onDataChanged} />}
        {activeTab === 'backup' && <AdminBackupTab onDatabaseRestored={onDataChanged} />}
      </main>

      {/* Admin Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 text-center text-[11px] text-slate-600">
        Panel Administrator Sistem Absensi QR Code • SMAN 05 Bombana • Didukung LocalStorage Engine
      </footer>

      {/* Admin Print & PDF Modal */}
      <AdminPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onOpenCards={onOpenCards}
      />
    </div>
  );
}
