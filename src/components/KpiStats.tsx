import { DashboardStats } from '../types';

interface KpiStatsProps {
  stats: DashboardStats;
  selectedStatus?: string;
  onSelectStatus?: (status: string) => void;
}

export function KpiStats({ stats, selectedStatus = '', onSelectStatus }: KpiStatsProps) {
  const handleClick = (st: string) => {
    if (!onSelectStatus) return;
    // Toggle: if already selected, clicking it again clears the filter
    if (selectedStatus === st) {
      onSelectStatus('');
    } else {
      onSelectStatus(st);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-10 gap-2.5">
      {/* Total Siswa */}
      <button
        type="button"
        onClick={() => handleClick('')}
        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
          selectedStatus === ''
            ? 'bg-slate-800 border-indigo-500 shadow-md shadow-indigo-500/10'
            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
        }`}
        title="Klik untuk melihat semua siswa"
      >
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
        <h3 className="text-lg font-black text-white mt-1">{stats.totalSiswa || 0}</h3>
      </button>

      {/* Hadir Tepat Waktu */}
      <button
        type="button"
        onClick={() => handleClick('HADIR')}
        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
          selectedStatus === 'HADIR'
            ? 'bg-emerald-500/20 border-emerald-400 shadow-md shadow-emerald-500/20'
            : 'bg-slate-900 border-slate-800 hover:border-emerald-500/30'
        }`}
        title="Klik untuk filter Hadir Tepat"
      >
        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Hadir Tepat</p>
        <h3 className="text-lg font-black text-emerald-400 mt-1">{stats.totalHadirTepat || 0}</h3>
      </button>

      {/* Terlambat */}
      <button
        type="button"
        onClick={() => handleClick('TERLAMBAT')}
        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
          selectedStatus === 'TERLAMBAT'
            ? 'bg-amber-500/20 border-amber-400 shadow-md shadow-amber-500/20'
            : 'bg-slate-900 border-slate-800 hover:border-amber-500/30'
        }`}
        title="Klik untuk filter Terlambat"
      >
        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Terlambat</p>
        <h3 className="text-lg font-black text-amber-400 mt-1">{stats.totalTerlambat || 0}</h3>
      </button>

      {/* Bolos */}
      <button
        type="button"
        onClick={() => handleClick('BOLOS')}
        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
          selectedStatus === 'BOLOS'
            ? 'bg-purple-500/20 border-purple-400 shadow-md shadow-purple-500/20'
            : 'bg-slate-900 border-slate-800 hover:border-purple-500/30'
        }`}
        title="Klik untuk filter Bolos"
      >
        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Bolos</p>
        <h3 className="text-lg font-black text-purple-400 mt-1">{stats.totalBolos || 0}</h3>
      </button>

      {/* Alfa */}
      <button
        type="button"
        onClick={() => handleClick('ALFA')}
        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
          selectedStatus === 'ALFA'
            ? 'bg-rose-500/20 border-rose-400 shadow-md shadow-rose-500/20'
            : 'bg-slate-900 border-slate-800 hover:border-rose-500/30'
        }`}
        title="Klik untuk filter Alfa"
      >
        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Alfa</p>
        <h3 className="text-lg font-black text-rose-400 mt-1">{stats.totalAlfa || 0}</h3>
      </button>

      {/* Sakit */}
      <button
        type="button"
        onClick={() => handleClick('SAKIT')}
        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
          selectedStatus === 'SAKIT'
            ? 'bg-red-500/20 border-red-400 shadow-md shadow-red-500/20'
            : 'bg-slate-900 border-slate-800 hover:border-red-500/30'
        }`}
        title="Klik untuk filter Sakit"
      >
        <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Sakit</p>
        <h3 className="text-lg font-black text-red-400 mt-1">{stats.totalSakit || 0}</h3>
      </button>

      {/* Izin */}
      <button
        type="button"
        onClick={() => handleClick('IZIN')}
        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
          selectedStatus === 'IZIN'
            ? 'bg-cyan-500/20 border-cyan-400 shadow-md shadow-cyan-500/20'
            : 'bg-slate-900 border-slate-800 hover:border-cyan-500/30'
        }`}
        title="Klik untuk filter Izin"
      >
        <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Izin</p>
        <h3 className="text-lg font-black text-cyan-400 mt-1">{stats.totalIzin || 0}</h3>
      </button>

      {/* Izin Pulang Cepat */}
      <button
        type="button"
        onClick={() => handleClick('IZIN PULANG')}
        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
          selectedStatus === 'IZIN PULANG'
            ? 'bg-fuchsia-500/20 border-fuchsia-400 shadow-md shadow-fuchsia-500/20'
            : 'bg-slate-900 border-slate-800 hover:border-fuchsia-500/30'
        }`}
        title="Klik untuk filter Pulang Cepat"
      >
        <p className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider">Pulang Cepat</p>
        <h3 className="text-lg font-black text-fuchsia-400 mt-1">{stats.totalIzinPulang || 0}</h3>
      </button>

      {/* Pulang Tanpa Datang */}
      <button
        type="button"
        onClick={() => handleClick('PULANG TANPA DATANG')}
        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
          selectedStatus === 'PULANG TANPA DATANG'
            ? 'bg-orange-500/20 border-orange-400 shadow-md shadow-orange-500/20'
            : 'bg-slate-900 border-slate-800 hover:border-orange-500/30'
        }`}
        title="Klik untuk filter Pulang Tanpa Datang"
      >
        <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Pulang Tanpa Datang</p>
        <h3 className="text-lg font-black text-orange-400 mt-1">{stats.totalPulangTanpaDatang || 0}</h3>
      </button>

      {/* Kehadiran % */}
      <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between col-span-2 sm:col-span-1">
        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Hadir %</p>
        <h3 className="text-lg font-black text-indigo-400 mt-1">{stats.persentaseHadir}%</h3>
      </div>
    </div>
  );
}
