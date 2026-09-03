import { useState, useEffect } from 'react';
import {
  GasDatabaseConfig,
  GasSyncLog,
} from '../../types';
import {
  loadGasConfig,
  saveGasConfig,
  testGasConnection,
  pushAllDataToGas,
  pushTodayAbsenToGas,
  pullStudentsFromGas,
  OFFICIAL_GAS_SCRIPT_TEMPLATE,
} from '../../data/gasDatabase';
import {
  loadStudents,
  loadAbsenRecords,
  loadKeteranganRecords,
  loadLogWARecords,
  getTodayString,
} from '../../data/database';
import {
  Cloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  ExternalLink,
  Copy,
  Check,
  Zap,
  Code2,
  BookOpen,
  History,
  ShieldCheck,
  Layers,
  Save,
  Radio,
} from 'lucide-react';

interface AdminGasTabProps {
  onDataChanged: () => void;
}

export function AdminGasTab({ onDataChanged }: AdminGasTabProps) {
  const [config, setConfig] = useState<GasDatabaseConfig>(() => loadGasConfig());
  const [webAppUrlInput, setWebAppUrlInput] = useState('');
  const [spreadsheetUrlInput, setSpreadsheetUrlInput] = useState('');
  const [autoSyncScan, setAutoSyncScan] = useState(false);
  const [autoSyncKeterangan, setAutoSyncKeterangan] = useState(false);

  const [isTesting, setIsTesting] = useState(false);
  const [isPushingAll, setIsPushingAll] = useState(false);
  const [isPushingToday, setIsPushingToday] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const [toastMsg, setToastMsg] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'sync' | 'script' | 'guide' | 'logs'>(
    'config'
  );

  // Stats
  const studentCount = loadStudents().length;
  const absenCount = loadAbsenRecords().length;
  const ketCount = loadKeteranganRecords().length;
  const logWaCount = loadLogWARecords().length;

  useEffect(() => {
    const loaded = loadGasConfig();
    setConfig(loaded);
    setWebAppUrlInput(loaded.webAppUrl || '');
    setSpreadsheetUrlInput(loaded.spreadsheetUrl || '');
    setAutoSyncScan(Boolean(loaded.autoSyncOnScan));
    setAutoSyncKeterangan(Boolean(loaded.autoSyncOnKeterangan));
  }, []);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 5000);
  };

  const handleSaveConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated: GasDatabaseConfig = {
      ...config,
      webAppUrl: webAppUrlInput.trim(),
      spreadsheetUrl: spreadsheetUrlInput.trim(),
      autoSyncOnScan: autoSyncScan,
      autoSyncOnKeterangan: autoSyncKeterangan,
    };
    saveGasConfig(updated);
    setConfig(updated);
    showToast('success', 'Konfigurasi Google Apps Script berhasil disimpan.');
  };

  const handleTestConnection = async () => {
    if (!webAppUrlInput.trim()) {
      showToast('error', 'Masukkan URL Web App Google Apps Script terlebih dahulu!');
      return;
    }
    setIsTesting(true);
    const res = await testGasConnection(webAppUrlInput.trim());
    setIsTesting(false);

    if (res.success) {
      const updatedConfig: GasDatabaseConfig = {
        ...config,
        webAppUrl: webAppUrlInput.trim(),
        spreadsheetUrl: res.data?.spreadsheetUrl || spreadsheetUrlInput.trim(),
        lastSyncStatus: 'SUCCESS',
        lastSyncTime: new Date().toLocaleString('id-ID'),
        lastSyncMessage: res.message,
      };
      if (res.data?.spreadsheetUrl && !spreadsheetUrlInput.trim()) {
        setSpreadsheetUrlInput(res.data.spreadsheetUrl);
      }
      saveGasConfig(updatedConfig);
      setConfig(loadGasConfig());
      showToast('success', res.message);
    } else {
      const updatedConfig: GasDatabaseConfig = {
        ...config,
        webAppUrl: webAppUrlInput.trim(),
        lastSyncStatus: 'ERROR',
        lastSyncTime: new Date().toLocaleString('id-ID'),
        lastSyncMessage: res.message,
      };
      saveGasConfig(updatedConfig);
      setConfig(loadGasConfig());
      showToast('error', res.message);
    }
  };

  const handlePushAll = async () => {
    if (!config.webAppUrl && !webAppUrlInput.trim()) {
      showToast('error', 'URL Web App GAS belum dikonfigurasi!');
      return;
    }

    if (
      !window.confirm(
        `Kirim seluruh data (${studentCount} siswa, ${absenCount} absensi, ${ketCount} keterangan) ke Google Sheets?`
      )
    ) {
      return;
    }

    setIsPushingAll(true);
    const res = await pushAllDataToGas(webAppUrlInput.trim());
    setIsPushingAll(false);

    setConfig(loadGasConfig());
    if (res.success) {
      showToast('success', res.message);
    } else {
      showToast('error', res.message);
    }
  };

  const handlePushToday = async () => {
    if (!config.webAppUrl && !webAppUrlInput.trim()) {
      showToast('error', 'URL Web App GAS belum dikonfigurasi!');
      return;
    }

    setIsPushingToday(true);
    const res = await pushTodayAbsenToGas(getTodayString());
    setIsPushingToday(false);

    setConfig(loadGasConfig());
    if (res.success) {
      showToast('success', res.message);
    } else {
      showToast('error', res.message);
    }
  };

  const handlePullStudents = async () => {
    if (!config.webAppUrl && !webAppUrlInput.trim()) {
      showToast('error', 'URL Web App GAS belum dikonfigurasi!');
      return;
    }

    if (
      !window.confirm(
        'Tarik data siswa dari sheet "Data_Siswa" di Google Sheets? Data siswa lokal akan diperbarui.'
      )
    ) {
      return;
    }

    setIsPulling(true);
    const res = await pullStudentsFromGas();
    setIsPulling(false);

    setConfig(loadGasConfig());
    if (res.success) {
      showToast('success', res.message);
      onDataChanged();
    } else {
      showToast('error', res.message);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(OFFICIAL_GAS_SCRIPT_TEMPLATE);
    setIsCodeCopied(true);
    showToast('info', 'Kode script Google Apps Script berhasil disalin ke clipboard!');
    setTimeout(() => setIsCodeCopied(false), 3000);
  };

  const isConnected =
    Boolean(config.webAppUrl) &&
    config.lastSyncStatus === 'SUCCESS';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 border shadow-lg animate-in slide-in-from-top-2 duration-200 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : toastMsg.type === 'error'
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toastMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            ) : toastMsg.type === 'error' ? (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            ) : (
              <Zap className="w-5 h-5 shrink-0 text-indigo-400" />
            )}
            <span>{toastMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-xs text-slate-400 hover:text-white cursor-pointer px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero Card: Status Koneksi Google Apps Script */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 rounded-3xl border border-indigo-500/25 p-6 sm:p-7 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                    DATABASE GOOGLE APPS SCRIPT (GAS)
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      isConnected
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : config.webAppUrl
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isConnected
                          ? 'bg-emerald-400 animate-pulse'
                          : config.webAppUrl
                          ? 'bg-amber-400'
                          : 'bg-slate-500'
                      }`}
                    />
                    {isConnected
                      ? 'Terhubung ke Google Sheets'
                      : config.webAppUrl
                      ? 'Perlu Uji Koneksi'
                      : 'Belum Dikonfigurasi'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sinkronisasi cloud gratis dua arah antara aplikasi absensi sekolah & Google Spreadsheet.
                </p>
              </div>
            </div>

            {/* Quick Status Info */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">Terakhir Sinkron:</span>
                <span className="font-mono text-slate-300 font-medium">
                  {config.lastSyncTime || 'Belum pernah'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">Auto-Sync Scan:</span>
                <span
                  className={`font-bold ${
                    config.autoSyncOnScan ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {config.autoSyncOnScan ? 'AKTIF (Otomatis)' : 'Nonaktif'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {config.spreadsheetUrl && (
              <a
                href={config.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20 cursor-pointer"
                title="Buka Google Sheets di tab baru"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Buka Spreadsheet</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            )}

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !webAppUrlInput.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Kirim ping untuk menguji endpoint GAS"
            >
              <Radio className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Menguji...' : 'Uji Koneksi (Ping)'}</span>
            </button>
          </div>
        </div>

        {/* Mini stats counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/70">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Master Siswa</span>
            <span className="text-base font-black text-white">{studentCount} Siswa</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/70">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Log Absensi</span>
            <span className="text-base font-black text-emerald-400">{absenCount} Record</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/70">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Sakit / Izin</span>
            <span className="text-base font-black text-amber-400">{ketCount} Catatan</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/70">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Log Pesan WA</span>
            <span className="text-base font-black text-cyan-400">{logWaCount} Log</span>
          </div>
        </div>
      </div>

      {/* Internal Navigation Sub-tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto gap-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSubTab('config')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeSubTab === 'config'
              ? 'border-indigo-400 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Pengaturan & URL Web App</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('sync')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeSubTab === 'sync'
              ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Pusat Sinkronisasi (Push / Pull)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('script')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeSubTab === 'script'
              ? 'border-amber-400 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Kode Script (Code.gs)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('guide')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeSubTab === 'guide'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Panduan Deployment (Tutorial)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('logs')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeSubTab === 'logs'
              ? 'border-purple-400 text-purple-400 bg-purple-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat Log Sinkronisasi</span>
        </button>
      </div>

      {/* SUB-TAB 1: KONFIGURASI URL & OPTIONS */}
      {activeSubTab === 'config' && (
        <form onSubmit={handleSaveConfig} className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Cloud className="w-4 h-4 text-indigo-400" />
                <span>Konfigurasi Endpoint Google Apps Script</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Masukkan URL Aplikasi Web (Web App) yang diperoleh setelah melakukan deploy script Google Apps Script di Google Spreadsheet.
              </p>
            </div>

            {/* Input URL Web App */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                URL Web App Google Apps Script (Wajib berakhiran <code className="text-indigo-400 font-mono">/exec</code>)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={webAppUrlInput}
                  onChange={(e) => setWebAppUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 transition"
                  required
                />
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !webAppUrlInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Radio className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-indigo-400' : ''}`} />
                  <span>{isTesting ? 'Menguji...' : 'Uji Ping'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Pastikan deployment Google Apps Script diatur dengan akses <span className="text-amber-400 font-semibold">"Anyone" (Siapa saja)</span> agar aplikasi dapat terhubung tanpa login akun.
              </p>
            </div>

            {/* Input URL Spreadsheet */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Link Spreadsheet Google (Opsional - Untuk Akses Cepat Guru & Admin)
              </label>
              <input
                type="url"
                value={spreadsheetUrlInput}
                onChange={(e) => setSpreadsheetUrlInput(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1A2B3C.../edit"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 transition"
              />
              <p className="text-[11px] text-slate-500">
                Menyimpan tautan file Google Sheets memudahkan administrator membuka rekapan langsung dari panel ini.
              </p>
            </div>

            {/* Opsi Auto Sync */}
            <div className="pt-3 border-t border-slate-800/80 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Otomatisasi Sinkronisasi Realtime
              </h4>

              <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={autoSyncScan}
                  onChange={(e) => setAutoSyncScan(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block">
                    Auto-Sync Pemindaian QR (Realtime Scan)
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Kirim data ke Google Sheets di latar belakang secara otomatis setiap kali ada siswa yang scan datang, scan pulang, atau izin pulang. Scanner tetap berjalan cepat tanpa jeda.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={autoSyncKeterangan}
                  onChange={(e) => setAutoSyncKeterangan(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block">
                    Auto-Sync Catatan Sakit & Izin
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Otomatis kirim catatan keterangan sakit/izin yang dimasukkan oleh guru piket ke sheet "Keterangan_Sakit_Izin".
                  </p>
                </div>
              </label>
            </div>

            {/* Tombol Simpan */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition shadow-lg shadow-indigo-600/25 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Konfigurasi GAS</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* SUB-TAB 2: PUSAT SINKRONISASI (PUSH / PULL) */}
      {activeSubTab === 'sync' && (
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                <span>Aksi Sinkronisasi Data Dua Arah</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Lakukan sinkronisasi menyeluruh atau per hari antara database aplikasi absensi lokal dan Google Spreadsheet.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Push All Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-black text-white">
                    Unggah Semua Data (Push All)
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Kirim seluruh tabel ({studentCount} siswa, {absenCount} absensi, {ketCount} izin/sakit, log WA & pengaturan) ke Google Sheets sekaligus.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePushAll}
                  disabled={isPushingAll}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className={`w-4 h-4 ${isPushingAll ? 'animate-bounce' : ''}`} />
                  <span>{isPushingAll ? 'Mengunggah...' : 'Ekspor Semua ke Sheets'}</span>
                </button>
              </div>

              {/* Push Today Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-black text-white">
                    Sinkron Hari Ini Saja
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Sinkronisasi cepat untuk catatan absensi dan keterangan pada hari aktif ({getTodayString()}) tanpa mengirim data bulan lalu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePushToday}
                  disabled={isPushingToday}
                  className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center justify-center gap-1.5 transition shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isPushingToday ? 'animate-spin' : ''}`} />
                  <span>{isPushingToday ? 'Menyinkronkan...' : 'Kirim Absensi Hari Ini'}</span>
                </button>
              </div>

              {/* Pull Students Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <DownloadCloud className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-black text-white">
                    Tarik Siswa dari Spreadsheet (Pull)
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Impor master siswa dari sheet "Data_Siswa" di Google Sheets ke penyimpanan lokal jika guru mengedit data langsung di Spreadsheet.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePullStudents}
                  disabled={isPulling}
                  className="w-full py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black flex items-center justify-center gap-1.5 transition shadow-lg shadow-cyan-600/20 cursor-pointer disabled:opacity-50"
                >
                  <DownloadCloud className={`w-4 h-4 ${isPulling ? 'animate-bounce' : ''}`} />
                  <span>{isPulling ? 'Mengimpor...' : 'Tarik Data Siswa'}</span>
                </button>
              </div>
            </div>

            {/* Struktur Sheet Info Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
              <h5 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Daftar Lembar Kerja (Sheet) yang Dikelola Otomatis di Google Spreadsheet:</span>
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px] text-slate-400 pt-1">
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                  <span className="font-bold text-indigo-300 block">1. Data_Siswa</span>
                  NISN, Nama Siswa, Kelas, No. HP Orang Tua, Status Notifikasi WA.
                </div>
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                  <span className="font-bold text-emerald-300 block">2. Log_Absensi</span>
                  ID Transaksi, Tanggal, Jam Datang, Jam Pulang, NISN, Nama, Kelas, Status.
                </div>
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                  <span className="font-bold text-amber-300 block">3. Keterangan_Sakit_Izin</span>
                  Tanggal, NISN, Nama, Kelas, Keterangan, Catatan, Dicatat Oleh.
                </div>
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                  <span className="font-bold text-cyan-300 block">4. Log_WhatsApp</span>
                  Tanggal, Jam, NISN, Nama, Kelas, Kategori Event, Status Pengiriman.
                </div>
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                  <span className="font-bold text-purple-300 block">5. Pengaturan_Sekolah</span>
                  Identitas SMAN 5 Bombana, Batas Jam Masuk & Pulang.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: KODE SCRIPT (Code.gs) */}
      {activeSubTab === 'script' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-amber-400" />
                  <span>Kode Google Apps Script Resmi (Code.gs)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Salin seluruh kode JavaScript ini dan tempelkan ke editor Apps Script pada Google Sheets sekolah Anda.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyScript}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow-md shadow-amber-500/20 cursor-pointer shrink-0"
              >
                {isCodeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{isCodeCopied ? 'Kode Tersalin!' : 'Salin Kode Script'}</span>
              </button>
            </div>

            {/* Code Box */}
            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
              <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono font-bold text-slate-300">Code.gs</span>
                <span>Google Apps Script V8 Engine</span>
              </div>
              <pre className="p-4 text-xs font-mono text-indigo-300 overflow-x-auto max-h-96 leading-relaxed select-all">
                {OFFICIAL_GAS_SCRIPT_TEMPLATE}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: PANDUAN DEPLOYMENT (TUTORIAL) */}
      {activeSubTab === 'guide' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Panduan Langkah demi Langkah Pasang Database GAS</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Ikuti 5 langkah sederhana berikut untuk menghubungkan Google Sheets gratis sebagai database cloud absensi sekolah:
            </p>
          </div>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-black text-xs flex items-center justify-center shrink-0">
                1
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white">Buat Spreadsheet Baru di Google Drive</h4>
                <p className="text-xs text-slate-400">
                  Buka{' '}
                  <a
                    href="https://sheets.new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 underline font-semibold"
                  >
                    sheets.new
                  </a>{' '}
                  menggunakan akun Google sekolah. Beri nama file Spreadsheet, misalnya: <span className="text-slate-200 font-semibold font-mono">DATABASE ABSENSI SMAN 05 BOMBANA</span>.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-black text-xs flex items-center justify-center shrink-0">
                2
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white">Buka Editor Apps Script</h4>
                <p className="text-xs text-slate-400">
                  Pada menu bagian atas Google Sheets, klik menu <span className="text-amber-300 font-semibold">Ekstensi (Extensions)</span> lalu pilih <span className="text-amber-300 font-semibold">Apps Script</span>. Tab editor script baru akan terbuka.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                3
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white">Tempelkan Kode Script</h4>
                <p className="text-xs text-slate-400">
                  Hapus seluruh kode default yang ada di file <code className="text-indigo-400 font-mono">Code.gs</code>, kemudian salin dan tempelkan seluruh isi script dari tab <strong>"Kode Script (Code.gs)"</strong> pada panel ini. Klik tombol Simpan (ikon disket).
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">
                4
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white">Deploy Sebagai Aplikasi Web (Penting!)</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Di pojok kanan atas Apps Script, klik tombol <span className="text-emerald-400 font-bold">Deploy (Terapkan)</span> &gt; <span className="text-emerald-400 font-bold">New deployment (Deployment baru)</span>.<br />
                  - Klik ikon gerigi (pilih jenis): Pilih <span className="text-white font-bold">Web app (Aplikasi web)</span>.<br />
                  - Description: <span className="text-slate-300">API Database Absensi SMAN 5 Bombana</span>.<br />
                  - Execute as: <span className="text-white font-bold">Me (email Anda)</span>.<br />
                  - Who has access: <span className="text-amber-400 font-black underline">Anyone (Siapa saja)</span>.<br />
                  Klik tombol <strong>Deploy</strong> dan berikan izin otorisasi Google jika diminta.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 font-black text-xs flex items-center justify-center shrink-0">
                5
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white">Salin URL & Masukkan ke Panel Admin</h4>
                <p className="text-xs text-slate-400">
                  Salin <strong>Web App URL</strong> yang dihasilkan (berakhiran <code className="text-indigo-400 font-mono">/exec</code>). Kembali ke tab "Pengaturan &amp; URL Web App" di panel ini, tempelkan URL tersebut, lalu klik <strong>Uji Koneksi</strong> dan <strong>Simpan</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: RIWAYAT LOG SINKRONISASI */}
      {activeSubTab === 'logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <History className="w-4 h-4 text-purple-400" />
                <span>Riwayat Log Aktivitas Sinkronisasi Google Apps Script</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Merekam aktivitas pengiriman dan penerimaan data antara aplikasi dan Spreadsheet.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {config.syncHistory?.length || 0} riwayat
            </span>
          </div>

          {(!config.syncHistory || config.syncHistory.length === 0) ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              Belum ada riwayat aktivitas sinkronisasi. Lakukan uji koneksi atau kirim data terlebih dahulu.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Waktu</th>
                    <th className="py-2.5 px-3">Aksi</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Jumlah Item</th>
                    <th className="py-2.5 px-3">Pesan / Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {config.syncHistory.map((log: GasSyncLog) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-2 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {log.status === 'SUCCESS' ? 'SUKSES' : 'GAGAL'}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-300">
                        {log.itemCount !== undefined ? `${log.itemCount} item` : '-'}
                      </td>
                      <td className="py-2 px-3 text-slate-300 max-w-md truncate" title={log.message}>
                        {log.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
