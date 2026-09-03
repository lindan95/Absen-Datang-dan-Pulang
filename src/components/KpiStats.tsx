import { DashboardStats } from '../types';

interface KpiStatsProps {
  stats: DashboardStats;
}

export function KpiStats({ stats }: KpiStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-10 gap-2.5">
      {/* Total Siswa */}
      <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
        <h3 className="text-lg font-black text-white mt-1">{stats.totalSiswa || 0}</h3>
      </div>

      {/* Hadir Tepat Waktu */}
      <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-emerald-500/30 transition">
        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Hadir Tepat</p>
        <h3 className="text-lg font-black text-emerald-400 mt-1">{stats.totalHadirTepat || 0}</h3>
      </div>

      {/* Terlambat */}
      <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-amber-500/30 transition">
        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Terlambat</p>
        <h3 className="text-lg font-black text-amber-400 mt-1">{stats.totalTerlambat || 0}</h3>
      </div>

      {/* Bolos */}
      <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-purple-500/30 transition">
        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Bolos</p>
        <h3 className="text-lg font-black text-purple-400 mt-1">{stats.totalBolos || 0}</h3>
      </div>

      {/* Alfa */}
      <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-rose-500/30 transition">
        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Alfa</p>
        <h3 className="text-lg font-black text-rose-400 mt-1">{stats.totalAlfa || 0}</h3>
      </div>

      {/* Sakit */}
      <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-red-500/30 transition">
        <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Sakit</p>
        <h3 className="text-lg font-black text-red-400 mt-1">{stats.totalSakit || 0}</h3>
      </div>

      {/* Izin */}
      <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-cyan-500/30 transition">
        <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Izin</p>
        <h3 className="text-lg font-black text-cyan-400 mt-1">{stats.totalIzin || 0}</h3>
      </div>

      {/* Izin Pulang Cepat */}
      <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-fuchsia-500/30 transition">
        <p className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider">Pulang Cepat</p>
        <h3 className="text-lg font-black text-fuchsia-400 mt-1">{stats.totalIzinPulang || 0}</h3>
      </div>

      {/* Pulang Tanpa Datang */}
      <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-orange-500/30 transition">
        <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Pulang Tanpa Datang</p>
        <h3 className="text-lg font-black text-orange-400 mt-1">{stats.totalPulangTanpaDatang || 0}</h3>
      </div>

      {/* Kehadiran % */}
      <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between col-span-2 sm:col-span-1 hover:border-indigo-500/30 transition">
        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Hadir %</p>
        <h3 className="text-lg font-black text-indigo-400 mt-1">{stats.persentaseHadir}%</h3>
      </div>
    </div>
  );
}
