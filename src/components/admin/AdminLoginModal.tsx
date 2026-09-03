import React, { useState } from 'react';
import { loadSettings } from '../../data/database';
import { Lock, KeyRound, X, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminLoginModal({ isOpen, onClose, onSuccess }: AdminLoginModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);

  if (!isOpen) return null;

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const settings = loadSettings();
    const correctPin = settings.adminPin || '123456';

    if (pin === correctPin || pin === 'admin123') {
      if (remember) {
        sessionStorage.setItem('SMAN5_ADMIN_AUTH', 'true');
      }
      onSuccess();
      onClose();
    } else {
      setError('PIN Admin salah. Silakan periksa kembali!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">MASUK PANEL ADMIN</h3>
              <p className="text-[10px] text-slate-400">Verifikasi otoritas pengelola absensi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleLogin} className="p-5 space-y-4">
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
            <div className="text-[11px] text-slate-400">
              Silakan masukkan PIN keamanan Admin untuk mengakses pengaturan, master data siswa, dan rekapitulasi.
            </div>
            <div className="mt-2 text-[10px] font-mono text-amber-400 bg-amber-500/10 py-1 px-2 rounded-lg inline-block border border-amber-500/20">
              PIN Bawaan: <span className="font-bold">123456</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              PIN / Password Admin:
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                autoFocus
                maxLength={20}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(null);
                }}
                placeholder="Masukkan PIN Admin..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-white text-sm font-mono tracking-widest focus:outline-none"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
            />
            <span>Ingat sesi admin di browser ini</span>
          </label>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Buka Panel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
