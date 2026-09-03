import { useState, useMemo, useEffect } from 'react';
import QRCode from 'qrcode';
import { Siswa } from '../types';
import { SchoolLogo } from './SchoolLogo';
import { X, Search, Zap, Check, QrCode as QrIcon, Printer } from 'lucide-react';

function StudentQRCodeImage({ value }: { value: string }) {
  const [qrSrc, setQrSrc] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(value, {
      width: 140,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) setQrSrc(url);
      })
      .catch((err) => console.error('Error generating QR:', err));

    return () => {
      isMounted = false;
    };
  }, [value]);

  if (!qrSrc) {
    return <div className="w-20 h-20 bg-slate-100 rounded-lg animate-pulse" />;
  }

  return (
    <img
      src={qrSrc}
      alt={`QR Code ${value}`}
      className="w-20 h-20 object-contain rounded-md border border-slate-200 shadow-sm"
    />
  );
}

interface StudentCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Siswa[];
  onTestScan: (nis: string) => void;
}

export function StudentCardsModal({
  isOpen,
  onClose,
  students,
  onTestScan,
}: StudentCardsModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [scannedId, setScannedId] = useState<string | null>(null);

  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => set.add(s.kelas));
    return Array.from(set).sort();
  }, [students]);

  const filtered = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const cls = selectedClass.trim().toLowerCase();

    return students.filter((s) => {
      const matchSearch =
        !search ||
        s.nama.toLowerCase().includes(search) ||
        s.nis.toLowerCase().includes(search);
      const matchClass = !cls || s.kelas.toLowerCase() === cls;
      return matchSearch && matchClass;
    });
  }, [students, searchTerm, selectedClass]);

  if (!isOpen) return null;

  const handleQuickScan = (nis: string) => {
    setScannedId(nis);
    onTestScan(nis);
    setTimeout(() => {
      setScannedId(null);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950 p-1 border border-slate-800 shrink-0">
              <SchoolLogo />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                KARTU SISWA & SIMULASI SCANNER (SMA NEGERI 05 BOMBANA)
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Pilih atau klik kartu siswa di bawah untuk menguji pemindaian absensi kilat secara
                langsung.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari siswa atau NISN..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 w-48 sm:w-60"
              />
            </div>

            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="">Semua Kelas</option>
              {availableClasses.map((c) => (
                <option key={c} value={c}>
                  Kelas {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold text-slate-400">
              Ditemukan: <span className="text-white font-mono font-bold">{filtered.length}</span> siswa
            </span>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-md cursor-pointer printable-button"
              title="Cetak kartu siswa ini"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Kartu ({filtered.length})</span>
            </button>
          </div>
        </div>

        {/* Card Grid */}
        <div className="p-4 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map((s) => {
            const isJustScanned = scannedId === s.nis;
            return (
              <div
                key={s.nis}
                className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between relative group shadow"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
                    <span className="text-[9px] font-extrabold text-sky-400 uppercase tracking-wider">
                      SMAN 05 BOMBANA
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {s.kelas}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-white text-xs leading-snug line-clamp-1 group-hover:text-amber-300 transition">
                    {s.nama}
                  </h4>

                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>NISN: {s.nis}</span>
                    {s.waOrangtua && (
                      <span className="text-[9px] text-emerald-400">WA Orang Tua ✔</span>
                    )}
                  </div>

                  {/* Visual QR Code & Barcode */}
                  <div className="my-2.5 p-2 bg-white rounded-xl flex items-center justify-between gap-3 shadow-inner">
                    <div className="flex flex-col items-center justify-center shrink-0">
                      <StudentQRCodeImage value={s.nis} />
                      <span className="text-[8px] font-black text-slate-800 tracking-wider uppercase mt-1 flex items-center gap-0.5">
                        <QrIcon className="w-2.5 h-2.5" />
                        <span>Scan QR HP</span>
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center border-l border-slate-200 pl-2">
                      <div className="flex items-center gap-[2px] h-9 w-full justify-center">
                        {s.nis.split('').map((char, ci) => {
                          const width = (parseInt(char, 10) % 3) + 1;
                          return (
                            <div
                              key={ci}
                              style={{ width: `${width * 1.8}px` }}
                              className="bg-black h-full"
                            />
                          );
                        })}
                      </div>
                      <span className="text-[10px] font-mono font-black text-black tracking-widest mt-1">
                        *{s.nis}*
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scan Button */}
                <button
                  type="button"
                  onClick={() => handleQuickScan(s.nis)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer no-print ${
                    isJustScanned
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                  }`}
                >
                  {isJustScanned ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>TERSCAN!</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>SIMULASIKAN SCAN</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
