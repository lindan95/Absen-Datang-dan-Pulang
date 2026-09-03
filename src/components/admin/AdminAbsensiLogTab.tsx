import React, { useState, useMemo } from 'react';
import { AbsenRecord, Siswa } from '../../types';
import {
  loadAbsenRecords,
  loadStudents,
  addManualAbsenRecord,
  updateAbsenRecord,
  deleteAbsenRecord,
  getTodayString,
  getCurrentTimeString,
} from '../../data/database';
import {
  Search,
  Plus,
  Trash2,
  Calendar,
  X,
  FileSpreadsheet,
  Download,
  Edit2,
  AlertCircle,
  Clock,
  Printer,
} from 'lucide-react';
import { downloadLaporanHarianAdminPDF } from '../../utils/pdfExport';

interface AdminAbsensiLogTabProps {
  onDataChanged: () => void;
}

export function AdminAbsensiLogTab({ onDataChanged }: AdminAbsensiLogTabProps) {
  const [records, setRecords] = useState<AbsenRecord[]>(() => loadAbsenRecords());
  const [students] = useState<Siswa[]>(() => loadStudents());

  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState(getTodayString());
  const [filterStatus, setFilterStatus] = useState('');

  // Manual Add Modal
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualNis, setManualNis] = useState('');
  const [manualDate, setManualDate] = useState(getTodayString());
  const [manualDatang, setManualDatang] = useState('06:45:00');
  const [manualPulang, setManualPulang] = useState('14:30:00');
  const [manualStatus, setManualStatus] = useState('HADIR');
  const [manualError, setManualError] = useState<string | null>(null);

  // Edit Modal
  const [editingRecord, setEditingRecord] = useState<AbsenRecord | null>(null);
  const [editDatang, setEditDatang] = useState('');
  const [editPulang, setEditPulang] = useState('');
  const [editStatus, setEditStatus] = useState('');

  const reload = () => {
    setRecords(loadAbsenRecords());
    onDataChanged();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const st = filterStatus.trim().toUpperCase();

    return records
      .filter((r) => {
        const matchSearch =
          !q ||
          r.namaSiswa.toLowerCase().includes(q) ||
          r.nis.toLowerCase().includes(q) ||
          r.kelas.toLowerCase().includes(q);
        const matchDate = !filterDate || r.tanggal === filterDate;
        const matchStatus = !st || (r.status || '').toUpperCase() === st;
        return matchSearch && matchDate && matchStatus;
      })
      .sort((a, b) => {
        if (a.tanggal !== b.tanggal) return b.tanggal.localeCompare(a.tanggal);
        return (b.jamDatang || '').localeCompare(a.jamDatang || '');
      });
  }, [records, search, filterDate, filterStatus]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    if (!manualNis) {
      setManualError('Pilih siswa terlebih dahulu!');
      return;
    }

    const res = addManualAbsenRecord({
      tanggal: manualDate,
      nis: manualNis,
      jamDatang: manualDatang || '-',
      jamPulang: manualPulang || '-',
      status: manualStatus,
    });

    if (!res.success) {
      setManualError(res.message);
      return;
    }

    setIsManualOpen(false);
    setManualNis('');
    reload();
  };

  const openEditModal = (r: AbsenRecord) => {
    setEditingRecord(r);
    setEditDatang(r.jamDatang || '-');
    setEditPulang(r.jamPulang || '-');
    setEditStatus(r.status || 'HADIR');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    updateAbsenRecord(editingRecord.id, {
      jamDatang: editDatang.trim() || '-',
      jamPulang: editPulang.trim() || '-',
      status: editStatus.toUpperCase().trim(),
    });

    setEditingRecord(null);
    reload();
  };

  const handleDelete = (r: AbsenRecord) => {
    if (
      window.confirm(
        `Hapus rekaman absensi ${r.namaSiswa} pada tanggal ${r.tanggal} (${r.jamDatang})?`
      )
    ) {
      deleteAbsenRecord(r.id);
      reload();
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'TANGGAL', 'TIMESTAMP', 'NIS', 'NAMA_SISWA', 'KELAS', 'JAM_DATANG', 'JAM_PULANG', 'STATUS'];
    const rows = filtered.map((r) => [
      `"${r.id}"`,
      `"${r.tanggal}"`,
      `"${r.timestamp}"`,
      `"${r.nis}"`,
      `"${r.namaSiswa.replace(/"/g, '""')}"`,
      `"${r.kelas}"`,
      `"${r.jamDatang || '-'}"`,
      `"${r.jamPulang || '-'}"`,
      `"${r.status || '-'}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Log_Sheet5_Scan_${filterDate || 'Semua'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-3xl shadow">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari siswa atau NISN..."
              className="pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 w-52 sm:w-60"
            />
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            />
            {filterDate && (
              <button
                type="button"
                onClick={() => setFilterDate('')}
                className="text-slate-500 hover:text-white text-[10px] font-bold px-1"
                title="Tampilkan semua tanggal"
              >
                Semua
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">Semua Status Log</option>
            <option value="HADIR">HADIR TEPAT WAKTU</option>
            <option value="TERLAMBAT">TERLAMBAT</option>
            <option value="PULANG TANPA DATANG">PULANG TANPA DATANG</option>
            <option value="IZIN PULANG">IZIN PULANG</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setManualError(null);
              setIsManualOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Absen Manual</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 transition cursor-pointer"
            title="Download CSV Log Scan"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={() => downloadLaporanHarianAdminPDF(filtered, filterDate, '', filterStatus)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 transition cursor-pointer"
            title="Cetak log absensi harian ke dokumen PDF"
          >
            <Printer className="w-3.5 h-3.5 text-rose-400" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>LOG SCAN HARIAN (SHEET5_SCAN / REALTIME LOG)</span>
          </h3>
          <span className="text-xs text-slate-400 font-bold">
            Total Entri: <span className="text-white font-mono">{filtered.length}</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-extrabold">
                <th className="py-3 px-3 w-12 text-center">NO</th>
                <th className="py-3 px-3 w-28">TANGGAL</th>
                <th className="py-3 px-3 w-28">NIS / NISN</th>
                <th className="py-3 px-4">NAMA LENGKAP SISWA</th>
                <th className="py-3 px-3 w-20 text-center">KELAS</th>
                <th className="py-3 px-3 w-24 text-center">JAM DATANG</th>
                <th className="py-3 px-3 w-24 text-center">JAM PULANG</th>
                <th className="py-3 px-3 w-32 text-center">STATUS</th>
                <th className="py-3 px-3 w-20 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-500 italic">
                    Tidak ada rekaman log scan absensi yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filtered.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-300">{r.tanggal}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{r.nis}</td>
                    <td className="py-2.5 px-4 font-bold text-white">{r.namaSiswa}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-black">
                        {r.kelas}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-400">
                      {r.jamDatang || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-sky-400">
                      {r.jamPulang || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {r.status === 'HADIR' ? (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-black">
                          HADIR
                        </span>
                      ) : r.status === 'TERLAMBAT' ? (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 text-[10px] font-black">
                          TERLAMBAT
                        </span>
                      ) : r.status === 'IZIN PULANG' ? (
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-black">
                          IZIN PULANG
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-400 text-[10px] font-black">
                          {r.status || 'SCAN'}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(r)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 transition cursor-pointer"
                          title="Edit Log"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(r)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                          title="Hapus Log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Input Absen Manual */}
      {isManualOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>CATAT ABSENSI MANUAL</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsManualOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Pilih Siswa:
                </label>
                <select
                  required
                  value={manualNis}
                  onChange={(e) => setManualNis(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">-- Pilih Siswa --</option>
                  {students.map((s) => (
                    <option key={s.nis} value={s.nis}>
                      {s.nama} ({s.kelas} - {s.nis})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Tanggal:
                  </label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Status:
                  </label>
                  <select
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 cursor-pointer font-bold"
                  >
                    <option value="HADIR">HADIR</option>
                    <option value="TERLAMBAT">TERLAMBAT</option>
                    <option value="IZIN PULANG">IZIN PULANG</option>
                    <option value="PULANG TANPA DATANG">PULANG TANPA DATANG</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Jam Datang:
                  </label>
                  <input
                    type="text"
                    value={manualDatang}
                    onChange={(e) => setManualDatang(e.target.value)}
                    placeholder="06:45:00 atau -"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Jam Pulang:
                  </label>
                  <input
                    type="text"
                    value={manualPulang}
                    onChange={(e) => setManualPulang(e.target.value)}
                    placeholder="14:30:00 atau -"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {manualError && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{manualError}</span>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsManualOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition shadow cursor-pointer"
                >
                  Simpan Absensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Record */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-sky-400" />
                <span>EDIT LOG ABSENSI</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-3.5">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1 text-xs">
                <div className="font-bold text-white">{editingRecord.namaSiswa}</div>
                <div className="text-slate-400">
                  NIS: <span className="font-mono text-slate-200">{editingRecord.nis}</span> | Kelas:{' '}
                  <span className="font-mono text-slate-200">{editingRecord.kelas}</span>
                </div>
                <div className="text-slate-400">
                  Tanggal: <span className="font-mono text-amber-300">{editingRecord.tanggal}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Jam Datang:
                  </label>
                  <input
                    type="text"
                    value={editDatang}
                    onChange={(e) => setEditDatang(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Jam Pulang:
                  </label>
                  <input
                    type="text"
                    value={editPulang}
                    onChange={(e) => setEditPulang(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Status Absensi:
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 cursor-pointer font-bold"
                >
                  <option value="HADIR">HADIR</option>
                  <option value="TERLAMBAT">TERLAMBAT</option>
                  <option value="IZIN PULANG">IZIN PULANG</option>
                  <option value="PULANG TANPA DATANG">PULANG TANPA DATANG</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition shadow cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
