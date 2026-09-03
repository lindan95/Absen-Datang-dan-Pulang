import React, { useState } from 'react';
import { AppSettings } from '../../types';
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from '../../data/database';
import {
  Settings,
  Clock,
  Building2,
  Lock,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from 'lucide-react';

interface AdminSettingsTabProps {
  onSettingsSaved: () => void;
}

export function AdminSettingsTab({ onSettingsSaved }: AdminSettingsTabProps) {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(settings);
    showToast('success', 'Pengaturan waktu & identitas sekolah berhasil disimpan!');
    onSettingsSaved();
  };

  const handleResetDefaults = () => {
    if (window.confirm('Kembalikan semua pengaturan batas jam dan identitas ke bawaan pabrik?')) {
      setSettings(DEFAULT_SETTINGS);
      saveSettings(DEFAULT_SETTINGS);
      showToast('success', 'Pengaturan berhasil dikembalikan ke standar awal.');
      onSettingsSaved();
    }
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPinInput) {
      showToast('error', 'Masukkan PIN saat ini terlebih dahulu.');
      return;
    }
    if (currentPinInput !== settings.adminPin && currentPinInput !== 'admin123') {
      showToast('error', 'PIN lama yang Anda masukkan salah!');
      return;
    }
    if (newPinInput.length < 4) {
      showToast('error', 'PIN baru minimal 4 karakter!');
      return;
    }
    if (newPinInput !== confirmPinInput) {
      showToast('error', 'Konfirmasi PIN baru tidak cocok!');
      return;
    }

    const updated = { ...settings, adminPin: newPinInput };
    setSettings(updated);
    saveSettings(updated);
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    showToast('success', 'PIN Admin berhasil diubah!');
    onSettingsSaved();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border animate-in slide-in-from-top-2 duration-200 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* SECTION 1: Batas Waktu Absensi */}
      <form
        onSubmit={handleSaveGeneral}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5"
      >
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">KONFIGURASI BATAS JAM & REKAP</h3>
              <p className="text-[11px] text-slate-400">
                Tentukan aturan otomatis status Hadir, Terlambat, Alfa, dan Pulang
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Bawaan</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Batas Datang */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
            <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-wider mb-1">
              Batas Datang Tepat
            </label>
            <input
              type="text"
              required
              value={settings.batasDatang}
              onChange={(e) => setSettings({ ...settings, batasDatang: e.target.value })}
              placeholder="07:00:00"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Lewat jam ini dianggap <b className="text-amber-400">TERLAMBAT</b>.
            </span>
          </div>

          {/* Batas Alfa */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
            <label className="block text-[10px] font-black text-rose-400 uppercase tracking-wider mb-1">
              Batas Datang (Alfa)
            </label>
            <input
              type="text"
              required
              value={settings.batasAlfa}
              onChange={(e) => setSettings({ ...settings, batasAlfa: e.target.value })}
              placeholder="08:00:00"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-rose-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Lewat jam ini & belum scan dianggap <b className="text-rose-400">ALFA</b>.
            </span>
          </div>

          {/* Batas Pulang */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
            <label className="block text-[10px] font-black text-sky-400 uppercase tracking-wider mb-1">
              Batas Jam Pulang
            </label>
            <input
              type="text"
              required
              value={settings.batasPulang}
              onChange={(e) => setSettings({ ...settings, batasPulang: e.target.value })}
              placeholder="14:20:00"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-sky-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Scan sebelum jam ini butuh <b className="text-indigo-400">IZIN PULANG</b>.
            </span>
          </div>

          {/* Tanggal Mulai Rekap */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
            <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-wider mb-1">
              Mulai Rekapitulasi
            </label>
            <input
              type="date"
              required
              value={settings.rekapMulaiDate}
              onChange={(e) => setSettings({ ...settings, rekapMulaiDate: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Batas awal akumulasi rekapitulasi semester.
            </span>
          </div>
        </div>

        {/* Identitas Sekolah */}
        <div className="border-t border-slate-800/80 pt-4 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              IDENTITAS LEMBAGA & LAPORAN
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Nama Sekolah:
              </label>
              <input
                type="text"
                value={settings.namaSekolah}
                onChange={(e) => setSettings({ ...settings, namaSekolah: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Default Petugas Piket:
              </label>
              <input
                type="text"
                value={settings.defaultAdmin}
                onChange={(e) => setSettings({ ...settings, defaultAdmin: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Nama Kepala Sekolah:
              </label>
              <input
                type="text"
                value={settings.kepalaSekolah}
                onChange={(e) => setSettings({ ...settings, kepalaSekolah: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                NIP Kepala Sekolah:
              </label>
              <input
                type="text"
                value={settings.nipKepalaSekolah}
                onChange={(e) => setSettings({ ...settings, nipKepalaSekolah: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Alamat Sekolah Lengkap:
              </label>
              <input
                type="text"
                value={settings.alamatSekolah}
                onChange={(e) => setSettings({ ...settings, alamatSekolah: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition shadow cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Konfigurasi Sistem</span>
          </button>
        </div>
      </form>

      {/* SECTION 2: Ganti PIN Keamanan Admin */}
      <form
        onSubmit={handleChangePin}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4"
      >
        <div className="border-b border-slate-800 pb-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">KEAMANAN & GANTI PIN ADMIN</h3>
            <p className="text-[11px] text-slate-400">
              Ubah kode PIN untuk mengunci akses panel admin dari perubahan tak berwenang
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              PIN Saat Ini:
            </label>
            <input
              type="password"
              required
              value={currentPinInput}
              onChange={(e) => setCurrentPinInput(e.target.value)}
              placeholder="PIN saat ini..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              PIN Baru (Min 4 Karakter):
            </label>
            <input
              type="password"
              required
              value={newPinInput}
              onChange={(e) => setNewPinInput(e.target.value)}
              placeholder="PIN baru..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Konfirmasi PIN Baru:
            </label>
            <input
              type="password"
              required
              value={confirmPinInput}
              onChange={(e) => setConfirmPinInput(e.target.value)}
              placeholder="Ulangi PIN baru..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition shadow cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Perbarui PIN Keamanan</span>
          </button>
        </div>
      </form>
    </div>
  );
}
