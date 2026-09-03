import React, { useState } from 'react';
import {
  exportFullDatabaseJSON,
  importFullDatabaseJSON,
  resetDatabaseToDefaults,
  loadStudents,
  loadAbsenRecords,
  loadKeteranganRecords,
  loadLogWARecords,
} from '../../data/database';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  ShieldCheck,
} from 'lucide-react';

interface AdminBackupTabProps {
  onDatabaseRestored: () => void;
}

export function AdminBackupTab({ onDatabaseRestored }: AdminBackupTabProps) {
  const [jsonText, setJsonText] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const students = loadStudents();
  const absen = loadAbsenRecords();
  const ket = loadKeteranganRecords();
  const logs = loadLogWARecords();

  const handleDownloadBackup = () => {
    const json = exportFullDatabaseJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_Database_SMAN5_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatusMsg({ type: 'success', text: 'File cadangan database berhasil diunduh.' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      setJsonText(content);
    };
    reader.readAsText(file);
  };

  const handleRestoreSubmit = () => {
    if (!jsonText.trim()) {
      setStatusMsg({ type: 'error', text: 'Pilih file atau tempel teks cadangan JSON terlebih dahulu!' });
      return;
    }

    if (
      window.confirm(
        '⚠️ PERINGATAN: Memulihkan database akan menimpa data yang tersimpan saat ini dengan isi file cadangan. Lanjutkan?'
      )
    ) {
      const res = importFullDatabaseJSON(jsonText);
      if (res.success) {
        setStatusMsg({ type: 'success', text: res.message });
        setJsonText('');
        onDatabaseRestored();
      } else {
        setStatusMsg({ type: 'error', text: res.message });
      }
    }
  };

  const handleResetFactory = () => {
    if (
      window.confirm(
        '🚨 PERINGATAN KERAS: Semua data absensi, catatan sakit/izin, log WA, dan pengaturan kustom akan DIHAPUS dan dikembalikan ke sampel awal. Apakah Anda benar-benar yakin?'
      )
    ) {
      resetDatabaseToDefaults();
      setStatusMsg({
        type: 'success',
        text: 'Database berhasil direset ke sampel awal sekolah.',
      });
      onDatabaseRestored();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Status Feedback */}
      {statusMsg && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border animate-in slide-in-from-top-2 duration-200 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Current Database Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-2.5 mb-4">
          <Database className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-black text-white">STATUS PENYIMPANAN DATABASE LOKAL</h3>
            <p className="text-[11px] text-slate-400">
              Data disimpan secara aman di peramban (Local Storage Web Engine)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
            <div className="text-[10px] text-slate-500 font-bold uppercase">MASTER SISWA</div>
            <div className="text-lg font-black text-white mt-0.5">{students.length} Siswa</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
            <div className="text-[10px] text-slate-500 font-bold uppercase">LOG ABSENSI</div>
            <div className="text-lg font-black text-emerald-400 mt-0.5">{absen.length} Baris</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
            <div className="text-[10px] text-slate-500 font-bold uppercase">SAKIT & IZIN</div>
            <div className="text-lg font-black text-cyan-400 mt-0.5">{ket.length} Catatan</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
            <div className="text-[10px] text-slate-500 font-bold uppercase">LOG WHATSAPP</div>
            <div className="text-lg font-black text-amber-400 mt-0.5">{logs.length} Notifikasi</div>
          </div>
        </div>
      </div>

      {/* Backup and Restore Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Export Backup Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-white font-black text-sm mb-1">
              <Download className="w-4 h-4 text-emerald-400" />
              <span>CADANGKAN DATABASE (BACKUP)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unduh seluruh database (daftar siswa, riwayat absensi, surat izin/sakit, log WA, dan pengaturan) ke dalam satu file format JSON.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-400">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Sangat disarankan melakukan cadangan berkala sebelum mengimpor siswa atau membersihkan browser.</span>
          </div>

          <button
            type="button"
            onClick={handleDownloadBackup}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh File Cadangan (.JSON)</span>
          </button>
        </div>

        {/* Restore Backup Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-white font-black text-sm mb-1">
              <Upload className="w-4 h-4 text-sky-400" />
              <span>PULIHKAN DATABASE (RESTORE)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pulihkan database dari file cadangan JSON yang pernah diunduh sebelumnya.
            </p>
          </div>

          <div className="space-y-2">
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
            />
            <textarea
              rows={3}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="Atau tempel teks JSON cadangan di sini..."
              className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            type="button"
            onClick={handleRestoreSubmit}
            className="w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black transition shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Pulihkan Dari File / Teks</span>
          </button>
        </div>
      </div>

      {/* Danger Zone: Factory Reset */}
      <div className="bg-rose-950/20 border border-rose-900/40 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-400 font-black text-sm">
            <RotateCcw className="w-4 h-4" />
            <span>RESET DATABASE KE STANDAR AWAL</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Menghapus data aktif dan mengembalikan data siswa sampel SMA Negeri 05 Bombana beserta catatan absensi historis awal.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetFactory}
          className="px-4 py-2.5 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-black border border-rose-500/40 transition shrink-0 cursor-pointer"
        >
          Reset Pabrik
        </button>
      </div>
    </div>
  );
}
