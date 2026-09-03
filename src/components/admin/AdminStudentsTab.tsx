import React, { useState, useMemo } from 'react';
import { Siswa } from '../../types';
import {
  addStudent,
  updateStudent,
  deleteStudent,
  importStudents,
  loadStudents,
} from '../../data/database';
import { downloadMasterSiswaPDF } from '../../utils/pdfExport';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Download,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Printer,
} from 'lucide-react';

interface AdminStudentsTabProps {
  onDataChanged: () => void;
  onOpenCards: () => void;
}

export function AdminStudentsTab({ onDataChanged, onOpenCards }: AdminStudentsTabProps) {
  const [students, setStudents] = useState<Siswa[]>(() => loadStudents());
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Siswa | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  // Form State
  const [formNis, setFormNis] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formKelas, setFormKelas] = useState('X-1');
  const [formWA, setFormWA] = useState('');
  const [formWAAktif, setFormWAAktif] = useState<'YA' | 'TIDAK'>('YA');
  const [formError, setFormError] = useState<string | null>(null);

  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => set.add(s.kelas));
    return Array.from(set).sort();
  }, [students]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cls = classFilter.trim().toLowerCase();

    return students.filter((s) => {
      const matchSearch =
        !q || s.nama.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q);
      const matchClass = !cls || s.kelas.toLowerCase() === cls;
      return matchSearch && matchClass;
    });
  }, [students, search, classFilter]);

  const reload = () => {
    const fresh = loadStudents();
    setStudents(fresh);
    onDataChanged();
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setFormNis('');
    setFormNama('');
    setFormKelas(availableClasses[0] || 'X-1');
    setFormWA('');
    setFormWAAktif('YA');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditModal = (s: Siswa) => {
    setEditingStudent(s);
    setFormNis(s.nis);
    setFormNama(s.nama);
    setFormKelas(s.kelas);
    setFormWA(s.waOrangtua);
    setFormWAAktif((s.waAktif as 'YA' | 'TIDAK') || 'YA');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formNis.trim()) {
      setFormError('NIS / NISN tidak boleh kosong');
      return;
    }
    if (!formNama.trim()) {
      setFormError('Nama lengkap siswa wajib diisi');
      return;
    }

    if (editingStudent) {
      const res = updateStudent(editingStudent.nis, {
        nis: formNis,
        nama: formNama,
        kelas: formKelas,
        waOrangtua: formWA,
        waAktif: formWAAktif,
      });
      if (!res.success) {
        setFormError(res.message);
        return;
      }
    } else {
      const res = addStudent({
        nis: formNis,
        nama: formNama,
        kelas: formKelas,
        waOrangtua: formWA,
        waAktif: formWAAktif,
      });
      if (!res.success) {
        setFormError(res.message);
        return;
      }
    }

    setIsFormOpen(false);
    reload();
  };

  const handleDeleteStudent = (s: Siswa) => {
    if (window.confirm(`Yakin ingin menghapus data siswa ${s.nama} (${s.nis})?`)) {
      const res = deleteStudent(s.nis);
      if (res.success) {
        reload();
      } else {
        alert(res.message);
      }
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['NIS', 'NAMA_SISWA', 'KELAS', 'NO_WA_ORANGTUA', 'WA_AKTIF'];
    const rows = students.map((s) => [
      `"${s.nis}"`,
      `"${s.nama.replace(/"/g, '""')}"`,
      `"${s.kelas}"`,
      `"${s.waOrangtua}"`,
      `"${s.waAktif || 'YA'}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Data_Siswa_SMAN05Bombana_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import CSV / Text
  const handleProcessImport = () => {
    if (!importText.trim()) {
      alert('Teks data impor masih kosong!');
      return;
    }

    try {
      // Try JSON first
      if (importText.trim().startsWith('[')) {
        const parsed = JSON.parse(importText);
        if (Array.isArray(parsed)) {
          const res = importStudents(parsed, importMode);
          alert(res.message);
          setIsImportOpen(false);
          setImportText('');
          reload();
          return;
        }
      }
    } catch {
      // Not JSON, continue with CSV parsing
    }

    // CSV parser (handles comma or semicolon or tab)
    const lines = importText.trim().split(/\r?\n/);
    if (lines.length === 0) return;

    const parsedStudents: Siswa[] = [];
    const firstLine = lines[0].toLowerCase();
    const hasHeader =
      firstLine.includes('nis') || firstLine.includes('nama') || firstLine.includes('kelas');
    const startIdx = hasHeader ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      let delimiter = ',';
      if (line.includes('\t')) delimiter = '\t';
      else if (line.includes(';')) delimiter = ';';

      const parts = line.split(delimiter).map((p) => p.replace(/^["']|["']$/g, '').trim());
      if (parts.length >= 2) {
        parsedStudents.push({
          nis: parts[0],
          nama: parts[1],
          kelas: parts[2] || 'X-1',
          waOrangtua: parts[3] || '',
          waAktif: parts[4] || 'YA',
        });
      }
    }

    if (parsedStudents.length === 0) {
      alert('Tidak ada baris siswa yang valid terdeteksi.');
      return;
    }

    const res = importStudents(parsedStudents, importMode);
    alert(res.message);
    setIsImportOpen(false);
    setImportText('');
    reload();
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-3xl shadow">
        {/* Left: Search & Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari siswa atau NISN..."
              className="pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 w-56 sm:w-64"
            />
          </div>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">Semua Kelas ({students.length})</option>
            {availableClasses.map((c) => {
              const count = students.filter((s) => s.kelas === c).length;
              return (
                <option key={c} value={c}>
                  Kelas {c} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {/* Right: CRUD & Import/Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 transition cursor-pointer"
            title="Impor data siswa via CSV / JSON"
          >
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span>Impor CSV/JSON</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 transition cursor-pointer"
            title="Download CSV data siswa"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={() => downloadMasterSiswaPDF(filtered, classFilter)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 transition cursor-pointer"
            title="Cetak daftar master siswa ke dokumen PDF"
          >
            <Printer className="w-3.5 h-3.5 text-rose-400" />
            <span>Cetak PDF</span>
          </button>

          <button
            type="button"
            onClick={onOpenCards}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 transition cursor-pointer"
            title="Lihat semua kartu siswa & cetak barcode"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-400" />
            <span>Kartu Siswa</span>
          </button>
        </div>
      </div>

      {/* Class Statistics Pill Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {availableClasses.map((cls) => {
          const totalInClass = students.filter((s) => s.kelas === cls).length;
          const isSelected = classFilter === cls;
          return (
            <button
              key={cls}
              type="button"
              onClick={() => setClassFilter(isSelected ? '' : cls)}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg'
                  : 'bg-slate-900 border-slate-800/80 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Kelas {cls}
              </div>
              <div className="text-lg font-black text-white mt-0.5">{totalInClass} Siswa</div>
            </button>
          );
        })}
      </div>

      {/* Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-sky-400" />
            <span>DAFTAR MASTER SISWA SMA NEGERI 05 BOMBANA</span>
          </h3>
          <span className="text-xs text-slate-400 font-bold">
            Total Ditampilkan: <span className="text-white font-mono">{filtered.length}</span> /{' '}
            <span className="text-slate-500">{students.length}</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-extrabold">
                <th className="py-3 px-3 w-12 text-center">NO</th>
                <th className="py-3 px-3 w-32">NIS / NISN</th>
                <th className="py-3 px-4">NAMA LENGKAP SISWA</th>
                <th className="py-3 px-3 w-28 text-center">KELAS</th>
                <th className="py-3 px-4 w-44">NO. WA ORANG TUA</th>
                <th className="py-3 px-3 w-24 text-center">STATUS WA</th>
                <th className="py-3 px-3 w-28 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 italic">
                    Tidak ada data siswa yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filtered.map((s, idx) => (
                  <tr key={s.nis} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-white tracking-wider">
                      {s.nis}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-100">{s.nama}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-black">
                        {s.kelas}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-300">
                      {s.waOrangtua ? (
                        <a
                          href={`https://wa.me/${s.waOrangtua}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-emerald-400 transition"
                        >
                          +{s.waOrangtua}
                        </a>
                      ) : (
                        <span className="text-slate-600 italic">- Belum ada -</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {s.waAktif === 'TIDAK' ? (
                        <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-400 text-[10px] font-bold">
                          Nonaktif
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                          Aktif
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(s)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 transition cursor-pointer"
                          title="Edit Siswa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(s)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                          title="Hapus Siswa"
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

      {/* MODAL: Tambah / Edit Siswa */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>👤</span> {editingStudent ? 'EDIT DATA SISWA' : 'TAMBAH SISWA BARU'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-5 space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  NIS / NISN (10 Digit Angka):
                </label>
                <input
                  type="text"
                  maxLength={10}
                  required
                  value={formNis}
                  onChange={(e) => setFormNis(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0081234001"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Akan dipadatkan otomatis menjadi 10 digit angka barcode.
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Nama Lengkap Siswa:
                </label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Budi Santoso Sudirman"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Kelas:
                  </label>
                  <input
                    type="text"
                    required
                    value={formKelas}
                    onChange={(e) => setFormKelas(e.target.value)}
                    placeholder="X-1 / XI-MIPA 1 / dll"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Status WA:
                  </label>
                  <select
                    value={formWAAktif}
                    onChange={(e) => setFormWAAktif(e.target.value as 'YA' | 'TIDAK')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="YA">Aktif</option>
                    <option value="TIDAK">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  No. WhatsApp Orang Tua (Format: 628xxx atau 08xxx):
                </label>
                <input
                  type="text"
                  value={formWA}
                  onChange={(e) => setFormWA(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="6281234567890"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition shadow cursor-pointer"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Impor Data Siswa */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-sky-400" />
                <span>IMPOR DATA SISWA (CSV / JSON)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 overflow-y-auto">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                Salin & tempel baris data siswa (format CSV koma/titik-koma/tab atau array JSON).
                <br />
                Format kolom per baris:
                <br />
                <code className="text-amber-400 font-mono font-bold block mt-1">
                  NIS, NAMA_SISWA, KELAS, NO_WA_ORANGTUA, WA_AKTIF
                </code>
                Contoh:
                <br />
                <code className="text-sky-400 font-mono block mt-0.5">
                  0081234032, Ahmad Dani, X-1, 628123456789, YA
                </code>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Mode Impor:
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <span>Gabungkan / Tambahkan (Append)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-rose-600 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-rose-400">Timpa Semua Data (Replace)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Tempel Data CSV / JSON:
                </label>
                <textarea
                  rows={8}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Tempel baris data siswa di sini..."
                  className="w-full px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleProcessImport}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition shadow cursor-pointer"
                >
                  Proses Impor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
