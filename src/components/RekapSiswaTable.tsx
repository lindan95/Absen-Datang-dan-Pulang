import { useState, useMemo } from 'react';
import { RekapSiswaItem } from '../types';
import { getRiwayatSiswaDownload } from '../data/database';
import { downloadRiwayatSiswaPDF } from '../utils/pdfExport';
import { ClipboardList, Download, Search, Loader2, FileSpreadsheet } from 'lucide-react';

interface RekapSiswaTableProps {
  rekapSiswa: RekapSiswaItem[];
}

export function RekapSiswaTable({ rekapSiswa }: RekapSiswaTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('');
  const [loadingNis, setLoadingNis] = useState<string | null>(null);

  // Extract unique classes
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    rekapSiswa.forEach((s) => {
      if (s.kelas && s.kelas !== '-') set.add(s.kelas);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
  }, [rekapSiswa]);

  // Filter students
  const filteredList = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const kelasSel = selectedKelas.trim().toLowerCase();

    return rekapSiswa.filter((s) => {
      const nisn = String(s.nisn || '').toLowerCase();
      const nama = String(s.nama || '').toLowerCase();
      const kelas = String(s.kelas || '').toLowerCase();

      const matchSearch = !search || nama.includes(search) || nisn.includes(search);
      const matchKelas = !kelasSel || kelas === kelasSel;

      return matchSearch && matchKelas;
    });
  }, [rekapSiswa, searchTerm, selectedKelas]);

  const handleDownloadSingleReport = async (nis: string) => {
    setLoadingNis(nis);
    try {
      const report = getRiwayatSiswaDownload(nis);
      downloadRiwayatSiswaPDF(report);
    } catch (err) {
      alert(`Gagal membuat PDF riwayat siswa: ${(err as Error)?.message || err}`);
    } finally {
      setLoadingNis(null);
    }
  };

  const handleDownloadCSV = () => {
    if (filteredList.length === 0) {
      alert('Tidak ada data yang sesuai untuk diekspor ke CSV.');
      return;
    }

    const headers = [
      'No',
      'NISN',
      'Nama Siswa',
      'Kelas',
      'Terlambat',
      'Bolos',
      'Alfa',
      'Sakit',
      'Izin',
      'Pulang Cepat',
      'Pulang Tanpa Datang',
      'Total Kejadian',
    ];

    const rows = filteredList.map((s, index) => [
      index + 1,
      `"${String(s.nisn || '').replace(/"/g, '""')}"`,
      `"${String(s.nama || '').replace(/"/g, '""')}"`,
      `"${String(s.kelas || '').replace(/"/g, '""')}"`,
      s.terlambat || 0,
      s.bolos || 0,
      s.alfa || 0,
      s.sakit || 0,
      s.izin || 0,
      s.izinPulang || 0,
      s.pulangTanpaDatang || 0,
      s.totalKejadian || 0,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rekap_Kehadiran_Siswa_${(selectedKelas || 'Semua').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden flex flex-col shadow-xl">
      {/* Table Toolbar */}
      <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap gap-2.5 justify-between items-center">
        <div>
          <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4 text-indigo-400" />
            <span>Rekap Riwayat Per Siswa</span>
          </h4>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Jumlah kejadian berdasarkan seluruh riwayat absensi yang tercatat (sejak 25 Agustus 2026)
          </p>
        </div>

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

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleDownloadCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shadow-md cursor-pointer"
            title="Export Rekap Siswa ke format CSV (Excel)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>EXPORT CSV</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto max-h-72">
        <table className="w-full text-left text-[11px] text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider sticky top-0 z-10">
            <tr>
              <th className="p-2.5">NISN</th>
              <th className="p-2.5">Nama Siswa</th>
              <th className="p-2.5">Kelas</th>
              <th className="p-2.5 text-center text-amber-400">Terlambat</th>
              <th className="p-2.5 text-center text-purple-400">Bolos</th>
              <th className="p-2.5 text-center text-rose-400">Alfa</th>
              <th className="p-2.5 text-center text-red-400">Sakit</th>
              <th className="p-2.5 text-center text-cyan-400">Izin</th>
              <th className="p-2.5 text-center text-fuchsia-400">Pulang Cepat</th>
              <th className="p-2.5 text-center text-orange-400">Pulang Tanpa Datang</th>
              <th className="p-2.5 text-center text-indigo-400">Total</th>
              <th className="p-2.5 text-center text-emerald-400">Download</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-6 text-center text-slate-500 italic">
                  Tidak ada data rekap siswa.
                </td>
              </tr>
            ) : (
              filteredList.map((s) => (
                <tr key={s.nisn} className="hover:bg-slate-800/50 transition">
                  <td className="p-2.5 font-mono text-slate-400">{s.nisn}</td>
                  <td className="p-2.5 font-bold text-white">{s.nama}</td>
                  <td className="p-2.5 text-slate-400">{s.kelas}</td>
                  <td className="p-2.5 text-center">
                    <span className="inline-flex min-w-7 justify-center px-2 py-0.5 rounded-lg font-black bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {s.terlambat}
                    </span>
                  </td>
                  <td className="p-2.5 text-center">
                    <span className="inline-flex min-w-7 justify-center px-2 py-0.5 rounded-lg font-black bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {s.bolos}
                    </span>
                  </td>
                  <td className="p-2.5 text-center">
                    <span className="inline-flex min-w-7 justify-center px-2 py-0.5 rounded-lg font-black bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      {s.alfa}
                    </span>
                  </td>
                  <td className="p-2.5 text-center">
                    <span className="inline-flex min-w-7 justify-center px-2 py-0.5 rounded-lg font-black bg-red-500/10 text-red-400 border border-red-500/20">
                      {s.sakit}
                    </span>
                  </td>
                  <td className="p-2.5 text-center">
                    <span className="inline-flex min-w-7 justify-center px-2 py-0.5 rounded-lg font-black bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {s.izin}
                    </span>
                  </td>
                  <td className="p-2.5 text-center">
                    <span className="inline-flex min-w-7 justify-center px-2 py-0.5 rounded-lg font-black bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">
                      {s.izinPulang}
                    </span>
                  </td>
                  <td className="p-2.5 text-center">
                    <span className="inline-flex min-w-7 justify-center px-2 py-0.5 rounded-lg font-black bg-orange-500/10 text-orange-400 border border-orange-500/20">
                      {s.pulangTanpaDatang}
                    </span>
                  </td>
                  <td className="p-2.5 text-center">
                    <span className="inline-flex min-w-7 justify-center px-2 py-0.5 rounded-lg font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {s.totalPelanggaran}
                    </span>
                  </td>
                  <td className="p-2.5 text-center">
                    <button
                      type="button"
                      disabled={loadingNis === s.nisn}
                      onClick={() => handleDownloadSingleReport(s.nisn)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition cursor-pointer disabled:opacity-50"
                      title="Download rincian riwayat absensi siswa dalam PDF"
                    >
                      {loadingNis === s.nisn ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>PDF...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3 h-3" />
                          <span>DOWNLOAD</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
