import { useState } from 'react';
import { StudentAbsenStatus } from '../types';
import { catatAbsen, getTodayString } from '../data/database';
import { playBeep } from '../utils/audio';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

interface IzinPulangModalProps {
  student: StudentAbsenStatus | null;
  selectedDate?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function IzinPulangModal({
  student,
  selectedDate,
  onClose,
  onSuccess,
}: IzinPulangModalProps) {
  const [alasanTipe, setAlasanTipe] = useState<'SAKIT' | 'URUSAN MENDADAK'>('SAKIT');
  const [catatan, setCatatan] = useState('');
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!student) return null;

  const activeDate = selectedDate || getTodayString();

  const handleSave = () => {
    setIsSaving(true);
    setMessage(null);

    const fullAlasan = `${alasanTipe}${catatan.trim() ? ` - ${catatan.trim()}` : ''}`;
    const res = catatAbsen(student.nisn, 'IZIN_PULANG', fullAlasan, activeDate);

    setIsSaving(false);

    if (!res.success) {
      setMessage({ text: res.message, isError: true });
      return;
    }

    setMessage({ text: res.message || 'Pulang cepat berhasil dicatat.', isError: false });
    playBeep(880, 'sine', 0.12);

    setTimeout(() => {
      onSuccess();
      onClose();
    }, 450);
  };

  const currentTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>🚪</span> IZIN PULANG CEPAT
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Catat siswa pulang lebih awal karena sakit atau urusan mendadak.
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
          {/* Student details */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-3.5 space-y-1">
            <p className="font-black text-white text-sm">{student.nama}</p>
            <p className="text-[10px] text-slate-400">
              NISN: <span className="font-mono text-slate-300">{student.nisn}</span> • Kelas:{' '}
              <span className="font-semibold text-slate-300">{student.kelas}</span>
            </p>
            <p className="text-[10px] text-amber-400 pt-1 border-t border-slate-800/80 mt-1.5">
              Tanggal: <span className="font-bold">{activeDate}</span> • Jam Pulang:{' '}
              <span className="font-mono font-bold">{currentTime}</span>
            </p>
          </div>

          {/* Reason Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAlasanTipe('SAKIT')}
              className={`py-3 rounded-xl text-xs font-black border transition cursor-pointer ${
                alasanTipe === 'SAKIT'
                  ? 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/20'
                  : 'bg-slate-950 text-red-400 border-red-500/30 hover:bg-red-500/10'
              }`}
            >
              🤒 SAKIT
            </button>
            <button
              type="button"
              onClick={() => setAlasanTipe('URUSAN MENDADAK')}
              className={`py-3 rounded-xl text-xs font-black border transition cursor-pointer ${
                alasanTipe === 'URUSAN MENDADAK'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-950 text-amber-400 border-amber-500/30 hover:bg-amber-500/10'
              }`}
            >
              ⚠️ URUSAN MENDADAK
            </button>
          </div>

          {/* Optional Note */}
          <textarea
            rows={3}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Catatan tambahan (misal: dijemput orang tua / sakit perut di UKS)"
            className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-fuchsia-500"
          />

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

          {/* Action buttons */}
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
              className="px-4 py-2.5 rounded-xl bg-fuchsia-600 text-white text-xs font-black hover:bg-fuchsia-500 transition shadow-lg shadow-fuchsia-600/20 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Pulang Cepat'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
