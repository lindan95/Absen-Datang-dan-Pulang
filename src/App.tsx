import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { TerminalScanner } from './components/TerminalScanner';
import { KpiStats } from './components/KpiStats';
import { ChartsSection } from './components/ChartsSection';
import { DetailAbsensiTable } from './components/DetailAbsensiTable';
import { RekapSiswaTable } from './components/RekapSiswaTable';
import { WAModal } from './components/WAModal';
import { IzinPulangModal } from './components/IzinPulangModal';
import { KeteranganModal } from './components/KeteranganModal';
import { StudentCardsModal } from './components/StudentCardsModal';
import { AdminPage } from './components/admin/AdminPage';
import { AdminLoginModal } from './components/admin/AdminLoginModal';

import {
  getTodayString,
  getDashboardData,
  loadStudents,
  catatAbsen,
  resetDatabaseToDefaults,
} from './data/database';
import {
  DashboardData,
  RecentScanLog,
  Siswa,
  StudentAbsenStatus,
} from './types';

export default function App() {
  const todayStr = getTodayString();
  const [activeDate, setActiveDate] = useState<string>(todayStr);
  const [isRealtime, setIsRealtime] = useState<boolean>(true);
  const [students, setStudents] = useState<Siswa[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [recentLogs, setRecentLogs] = useState<RecentScanLog[]>([]);

  // Navigation state: 'dashboard' vs 'admin'
  const [currentView, setCurrentView] = useState<'dashboard' | 'admin'>('dashboard');
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  // Modals state
  const [isWAModalOpen, setIsWAModalOpen] = useState(false);
  const [waFilterJenis, setWaFilterJenis] = useState<'ALFA' | 'BOLOS' | ''>('');
  const [keteranganTarget, setKeteranganTarget] = useState<{
    student: StudentAbsenStatus | null;
    initialStatus: 'SAKIT' | 'IZIN';
  }>({ student: null, initialStatus: 'SAKIT' });
  const [izinPulangTarget, setIzinPulangTarget] = useState<StudentAbsenStatus | null>(null);
  const [isCardsModalOpen, setIsCardsModalOpen] = useState(false);
  const [isMobileScannerOpen, setIsMobileScannerOpen] = useState(false);

  // Load and refresh dashboard data
  const refreshData = useCallback((targetDate?: string) => {
    const d = targetDate || activeDate;
    const data = getDashboardData(d);
    setDashboardData(data);
  }, [activeDate]);

  useEffect(() => {
    const s = loadStudents();
    setStudents(s);
    refreshData(todayStr);
  }, [refreshData, todayStr]);

  // Routine polling every 10 seconds in realtime mode
  useEffect(() => {
    const interval = setInterval(() => {
      if (isRealtime) {
        refreshData(todayStr);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [isRealtime, refreshData, todayStr]);

  // Date picker handler
  const handleDateChange = (newDate: string) => {
    if (!newDate) return;
    setActiveDate(newDate);
    const realtimeNow = newDate === todayStr;
    setIsRealtime(realtimeNow);
    refreshData(newDate);
  };

  const handleResetToToday = () => {
    setActiveDate(todayStr);
    setIsRealtime(true);
    refreshData(todayStr);
  };

  const handleResetDatabase = () => {
    resetDatabaseToDefaults();
    const fresh = loadStudents();
    setStudents(fresh);
    setRecentLogs([]);
    refreshData(todayStr);
  };

  // Open Admin Panel handler
  const handleOpenAdmin = () => {
    const isAuth = sessionStorage.getItem('SMAN5_ADMIN_AUTH') === 'true';
    if (isAuth) {
      setCurrentView('admin');
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  // Quick simulation scan from Card Modal
  const handleTestScan = (nis: string) => {
    catatAbsen(nis, 'DATANG');
    refreshData(activeDate);
  };

  // If in Admin view mode, render AdminPage
  if (currentView === 'admin') {
    return (
      <>
        <AdminPage
          onBackToApp={() => {
            setStudents(loadStudents());
            refreshData(activeDate);
            setCurrentView('dashboard');
          }}
          onLogoutAdmin={() => {
            sessionStorage.removeItem('SMAN5_ADMIN_AUTH');
            setStudents(loadStudents());
            refreshData(activeDate);
            setCurrentView('dashboard');
          }}
          onDataChanged={() => {
            setStudents(loadStudents());
            refreshData(activeDate);
          }}
          onOpenCards={() => setIsCardsModalOpen(true)}
        />

        <StudentCardsModal
          isOpen={isCardsModalOpen}
          onClose={() => setIsCardsModalOpen(false)}
          students={students}
          onTestScan={handleTestScan}
        />
      </>
    );
  }

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans select-none antialiased">
      {/* Top Header */}
      <Header
        activeDate={activeDate}
        isRealtime={isRealtime}
        onDateChange={handleDateChange}
        onResetToToday={handleResetToToday}
        onOpenStudentCards={() => setIsCardsModalOpen(true)}
        onResetDatabase={handleResetDatabase}
        onOpenAdmin={handleOpenAdmin}
        onOpenMobileScanner={() => setIsMobileScannerOpen(true)}
      />

      {/* Main Split Screen Layout */}
      <main className="max-w-[1700px] mx-auto px-4 py-4 w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* PANEL KIRI: TERMINAL ABSENSI KILAT (4/12) */}
        <section className="lg:col-span-4 flex flex-col">
          <TerminalScanner
            onScanSuccess={() => refreshData(activeDate)}
            recentLogs={recentLogs}
            setRecentLogs={setRecentLogs}
            students={students}
            isMobileModalOpen={isMobileScannerOpen}
            setIsMobileModalOpen={setIsMobileScannerOpen}
          />
        </section>

        {/* PANEL KANAN: DASHBOARD ANALITIK (8/12) */}
        <section className="lg:col-span-8 space-y-4 flex flex-col">
          {dashboardData && (
            <>
              {/* KPI STAT CARDS (10 Kolom) */}
              <KpiStats stats={dashboardData.stats} />

              {/* Middle Section: Siswa Terlambat & Charts */}
              <ChartsSection
                listTerlambat={dashboardData.listTerlambat}
                rekapKelas={dashboardData.rekapKelas}
                dailyTrend={dashboardData.dailyTrend}
              />

              {/* Table Detail Data Absensi */}
              <DetailAbsensiTable
                listSiswa={dashboardData.listSiswa}
                selectedDate={activeDate}
                onOpenKeterangan={(student, initialStatus) =>
                  setKeteranganTarget({ student, initialStatus })
                }
                onOpenIzinPulang={(student) => setIzinPulangTarget(student)}
                onOpenWABatch={(jenis) => {
                  setWaFilterJenis(jenis);
                  setIsWAModalOpen(true);
                }}
              />

              {/* Rekap Riwayat Per Siswa Table */}
              <RekapSiswaTable rekapSiswa={dashboardData.rekapSiswa} />
            </>
          )}
        </section>
      </main>

      {/* Modals */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={() => setCurrentView('admin')}
      />

      <WAModal
        isOpen={isWAModalOpen}
        onClose={() => setIsWAModalOpen(false)}
        selectedDate={activeDate}
        filterJenis={waFilterJenis}
      />

      <IzinPulangModal
        student={izinPulangTarget}
        onClose={() => setIzinPulangTarget(null)}
        onSuccess={() => refreshData(activeDate)}
      />

      <KeteranganModal
        student={keteranganTarget.student}
        initialStatus={keteranganTarget.initialStatus}
        selectedDate={activeDate}
        onClose={() => setKeteranganTarget({ student: null, initialStatus: 'SAKIT' })}
        onSuccess={() => refreshData(activeDate)}
      />

      <StudentCardsModal
        isOpen={isCardsModalOpen}
        onClose={() => setIsCardsModalOpen(false)}
        students={students}
        onTestScan={handleTestScan}
      />
    </div>
  );
}
