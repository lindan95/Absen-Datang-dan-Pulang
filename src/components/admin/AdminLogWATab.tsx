import { useState, useMemo } from 'react';
import { LogWARecord } from '../../types';
import {
  loadLogWARecords,
  deleteLogWARecord,
  clearLogWA,
  toggleLogWAStatus,
  prosesSemuaLogWA,
} from '../../data/database';
import {
  Search,
  Trash2,
  CheckCircle2,
  Clock,
  Send,
  MessageCircle,
  Download,
  CheckCheck,
  Printer,
} from 'lucide-react';
import { downloadLogWAPDF } from '../../utils/pdfExport';

interface AdminLogWATabProps {
  onDataChanged: () => void;
}

export function AdminLogWATab({ onDataChanged }: AdminLogWATabProps) {
  const [logs, setLogs] = useState<LogWARecord[]>(() => loadLogWARecords());
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | 'SUDAH DIPROSES' | 'BELUM DIPROSES'>('');

  const reload = () => {
    setLogs(loadLogWARecords());
    onDataChanged();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs
      .filter((l) => {
        const matchSearch =
          !q ||
          l.namaSiswa.toLowerCase().includes(q) ||
          l.nis.toLowerCase().includes(q) ||
          l.noWA.includes(q) ||
          l.pesan.toLowerCase().includes(q);
        const matchStatus = !filterStatus || l.statusProses === filterStatus;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [logs, search, filterStatus]);

  const handleToggle = (id: string) => {
    toggleLogWAStatus(id);
    reload();
  };

  const handleDelete = (id: string, nama: string) => {
    if (window.confirm(`Hapus log WhatsApp untuk ${nama}?`)) {
      deleteLogWARecord(id);
      reload();
    }
  };

  const handleProcessAll = () => {
    if (window.confirm('Tandai SEMUA antrean pesan WhatsApp sebagai SUDAH DIPROSES?')) {
      prosesSemuaLogWA();
      reload();
    }
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        '⚠️ PERINGATAN: Apakah Anda yakin ingin MENGHAPUS SEMUA riwayat log WhatsApp? Tindakan ini tidak dapat dibatalkan.'
      )
    ) {
      clearLogWA();
      reload();
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'TIMESTAMP', 'TANGGAL', 'NIS', 'NAMA_SISWA', 'NO_WA', 'STATUS_PROSES', 'WAKTU_PROSES', 'PESAN'];
    const rows = filtered.map((l) => [
      `"${l.id}"`,
      `"${l.timestamp}"`,
      `"${l.tanggal}"`,
      `"${l.nis}"`,
      `"${l.namaSiswa.replace(/"/g, '""')}"`,
      `"${l.noWA}"`,
      `"${l.statusProses}"`,
      `"${l.waktuProses || '-'}"`,
      `"${l.pesan.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Log_Notifikasi_WA_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const countPending = logs.filter((l) => l.statusProses === 'BELUM DIPROSES').length;
  const countProcessed = logs.filter((l) => l.statusProses === 'SUDAH DIPROSES').length;

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-3xl shadow">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari siswa, no WA, atau pesan..."
              className="pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 w-52 sm:w-64"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">Semua Status Pengiriman</option>
            <option value="BELUM DIPROSES">Antrean (Belum Diproses)</option>
            <option value="SUDAH DIPROSES">Terkirim (Sudah Diproses)</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {countPending > 0 && (
            <button
              type="button"
              onClick={handleProcessAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition shadow cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Tandai Semua Selesai</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 transition cursor-pointer"
            title="Download CSV Riwayat WA"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={() => downloadLogWAPDF(filtered)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 transition cursor-pointer"
            title="Cetak log notifikasi WhatsApp ke dokumen PDF"
          >
            <Printer className="w-3.5 h-3.5 text-rose-400" />
            <span>Cetak PDF</span>
          </button>

          {logs.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs font-bold border border-slate-800 transition cursor-pointer"
              title="Bersihkan semua log"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Semua Log</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-[10px] text-slate-500 font-bold uppercase">TOTAL LOG WHATSAPP</div>
          <div className="text-xl font-black text-white mt-0.5">{logs.length}</div>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-[10px] text-slate-500 font-bold uppercase">BELUM DIPROSES</div>
          <div className="text-xl font-black text-amber-400 mt-0.5">{countPending}</div>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-[10px] text-slate-500 font-bold uppercase">SUDAH TERKIRIM</div>
          <div className="text-xl font-black text-emerald-400 mt-0.5">{countProcessed}</div>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-[10px] text-slate-500 font-bold uppercase">FILTER AKTIF</div>
          <div className="text-xs font-black text-sky-400 mt-1">
            {filtered.length} Pesan Ditampilkan
          </div>
        </div>
      </div>

      {/* Table of WhatsApp Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>RIWAYAT PENGIRIMAN NOTIFIKASI WHATSAPP (LOG_WA)</span>
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
                <th className="py-3 px-4 w-44">NAMA SISWA</th>
                <th className="py-3 px-3 w-36">NO. WHATSAPP</th>
                <th className="py-3 px-4">ISI NOTIFIKASI PESAN</th>
                <th className="py-3 px-3 w-36 text-center">STATUS</th>
                <th className="py-3 px-3 w-24 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500 italic">
                    Tidak ada log notifikasi WhatsApp yang tercatat.
                  </td>
                </tr>
              ) : (
                filtered.map((l, idx) => (
                  <tr key={l.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-300 whitespace-nowrap">
                      {l.tanggal}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{l.nis}</td>
                    <td className="py-2.5 px-4 font-bold text-white">{l.namaSiswa}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">+{l.noWA}</td>
                    <td className="py-2.5 px-4 text-slate-300 text-[11px] max-w-xs truncate" title={l.pesan}>
                      {l.pesan}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(l.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black transition cursor-pointer ${
                          l.statusProses === 'SUDAH DIPROSES'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                        }`}
                        title="Klik untuk ubah status proses"
                      >
                        {l.statusProses === 'SUDAH DIPROSES' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>TERKIRIM</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>BELUM PROSES</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <a
                          href={`https://wa.me/${l.noWA}?text=${encodeURIComponent(l.pesan)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition cursor-pointer"
                          title="Buka Chat WhatsApp"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDelete(l.id, l.namaSiswa)}
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
    </div>
  );
}
