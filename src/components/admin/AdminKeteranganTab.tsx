import React, { useState, useMemo } from 'react';
import { KeteranganRecord, Siswa } from '../../types';
import {
  loadKeteranganRecords,
  hapusKeteranganAbsensi,
  simpanKeteranganAbsensi,
  loadStudents,
  getTodayString,
} from '../../data/database';
import {
  Search,
  Plus,
  Trash2,
  Calendar,
  X,
  ClipboardList,
  AlertCircle,
  Filter,
  Printer,
} from 'lucide-react';
import { downloadLaporanKeteranganPDF } from '../../utils/pdfExport';

interface AdminKeteranganTabProps {
  onDataChanged: () => void;
}

export function AdminKeteranganTab({ onDataChanged }: AdminKeteranganTabProps) {
  const [records, setRecords] = useState<KeteranganRecord[]>(() => loadKeteranganRecords());
  const [students] = useState<Siswa[]>(() => loadStudents());

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'' | 'SAKIT' | 'IZIN'>('');
  const [filterDate, setFilterDate] = useState<string>('');

  // Add modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedStudentNis, setSelectedStudentNis] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [keteranganTipe, setKeteranganTipe] = useState<'SAKIT' | 'IZIN'>('SAKIT');
  const [catatan, setCatatan] = useState('');
  const [petugas, setPetugas] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const reload = () => {
    setRecords(loadKeteranganRecords());
    onDataChanged();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records
      .filter((r) => {
        const matchSearch =
          !q ||
          r.namaSiswa.toLowerCase().includes(q) ||
          r.nis.toLowerCase().includes(q) ||
          r.kelas.toLowerCase().includes(q);
        const matchType = !filterType || r.keterangan === filterType;
        const matchDate = !filterDate || r.tanggal === filterDate;
        return matchSearch && matchType && matchDate;
      })
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }, [records, search, filterType, filterDate]);

  const handleDelete = (tanggal: string, nis: string, nama: string) => {
    if (
      window.confirm(
        `Hapus keterangan sakit/izin untuk ${nama} pada tanggal ${tanggal}? Siswa akan dikembalikan ke status absensi biasa.`
      )
    ) {
      hapusKeteranganAbsensi(tanggal, nis);
      reload();
    }
  };

  const handleSaveKeterangan = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedStudentNis) {
      setErrorMsg('Pilih siswa terlebih dahulu!');
      return;
    }
    if (!selectedDate) {
      setErrorMsg('Tentukan tanggal berlakunya keterangan.');
      return;
    }

    const res = simpanKeteranganAbsensi(
      selectedDate,
      selectedStudentNis,
      keteranganTipe,
      catatan,
      petugas
    );

    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }

    setIsAddOpen(false);
    setSelectedStudentNis('');
    setCatatan('');
    reload();
  };

  return (
    <div className="space-y-4">
      {/* Action and Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-3xl shadow">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, NISN, atau kelas..."
              className="pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 w-52 sm:w-60"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">Semua Status (Sakit & Izin)</option>
            <option value="SAKIT">Hanya SAKIT</option>
            <option value="IZIN">Hanya IZIN</option>
          </select>

          {/* Date Filter */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
              title="Filter per tanggal tertentu"
            />
            {filterDate && (
              <button
                type="button"
                onClick={() => setFilterDate('')}
                className="text-slate-500 hover:text-white text-[10px] font-bold px-1"
                title="Hapus filter tanggal"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadLaporanKeteranganPDF(filtered, filterType)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 transition cursor-pointer"
            title="Cetak surat izin dan sakit ke dokumen PDF"
          >
            <Printer className="w-3.5 h-3.5 text-rose-400" />
            <span>Cetak PDF</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setIsAddOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Keterangan Baru</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-[10px] text-slate-500 font-bold uppercase">TOTAL KETERANGAN</div>
          <div className="text-xl font-black text-white mt-0.5">{records.length}</div>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-[10px] text-slate-500 font-bold uppercase">SAKIT</div>
          <div className="text-xl font-black text-rose-400 mt-0.5">
            {records.filter((r) => r.keterangan === 'SAKIT').length}
          </div>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-[10px] text-slate-500 font-bold uppercase">IZIN</div>
          <div className="text-xl font-black text-cyan-400 mt-0.5">
            {records.filter((r) => r.keterangan === 'IZIN').length}
          </div>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-[10px] text-slate-500 font-bold uppercase">FILTER AKTIF</div>
          <div className="text-xs font-black text-amber-400 mt-1">
            {filtered.length} Data Ditampilkan
          </div>
        </div>
      </div>

      {/* Table of Keterangan */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-cyan-400" />
            <span>LOG KETERANGAN SAKIT & IZIN (KETERANGAN_ABSENSI)</span>
          </h3>
          <span className="text-xs text-slate-400 font-bold">
            Total Data: <span className="text-white font-mono">{filtered.length}</span>
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
                <th className="py-3 px-3 w-24 text-center">KELAS</th>
                <th className="py-3 px-3 w-28 text-center">STATUS</th>
                <th className="py-3 px-4">CATATAN / KETERANGAN</th>
                <th className="py-3 px-3 w-32">PETUGAS PIKET</th>
                <th className="py-3 px-3 w-20 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-500 italic">
                    Belum ada data keterangan sakit atau izin yang tercatat.
                  </td>
                </tr>
              ) : (
                filtered.map((k, idx) => (
                  <tr key={k.id || `${k.tanggal}-${k.nis}`} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-300 whitespace-nowrap">
                      {k.tanggal}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">{k.nis}</td>
                    <td className="py-2.5 px-4 font-bold text-white">{k.namaSiswa}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-black">
                        {k.kelas}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {k.keterangan === 'SAKIT' ? (
                        <span className="px-2.5 py-0.5 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/20 text-[10px] font-black">
                          🤒 SAKIT
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 text-[10px] font-black">
                          📝 IZIN
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-300 text-[11px]">
                      {k.catatan || <span className="text-slate-600 italic">-</span>}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-medium text-[11px]">
                      {k.admin || 'Admin'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDelete(k.tanggal, k.nis, k.namaSiswa)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                        title="Hapus Keterangan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Tambah Keterangan Langsung */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>📋</span> INPUT KETERANGAN SAKIT / IZIN
              </h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveKeterangan} className="p-5 space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Pilih Siswa:
                </label>
                <select
                  required
                  value={selectedStudentNis}
                  onChange={(e) => setSelectedStudentNis(e.target.value)}
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
                    Tanggal Berlaku:
                  </label>
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Status Keterangan:
                  </label>
                  <select
                    value={keteranganTipe}
                    onChange={(e) => setKeteranganTipe(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 cursor-pointer font-bold"
                  >
                    <option value="SAKIT">🤒 SAKIT</option>
                    <option value="IZIN">📝 IZIN</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Petugas / Guru Piket:
                </label>
                <input
                  type="text"
                  value={petugas}
                  onChange={(e) => setPetugas(e.target.value)}
                  placeholder="Contoh: Guru BK / Petugas Piket"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Catatan / Alasan:
                </label>
                <textarea
                  rows={3}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Misal: Surat dokter terlampir / Izin ada acara keluarga..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition shadow cursor-pointer"
                >
                  Simpan Keterangan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
