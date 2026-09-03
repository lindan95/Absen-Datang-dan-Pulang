import React, { useState, useMemo } from 'react';
import {
  Printer,
  FileText,
  Users,
  Calendar,
  ClipboardList,
  MessageSquare,
  QrCode,
  X,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import {
  loadStudents,
  loadAbsenRecords,
  loadKeteranganRecords,
  loadLogWARecords,
  getDashboardData,
  getTodayString,
  loadSettings,
} from '../../data/database';
import {
  downloadMasterSiswaPDF,
  downloadLaporanHarianAdminPDF,
  downloadLaporanKeteranganPDF,
  downloadLogWAPDF,
  downloadRekapitulasiSemuaSiswaPDF,
} from '../../utils/pdfExport';

interface AdminPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCards?: () => void;
}

export function AdminPrintModal({ isOpen, onClose, onOpenCards }: AdminPrintModalProps) {
  const [selectedReport, setSelectedReport] = useState<
    'rekap' | 'harian' | 'siswa' | 'keterangan' | 'wa'
  >('rekap');

  // Filter states
  const [filterKelas, setFilterKelas] = useState('');
  const [filterTanggal, setFilterTanggal] = useState(getTodayString());
  const [filterStatusHarian, setFilterStatusHarian] = useState('');
  const [filterJenisKet, setFilterJenisKet] = useState<'' | 'SAKIT' | 'IZIN'>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const students = useMemo(() => loadStudents(), [isOpen]);
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.kelas && s.kelas !== '-') set.add(s.kelas);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
  }, [students]);

  if (!isOpen) return null;

  const handleGenerate = () => {
    setIsGenerating(true);
    setSuccessMsg(null);
    try {
      if (selectedReport === 'rekap') {
        const dashboard = getDashboardData(filterTanggal);
        downloadRekapitulasiSemuaSiswaPDF(dashboard.rekapSiswa, filterKelas || undefined);
        setSuccessMsg('Dokumen PDF Rekapitulasi Kehadiran Siswa berhasil dibuat!');
      } else if (selectedReport === 'harian') {
        const allRecords = loadAbsenRecords();
        const filtered = allRecords.filter((r) => {
          const matchDate = r.tanggal === filterTanggal;
          const matchKelas = !filterKelas || r.kelas === filterKelas;
          const matchStatus =
            !filterStatusHarian ||
            r.status.toUpperCase().includes(filterStatusHarian.toUpperCase());
          return matchDate && matchKelas && matchStatus;
        });

        downloadLaporanHarianAdminPDF(
          filtered,
          filterTanggal,
          filterKelas || 'Semua Kelas',
          filterStatusHarian || 'Semua Status'
        );
        setSuccessMsg('Dokumen PDF Laporan Harian Absensi berhasil dibuat!');
      } else if (selectedReport === 'siswa') {
        const filtered = filterKelas
          ? students.filter((s) => s.kelas === filterKelas)
          : students;
        downloadMasterSiswaPDF(filtered, filterKelas || undefined);
        setSuccessMsg('Dokumen PDF Master Siswa berhasil dibuat!');
      } else if (selectedReport === 'keterangan') {
        const allKet = loadKeteranganRecords();
        const filtered = allKet.filter((k) => {
          const matchJenis = !filterJenisKet || k.keterangan === filterJenisKet;
          const matchKelas = !filterKelas || k.kelas === filterKelas;
          return matchJenis && matchKelas;
        });
        downloadLaporanKeteranganPDF(filtered, filterJenisKet || undefined);
        setSuccessMsg('Dokumen PDF Surat Keterangan Sakit/Izin berhasil dibuat!');
      } else if (selectedReport === 'wa') {
        const logs = loadLogWARecords();
        downloadLogWAPDF(logs);
        setSuccessMsg('Dokumen PDF Log Audit WhatsApp berhasil dibuat!');
      }
    } catch (err) {
      alert(`Terjadi kesalahan saat membuat PDF: ${(err as Error)?.message || err}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Cetak Laporan & Unduh PDF</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Resmi Sekolah
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pusat pencetakan dokumen absensi resmi SMA NEGERI 05 BOMBANA
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Report Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
              Pilih Jenis Dokumen / Laporan:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedReport('rekap');
                  setSuccessMsg(null);
                }}
                className={`p-3 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
                  selectedReport === 'rekap'
                    ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <ClipboardList
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    selectedReport === 'rekap' ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                />
                <div>
                  <div className="text-xs font-bold text-slate-200">Rekapitulasi Kehadiran</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Akumulasi hadir, terlambat, sakit, izin, alfa semester
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedReport('harian');
                  setSuccessMsg(null);
                }}
                className={`p-3 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
                  selectedReport === 'harian'
                    ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <Clock
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    selectedReport === 'harian' ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                />
                <div>
                  <div className="text-xs font-bold text-slate-200">Log Absensi Harian</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Rincian scan jam datang, pulang, & status per hari
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedReport('siswa');
                  setSuccessMsg(null);
                }}
                className={`p-3 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
                  selectedReport === 'siswa'
                    ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <Users
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    selectedReport === 'siswa' ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                />
                <div>
                  <div className="text-xs font-bold text-slate-200">Daftar Master Siswa</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Data induk NISN, nama, kelas, & nomor WhatsApp ortu
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedReport('keterangan');
                  setSuccessMsg(null);
                }}
                className={`p-3 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
                  selectedReport === 'keterangan'
                    ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <FileText
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    selectedReport === 'keterangan' ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                />
                <div>
                  <div className="text-xs font-bold text-slate-200">Surat Sakit & Izin</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Daftar permohonan izin & keterangan sakit siswa
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedReport('wa');
                  setSuccessMsg(null);
                }}
                className={`p-3 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer sm:col-span-2 ${
                  selectedReport === 'wa'
                    ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <MessageSquare
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    selectedReport === 'wa' ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                />
                <div>
                  <div className="text-xs font-bold text-slate-200">Audit Notifikasi WhatsApp</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Riwayat pesan otomatis yang dikirimkan kepada orang tua/wali siswa
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Dynamic Filter Controls */}
          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-3.5">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pengaturan Filter Laporan:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Kelas Filter (for rekap, harian, siswa, keterangan) */}
              {selectedReport !== 'wa' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Filter Rombel / Kelas:
                  </label>
                  <select
                    value={filterKelas}
                    onChange={(e) => setFilterKelas(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">Semua Kelas (Seluruh Siswa)</option>
                    {availableClasses.map((k) => (
                      <option key={k} value={k}>
                        Kelas {k}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tanggal Filter (for harian) */}
              {selectedReport === 'harian' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Tanggal Absensi:
                  </label>
                  <input
                    type="date"
                    value={filterTanggal}
                    onChange={(e) => setFilterTanggal(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Status Filter (for harian) */}
              {selectedReport === 'harian' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Status Kehadiran:
                  </label>
                  <select
                    value={filterStatusHarian}
                    onChange={(e) => setFilterStatusHarian(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">Semua Status</option>
                    <option value="HADIR TEPAT">Hadir Tepat</option>
                    <option value="TERLAMBAT">Terlambat</option>
                    <option value="ALFA">Alfa</option>
                    <option value="SAKIT">Sakit</option>
                    <option value="IZIN">Izin</option>
                    <option value="PULANG TANPA DATANG">Pulang Tanpa Datang</option>
                    <option value="IZIN PULANG">Izin Pulang Cepat</option>
                  </select>
                </div>
              )}

              {/* Jenis Filter (for keterangan) */}
              {selectedReport === 'keterangan' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Kategori Surat:
                  </label>
                  <select
                    value={filterJenisKet}
                    onChange={(e) => setFilterJenisKet(e.target.value as '' | 'SAKIT' | 'IZIN')}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">Semua Kategori (Sakit & Izin)</option>
                    <option value="SAKIT">Khusus Sakit</option>
                    <option value="IZIN">Khusus Izin</option>
                  </select>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 italic mt-2">
              * Dokumen PDF yang dihasilkan telah dilengkapi dengan KOP Resmi SMA Negeri 05 Bombana,
              lembar pengesahan, dan tanda tangan Kepala Sekolah beserta Petugas Piket.
            </p>
          </div>

          {/* Additional Quick Actions */}
          <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800">
            {onOpenCards && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCards();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-400 border border-slate-800 text-xs font-bold transition cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Cetak Kartu Siswa & QR Code</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleBrowserPrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition cursor-pointer ml-auto"
              title="Cetak tampilan halaman layar saat ini langsung ke printer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Cetak Layar (Browser Print)</span>
            </button>
          </div>
        </div>

        {/* Footer Modal Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            Tutup
          </button>

          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/30 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isGenerating ? 'Memproses PDF...' : 'Unduh Dokumen PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
