import { useState, useEffect, useCallback } from 'react';
import { WABatchResult, WABatchItem } from '../types';
import { getWhatsAppBatch, markWhatsAppProcessedBatch } from '../data/database';
import { X, ExternalLink, RefreshCw } from 'lucide-react';

interface WAModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  filterJenis: 'ALFA' | 'BOLOS' | '';
}

export function WAModal({
  isOpen,
  onClose,
  selectedDate,
  filterJenis,
}: WAModalProps) {
  const [data, setData] = useState<WABatchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadBatch = useCallback(() => {
    setIsLoading(true);
    try {
      const res = getWhatsAppBatch(selectedDate, filterJenis);
      setData(res);
    } catch (e) {
      console.error(e);
      alert('Gagal memuat daftar WhatsApp');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, filterJenis]);

  useEffect(() => {
    if (isOpen) {
      loadBatch();
    }
  }, [isOpen, loadBatch]);

  if (!isOpen) return null;

  const belumData = data ? data.items.filter((x) => x.statusProses !== 'SUDAH DIPROSES') : [];

  const handleOpenSingle = (item: WABatchItem) => {
    window.open(item.url, '_blank', 'noopener,noreferrer');
    markWhatsAppProcessedBatch([item]);
    setTimeout(() => {
      loadBatch();
    }, 400);
  };

  const handleOpenAllPending = () => {
    if (!belumData.length) return;
    const openedItems: WABatchItem[] = [];

    belumData.forEach((item) => {
      const w = window.open(item.url, '_blank', 'noopener,noreferrer');
      if (w) openedItems.push(item);
    });

    if (openedItems.length > 0) {
      markWhatsAppProcessedBatch(openedItems);
      setTimeout(() => {
        loadBatch();
      }, 500);
    }

    if (openedItems.length < belumData.length) {
      alert(
        'Sebagian tab WhatsApp diblokir oleh browser. Mohon izinkan pop-up untuk situs ini, lalu klik tombol proses lagi.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>📱</span> KIRIM SEMUA WA ORANG TUA
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Pesan dibuat otomatis dari status absensi tanggal aktif.
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
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {/* Info bar */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex flex-wrap gap-4">
            <div>
              <span className="text-slate-500">Tanggal:</span>{' '}
              <span className="font-bold text-white">{selectedDate}</span>
            </div>
            <div>
              <span className="text-slate-500">Data:</span>{' '}
              <span className="font-bold text-indigo-400">{data?.message || '-'}</span>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-2.5">
              <div className="text-[9px] text-slate-500 font-bold uppercase">TOTAL</div>
              <div className="text-lg font-black text-white">{data?.total || 0}</div>
            </div>
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-2.5">
              <div className="text-[9px] text-slate-500 font-bold uppercase">BELUM PROSES</div>
              <div className="text-lg font-black text-amber-400">{data?.belumDiproses || 0}</div>
            </div>
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-2.5">
              <div className="text-[9px] text-slate-500 font-bold uppercase">SUDAH PROSES</div>
              <div className="text-lg font-black text-emerald-400">{data?.sudahDiproses || 0}</div>
            </div>
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-2.5">
              <div className="text-[9px] text-slate-500 font-bold uppercase">FILTER</div>
              <div className="text-sm font-black text-indigo-400 mt-1">
                {filterJenis || 'ALFA & BOLOS'}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleOpenAllPending}
              disabled={!belumData.length || isLoading}
              className={`px-4 py-2.5 rounded-xl text-white text-xs font-black transition shadow-lg cursor-pointer ${
                belumData.length
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              {belumData.length
                ? `BUKA & PROSES ${belumData.length} YANG BELUM`
                : 'SEMUA SUDAH DIPROSES'}
            </button>
            <button
              type="button"
              onClick={loadBatch}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>REFRESH STATUS</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black transition cursor-pointer"
            >
              TUTUP
            </button>
          </div>

          {/* Warning notice */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 leading-relaxed">
            Tanpa API pihak ketiga, browser akan membuka chat WhatsApp Web dengan teks yang sudah
            terisi otomatis. Status <b>SUDAH DIPROSES</b> menandai bahwa chat telah berhasil dibuka.
            Silakan klik tombol <b>Kirim</b> di WhatsApp untuk pengiriman pesan ke orang tua siswa.
          </div>

          {/* Student List */}
          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
            {!data || data.items.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs italic bg-slate-950 rounded-2xl border border-slate-800">
                Tidak ada siswa {filterJenis || 'ALFA/BOLOS'} dengan nomor WhatsApp orang tua pada
                tanggal ini.
              </div>
            ) : (
              data.items.map((item, i) => {
                const done = item.statusProses === 'SUDAH DIPROSES';
                return (
                  <div
                    key={`${item.nis}-${i}`}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-black text-white truncate">
                        {i + 1}. {item.nama}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {item.kelas} • <span className="font-bold text-amber-400">{item.jenis}</span> •{' '}
                        <span className="font-mono text-slate-500">+{item.phone}</span>
                      </div>
                      {item.waktuProses && (
                        <div className="text-[9px] text-slate-600 mt-0.5 font-mono">
                          Diproses: {item.waktuProses}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      {done ? (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[9px] font-black">
                          SUDAH DIPROSES
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[9px] font-black">
                          BELUM DIPROSES
                        </span>
                      )}

                      {!done && (
                        <button
                          type="button"
                          onClick={() => handleOpenSingle(item)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black transition cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>BUKA WA</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
