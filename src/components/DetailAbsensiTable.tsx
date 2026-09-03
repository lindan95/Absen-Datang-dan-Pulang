import { useState, useMemo, useEffect } from 'react';
import { StudentAbsenStatus } from '../types';
import { downloadFilteredAbsensiPDF } from '../utils/pdfExport';
import { ListChecks, MessageCircle, Download, Search, FileSpreadsheet } from 'lucide-react';

interface DetailAbsensiTableProps {
  listSiswa: StudentAbsenStatus[];
  selectedDate: string;
  onOpenKeterangan: (student: StudentAbsenStatus, defaultStatus: 'SAKIT' | 'IZIN') => void;
  onOpenIzinPulang: (student: StudentAbsenStatus) => void;
  onOpenWABatch: (jenis: 'ALFA' | 'BOLOS') => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
}

export function DetailAbsensiTable({
  listSiswa,
  selectedDate,
  onOpenKeterangan,
  onOpenIzinPulang,
  onOpenWABatch,
  statusFilter,
  onStatusFilterChange,
}: DetailAbsensiTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('');
  const [internalStatus, setInternalStatus] = useState(statusFilter || '');

  // Keep internal status in sync when external statusFilter changes
  useEffect(() => {
    if (statusFilter !== undefined) {
      setInternalStatus(statusFilter);
    }
  }, [statusFilter]);

  const selectedStatus = statusFilter !== undefined ? statusFilter : internalStatus;

  const handleStatusChange = (newStatus: string) => {
    setInternalStatus(newStatus);
    if (onStatusFilterChange) {
      onStatusFilterChange(newStatus);
    }
  };

  // Extract unique classes
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    listSiswa.forEach((s) => {
      if (s.kelas && s.kelas !== '-') set.add(s.kelas);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
  }, [listSiswa]);

  // Filtering matching the user's GAS logic
  const filteredStudents = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const kelasSel = selectedKelas.trim().toLowerCase();
    const statusSel = selectedStatus.trim().toUpperCase();

    return listSiswa.filter((s) => {
      const nisn = String(s.nisn || '').toLowerCase();
      const nama = String(s.nama || '').toLowerCase();
      const kelas = String(s.kelas || '').toLowerCase();
      const status = String(s.status || '').toUpperCase();

      const matchSearch = !search || nama.includes(search) || nisn.includes(search);
      const matchKelas = !kelasSel || kelas === kelasSel;

      let matchStatus = true;
      if (statusSel !== '') {
        switch (statusSel) {
          case 'HADIR':
            matchStatus = status === 'HADIR';
            break;
          case 'TERLAMBAT':
            matchStatus = status === 'TERLAMBAT' || status === 'HADIR (TERLAMBAT)';
            break;
          case 'BOLOS':
            matchStatus = status === 'BOLOS';
            break;
          case 'ALFA':
            matchStatus = status === 'ALFA' || status === 'ALFA / TANPA KETERANGAN';
            break;
          case 'BELUM ABSEN':
            matchStatus = status === 'BELUM ABSEN';
            break;
          case 'PULANG TANPA DATANG':
            matchStatus = status === 'PULANG TANPA DATANG';
            break;
          case 'IZIN PULANG':
            matchStatus = status.startsWith('IZIN PULANG');
            break;
          case 'SAKIT':
            matchStatus = status === 'SAKIT';
            break;
          case 'IZIN':
            matchStatus = status === 'IZIN';
            break;
          default:
            matchStatus = status === statusSel;
            break;
        }
      }

      return matchSearch && matchKelas && matchStatus;
    });
  }, [listSiswa, searchTerm, selectedKelas, selectedStatus]);

  const handleDownloadPDF = () => {
    downloadFilteredAbsensiPDF(filteredStudents, selectedDate, {
      kelasLabel: selectedKelas || 'Semua Kelas',
      statusLabel: selectedStatus || 'Semua Status',
      searchLabel: searchTerm,
    });
  };

  const handleDownloadCSV = () => {
    if (filteredStudents.length === 0) {
      alert('Tidak ada data yang sesuai untuk diekspor ke CSV.');
      return;
    }

    const headers = ['No', 'NISN', 'Nama Siswa', 'Kelas', 'Jam Datang', 'Jam Pulang', 'Status'];
    const rows = filteredStudents.map((s, index) => [
      index + 1,
      `"${String(s.nisn || '').replace(/"/g, '""')}"`,
      `"${String(s.nama || '').replace(/"/g, '""')}"`,
      `"${String(s.kelas || '').replace(/"/g, '""')}"`,
      `"${String(s.jamDatang || '-').replace(/"/g, '""')}"`,
      `"${String(s.jamPulang || '-').replace(/"/g, '""')}"`,
      `"${String(s.status || '-').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Detail_Absensi_${selectedDate}_${(selectedKelas || 'Semua').replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden flex flex-col shadow-xl">
      {/* Table Toolbar */}
      <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap gap-2.5 justify-between items-center">
        <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
          <ListChecks className="w-4 h-4 text-emerald-400" />
          <span>Detail Data Absensi ({filteredStudents.length} siswa)</span>
        </h4>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama/NISN..."
              className="pl-7 pr-2.5 py-1 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 w-36 sm:w-44"
            />
          </div>

          {/* Kelas Filter */}
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">Semua Kelas</option>
            {availableClasses.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">Semua Status</option>
            <option value="HADIR">HADIR</option>
            <option value="TERLAMBAT">TERLAMBAT</option>
            <option value="BOLOS">BOLOS</option>
            <option value="ALFA">ALFA</option>
            <option value="BELUM ABSEN">BELUM ABSEN</option>
            <option value="PULANG TANPA DATANG">PULANG TANPA DATANG</option>
            <option value="IZIN PULANG">IZIN PULANG</option>
            <option value="SAKIT">SAKIT</option>
            <option value="IZIN">IZIN</option>
          </select>

          {/* WhatsApp Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpenWABatch('ALFA')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white transition shadow-lg cursor-pointer"
              title="Buka notifikasi WhatsApp orang tua siswa ALFA"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WA ALFA</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenWABatch('BOLOS')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-500 text-white transition shadow-lg cursor-pointer"
              title="Buka notifikasi WhatsApp orang tua siswa BOLOS"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WA BOLOS</span>
            </button>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shadow-md cursor-pointer"
              title="Export CSV (Excel) sesuai filter"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg cursor-pointer"
              title="Download PDF sesuai filter"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto max-h-64">
        <table className="w-full text-left text-[11px] text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider sticky top-0 z-10">
            <tr>
              <th className="p-2.5">NISN</th>
              <th className="p-2.5">Nama Siswa</th>
              <th className="p-2.5">Kelas</th>
              <th className="p-2.5">Jam Datang</th>
              <th className="p-2.5">Jam Pulang</th>
              <th className="p-2.5">Status</th>
              <th className="p-2.5 text-center">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500 italic">
                  Tidak ada data yang sesuai dengan pencarian / filter.
                </td>
              </tr>
            ) : (
              filteredStudents.map((s) => {
                const statusRaw = (s.status || '-').toString().toUpperCase();

                // Style Badge
                let badgeStyle = 'bg-slate-800 text-slate-400 border-slate-700';
                if (statusRaw.includes('TERLAMBAT')) {
                  badgeStyle = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
                } else if (statusRaw.includes('HADIR')) {
                  badgeStyle = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                } else if (statusRaw.includes('BOLOS')) {
                  badgeStyle = 'bg-purple-500/20 text-purple-400 border-purple-500/30';
                } else if (statusRaw === 'SAKIT') {
                  badgeStyle = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
                } else if (statusRaw === 'IZIN') {
                  badgeStyle = 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
                } else if (statusRaw.includes('IZIN PULANG')) {
                  badgeStyle = 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30';
                } else if (statusRaw.includes('PULANG TANPA DATANG')) {
                  badgeStyle = 'bg-orange-500/20 text-orange-400 border-orange-500/30';
                } else if (statusRaw.includes('ALFA')) {
                  badgeStyle = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
                }

                return (
                  <tr key={s.nisn} className="hover:bg-slate-800/50 transition">
                    <td className="p-2.5 font-mono text-slate-400 font-medium">{s.nisn}</td>
                    <td className="p-2.5 font-bold text-white">{s.nama}</td>
                    <td className="p-2.5 text-slate-400">{s.kelas}</td>
                    <td className="p-2.5 font-mono text-emerald-400">{s.jamDatang || '-'}</td>
                    <td className="p-2.5 font-mono text-blue-400">{s.jamPulang || '-'}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeStyle}`}>
                        {statusRaw}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenKeterangan(s, 'SAKIT')}
                          className="px-2 py-1 rounded-lg text-[9px] font-black bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition cursor-pointer"
                          title="Tetapkan SAKIT"
                        >
                          SAKIT
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenKeterangan(s, 'IZIN')}
                          className="px-2 py-1 rounded-lg text-[9px] font-black bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition cursor-pointer"
                          title="Tetapkan IZIN"
                        >
                          IZIN
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenIzinPulang(s)}
                          className="px-2 py-1 rounded-lg text-[9px] font-black bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 hover:bg-fuchsia-500/20 transition cursor-pointer"
                          title="Catat pulang cepat karena sakit atau urusan mendadak"
                        >
                          PULANG CEPAT
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
