import { useState } from 'react';
import { RekapKelasData, DailyTrendData } from '../types';
import { Clock, BarChart3, TrendingUp } from 'lucide-react';

interface ChartsSectionProps {
  listTerlambat: Array<{
    nisn: string;
    nama: string;
    kelas: string;
    jamDatang: string;
    status: string;
  }>;
  rekapKelas: RekapKelasData;
  dailyTrend: DailyTrendData;
}

export function ChartsSection({
  listTerlambat,
  rekapKelas,
  dailyTrend,
}: ChartsSectionProps) {
  const [activeTab, setActiveTab] = useState<'bar' | 'trend'>('bar');

  const kelasLabels = Object.keys(rekapKelas || {}).sort();

  // Find max stack value for scaling the bar chart
  const maxStackTotal = Math.max(
    ...kelasLabels.map((k) => {
      const d = rekapKelas[k];
      return (
        (d.totalHadir || d.hadir || 0) +
        (d.bolos || 0) +
        (d.alfa || 0) +
        (d.sakit || 0) +
        (d.izin || 0) +
        (d.izinPulang || 0) +
        (d.belum || 0)
      );
    }),
    8
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* List Siswa Terlambat */}
      <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 flex flex-col h-72">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Siswa Terlambat</span>
          </h4>
          <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
            {listTerlambat.length}
          </span>
        </div>

        <div className="overflow-y-auto flex-1 pr-1 border border-slate-800/80 rounded-xl bg-slate-950">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-slate-900 text-slate-400 sticky top-0 font-semibold">
              <tr>
                <th className="p-2">Nama</th>
                <th className="p-2">Kelas</th>
                <th className="p-2 text-right">Jam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {listTerlambat.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-slate-500 italic">
                    Tidak ada siswa terlambat hari ini
                  </td>
                </tr>
              ) : (
                listTerlambat.map((s, idx) => (
                  <tr key={`${s.nisn}-${idx}`} className="hover:bg-amber-500/10 transition">
                    <td className="p-2 font-bold text-slate-200 truncate max-w-[120px]" title={s.nama}>
                      {s.nama}
                    </td>
                    <td className="p-2 text-slate-400">{s.kelas}</td>
                    <td className="p-2 text-right font-mono text-amber-400 font-bold">{s.jamDatang}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart Per Kelas & Trend View */}
      <div className="md:col-span-2 bg-slate-900 p-4 rounded-3xl border border-slate-800 h-72 flex flex-col justify-between">
        <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
              {activeTab === 'bar' ? (
                <>
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Rekapitulasi Kehadiran per Kelas</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Grafik Perkembangan Kehadiran Harian ({dailyTrend.monthName})</span>
                </>
              )}
            </h4>
          </div>

          {/* Toggle Tab */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px]">
            <button
              type="button"
              onClick={() => setActiveTab('bar')}
              className={`px-2.5 py-0.5 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'bar'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Per Kelas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('trend')}
              className={`px-2.5 py-0.5 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'trend'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tren Bulanan
            </button>
          </div>
        </div>

        {/* Tab 1: Stacked Bar Chart per Class */}
        {activeTab === 'bar' ? (
          <div className="flex-1 flex flex-col justify-end min-h-0">
            <div className="flex items-end gap-3 h-40 px-2 pt-6 pb-2 overflow-x-auto border-b border-slate-800">
              {kelasLabels.map((k) => {
                const item = rekapKelas[k];
                const hadir = item.totalHadir || item.hadir || 0;
                const bolos = item.bolos || 0;
                const alfa = item.alfa || 0;
                const sakit = item.sakit || 0;
                const izin = item.izin || 0;
                const izinPulang = item.izinPulang || 0;
                const belum = item.pulangTanpaDatang || item.belum || 0;

                const stackTotal = hadir + bolos + alfa + sakit + izin + izinPulang + belum;
                const barHeightPct = Math.min(100, Math.max(12, (stackTotal / maxStackTotal) * 100));

                return (
                  <div key={k} className="flex-1 flex flex-col items-center min-w-[50px] group">
                    {/* Top label: Hadir Count */}
                    <span className="text-[10px] font-extrabold text-indigo-300 mb-1 group-hover:scale-110 transition">
                      {hadir > 0 ? `${hadir} Hadir` : '0'}
                    </span>

                    {/* Stacked Bar container */}
                    <div
                      style={{ height: `${barHeightPct}%` }}
                      className="w-8 rounded-t-lg overflow-hidden flex flex-col-reverse shadow bg-slate-950 border border-slate-700/60"
                      title={`${k}: Hadir ${hadir}, Bolos ${bolos}, Alfa ${alfa}, Sakit ${sakit}, Izin ${izin}, Pulang Cepat ${izinPulang}`}
                    >
                      {/* Stack segments */}
                      {hadir > 0 && (
                        <div
                          style={{ flex: hadir }}
                          className="bg-indigo-500 hover:bg-indigo-400 transition"
                        />
                      )}
                      {bolos > 0 && (
                        <div
                          style={{ flex: bolos }}
                          className="bg-purple-600 hover:bg-purple-500 transition"
                        />
                      )}
                      {alfa > 0 && (
                        <div
                          style={{ flex: alfa }}
                          className="bg-rose-500 hover:bg-rose-400 transition"
                        />
                      )}
                      {sakit > 0 && (
                        <div
                          style={{ flex: sakit }}
                          className="bg-red-600 hover:bg-red-500 transition"
                        />
                      )}
                      {izin > 0 && (
                        <div
                          style={{ flex: izin }}
                          className="bg-cyan-500 hover:bg-cyan-400 transition"
                        />
                      )}
                      {izinPulang > 0 && (
                        <div
                          style={{ flex: izinPulang }}
                          className="bg-fuchsia-500 hover:bg-fuchsia-400 transition"
                        />
                      )}
                      {belum > 0 && (
                        <div
                          style={{ flex: belum }}
                          className="bg-orange-500 hover:bg-orange-400 transition"
                        />
                      )}
                    </div>

                    {/* X-axis Class label */}
                    <span className="text-[10px] font-bold text-slate-300 mt-1.5 truncate max-w-[55px] text-center">
                      {k}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-2 text-[9px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />
                Hadir
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-600 inline-block" />
                Bolos
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
                Alfa
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-600 inline-block" />
                Sakit
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 inline-block" />
                Izin
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-fuchsia-500 inline-block" />
                Pulang Cepat
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-orange-500 inline-block" />
                Pulang Tanpa Datang
              </span>
            </div>
          </div>
        ) : (
          /* Tab 2: Monthly Trend Visualizer */
          <div className="flex-1 flex flex-col justify-end min-h-0">
            <div className="flex items-end gap-1 h-44 px-2 pt-6 pb-2 overflow-x-auto border-b border-slate-800">
              {dailyTrend.labels.map((dayNum, idx) => {
                const hadirCount = dailyTrend.totalHadir[idx] || 0;
                const maxHadir = Math.max(...dailyTrend.totalHadir, 30);
                const heightPct = (hadirCount / maxHadir) * 100;

                return (
                  <div key={dayNum} className="flex-1 flex flex-col items-center min-w-[14px] group">
                    <div
                      style={{ height: `${Math.max(4, heightPct)}%` }}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 rounded-t-sm transition relative"
                      title={`Tanggal ${dayNum} ${dailyTrend.monthName}: ${hadirCount} Hadir`}
                    >
                      {hadirCount > 0 && (
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-5 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] px-1 rounded font-bold pointer-events-none z-20">
                          {hadirCount}
                        </div>
                      )}
                    </div>
                    <span className="text-[8px] font-mono text-slate-500 mt-1">
                      {dayNum % 2 === 1 ? dayNum : ''}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-2">
              Statistik kehadiran harian siswa bulan {dailyTrend.monthName}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
