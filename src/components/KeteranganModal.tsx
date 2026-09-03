import { useState } from 'react';
import { StudentAbsenStatus } from '../types';
import { simpanKeteranganAbsensi } from '../data/database';
import { playBeep } from '../utils/audio';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

interface KeteranganModalProps {
  student: StudentAbsenStatus | null;
  initialStatus: 'SAKIT' | 'IZIN';
  selectedDate: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function KeteranganModal({
  student,
  initialStatus,
  selectedDate,
  onClose,
  onSuccess,
}: KeteranganModalProps) {
  const [keterangan, setKeterangan] = useState<'SAKIT' | 'IZIN'>(initialStatus || 'SAKIT');
  const [admin, setAdmin] = useState(student?.admin || '');
  const [catatan, setCatatan] = useState(student?.catatan || '');
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!student) return null;

  const handleSave = () => {
    setIsSaving(true);
    setMessage(null);

    const res = simpanKeteranganAbsensi(
      selectedDate,
      student.nisn,
      keterangan,
      catatan,
      admin
    );

    setIsSaving(false);

    if (!res.success) {
      setMessage({ text: res.message, isError: true });
      return;
    }

    setMessage({ text: res.message, isError: false });
    playBeep(1046.5, 'sine', 0.12);

    setTimeout(() => {
      onSuccess();
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>📋</span> Keterangan Absensi
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Tetapkan SAKIT atau IZIN siswa tanpa scan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Student Info */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-3.5 space-y-1">
            <p className="font-black text-white text-sm">{student.nama}</p>
            <p className="text-[10px] text-slate-400">
              NISN: <span className="font-mono text-slate-300">{student.nisn}</span> • Kelas:{' '}
              <span className="font-semibold text-slate-300">{student.kelas}</span>
            </p>
            <p className="text-[10px] text-amber-400 pt-1 border-t border-slate-800/80 mt-1.5">
              Tanggal Berlaku: <span className="font-bold">{selectedDate}</span>
            </p>
          </div>

          {/* SAKIT vs IZIN selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setKeterangan('SAKIT')}
              className={`py-2.5 rounded-xl text-xs font-black border transition cursor-pointer ${
                keterangan === 'SAKIT'
                  ? 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/20'
                  : 'bg-slate-950 text-red-400 border-red-500/30 hover:bg-red-500/10'
              }`}
            >
              🤒 SAKIT
            </button>
            <button
              type="button"
              onClick={() => setKeterangan('IZIN')}
              className={`py-2.5 rounded-xl text-xs font-black border transition cursor-pointer ${
                keterangan === 'IZIN'
                  ? 'bg-cyan-500 text-white border-cyan-400 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-950 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10'
              }`}
            >
              📝 IZIN
            </button>
          </div>

          {/* Admin Name */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">
              Petugas / Admin Piket:
            </label>
            <input
              type="text"
              value={admin}
              onChange={(e) => setAdmin(e.target.value)}
              placeholder="Nama admin / guru piket (opsional)"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">
              Catatan / Keterangan Tambahan:
            </label>
            <textarea
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan tambahan (misal: surat dokter terlampir / izin orang tua via telepon)"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Status Message */}
          {message && (
            <div
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                message.isError
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {message.isError ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-black hover:bg-slate-700 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-black hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Keterangan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
