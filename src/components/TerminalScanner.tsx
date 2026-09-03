import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import {
  catatAbsen,
  initialStudents,
} from '../data/database';
import {
  playSuccessBeep,
  playLateBeep,
  playWarningBeep,
  playErrorBeep,
  sanitizeNameForSpeech,
  speakText,
} from '../utils/audio';
import { RecentScanLog, Siswa } from '../types';
import {
  Camera,
  Sun,
  Home,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Zap,
  Smartphone,
  RotateCw,
} from 'lucide-react';
import { MobileCameraScannerModal } from './MobileCameraScannerModal';

interface TerminalScannerProps {
  onScanSuccess: () => void;
  recentLogs: RecentScanLog[];
  setRecentLogs: React.Dispatch<React.SetStateAction<RecentScanLog[]>>;
  students: Siswa[];
  isMobileModalOpen?: boolean;
  setIsMobileModalOpen?: (open: boolean) => void;
}

export function TerminalScanner({
  onScanSuccess,
  recentLogs,
  setRecentLogs,
  students,
  isMobileModalOpen,
  setIsMobileModalOpen,
}: TerminalScannerProps) {
  const [currentMode, setCurrentMode] = useState<'DATANG' | 'PULANG'>('DATANG');
  const [scanInputValue, setScanInputValue] = useState('');
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const isCameraModalOpen = isMobileModalOpen !== undefined ? isMobileModalOpen : internalMobileOpen;
  const setCameraModalOpen = setIsMobileModalOpen || setInternalMobileOpen;

  const [statusState, setStatusState] = useState<{
    show: boolean;
    title: string;
    subText: string;
    bgClass: string;
  }>({
    show: false,
    title: '',
    subText: '',
    bgClass: '',
  });

  const [lastScanInfo, setLastScanInfo] = useState<{ code: string; time: number }>({
    code: '',
    time: 0,
  });

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [inlineFacingMode, setInlineFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const inlineCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hideStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus scanner input on click or standby
  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  };

  useEffect(() => {
    focusInput();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setCurrentMode('DATANG');
        focusInput();
      } else if (e.key === 'F2') {
        e.preventDefault();
        setCurrentMode('PULANG');
        focusInput();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showStatusBanner = (title: string, subText: string, bgClass: string) => {
    if (hideStatusTimerRef.current) clearTimeout(hideStatusTimerRef.current);
    setStatusState({
      show: true,
      title,
      subText,
      bgClass,
    });
    hideStatusTimerRef.current = setTimeout(() => {
      setStatusState((prev) => ({ ...prev, show: false }));
    }, 2800);
  };

  const processScan = (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    const nowTime = Date.now();
    // Debounce duplicate scans within 2 seconds
    if (code === lastScanInfo.code && nowTime - lastScanInfo.time < 2000) {
      playWarningBeep();
      showStatusBanner('⚠️ KARTU SUDAH DITERIMA', `ID: ${code}`, 'bg-amber-500 text-slate-950');
      return;
    }

    setLastScanInfo({ code, time: nowTime });

    const result = catatAbsen(code, currentMode);
    const timeFormatted = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (result.success) {
      if (result.isTerlambat) {
        playLateBeep();
        showStatusBanner(
          `⏰ SCAN BERHASIL (TERLAMBAT)`,
          `👤 ${result.nama} (${result.kelas || '-'})`,
          'bg-amber-500 text-slate-950'
        );
        speakText(`${sanitizeNameForSpeech(result.nama)}, terlambat`);
      } else {
        playSuccessBeep();
        const modeTitle = currentMode === 'DATANG' ? '✅ BERHASIL ABSEN DATANG' : '🔵 BERHASIL ABSEN PULANG';
        showStatusBanner(
          modeTitle,
          `👤 ${result.nama} (${result.kelas || '-'})`,
          currentMode === 'DATANG' ? 'bg-emerald-500 text-slate-950' : 'bg-blue-500 text-white'
        );
        speakText(`${sanitizeNameForSpeech(result.nama)}, absen berhasil`);
      }

      const newLog: RecentScanLog = {
        id: `log-${Date.now()}-${Math.random()}`,
        nis: code,
        nama: result.nama,
        kelas: result.kelas || '-',
        mode: currentMode,
        isTerlambat: !!result.isTerlambat,
        timeStr: timeFormatted,
        statusText: result.status || currentMode,
      };

      setRecentLogs((prev) => [newLog, ...prev.slice(0, 8)]);
      onScanSuccess();
    } else {
      playErrorBeep();
      showStatusBanner('❌ GAGAL DISIMPAN', result.message || 'Siswa tidak ditemukan', 'bg-rose-600 text-white');
      speakText('Siswa tidak ditemukan');

      const failedLog: RecentScanLog = {
        id: `log-${Date.now()}-${Math.random()}`,
        nis: code,
        nama: 'Siswa Tidak Ditemukan',
        kelas: '-',
        mode: currentMode,
        isTerlambat: false,
        timeStr: timeFormatted,
        statusText: 'GAGAL',
        failed: true,
      };
      setRecentLogs((prev) => [failedLog, ...prev.slice(0, 8)]);
    }

    setScanInputValue('');
    focusInput();
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processScan(scanInputValue);
  };

  // Camera Barcode/QR Scanning Handler
  useEffect(() => {
    let stream: MediaStream | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    if (isCameraActive) {
      navigator.mediaDevices
        ?.getUserMedia({
          video: {
            facingMode: { ideal: inlineFacingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.setAttribute('playsinline', 'true');
            videoRef.current.play().catch(() => {});
          }

          let nativeDetector: any = null;
          if ('BarcodeDetector' in window) {
            try {
              nativeDetector = new (window as any).BarcodeDetector({
                formats: ['qr_code', 'code_128', 'code_39', 'ean_13'],
              });
            } catch {
              nativeDetector = null;
            }
          }

          intervalId = setInterval(async () => {
            const video = videoRef.current;
            const canvas = inlineCanvasRef.current;
            if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
              let detected = false;
              if (nativeDetector) {
                try {
                  const codes = await nativeDetector.detect(video);
                  if (codes.length > 0 && codes[0].rawValue) {
                    processScan(codes[0].rawValue);
                    detected = true;
                  }
                } catch {
                  // Fall back
                }
              }

              if (!detected && canvas) {
                const w = video.videoWidth;
                const h = video.videoHeight;
                if (w > 0 && h > 0) {
                  canvas.width = w;
                  canvas.height = h;
                  const ctx = canvas.getContext('2d', { willReadFrequently: true });
                  if (ctx) {
                    ctx.drawImage(video, 0, 0, w, h);
                    const imgData = ctx.getImageData(0, 0, w, h);
                    const code = jsQR(imgData.data, imgData.width, imgData.height, {
                      inversionAttempts: 'dontInvert',
                    });
                    if (code && code.data) {
                      processScan(code.data);
                    }
                  }
                }
              }
            }
          }, 150);
        })
        .catch((err) => {
          console.warn('Camera access denied or unavailable:', err);
          alert('Kamera tidak dapat diakses atau izin ditolak. Pastikan izin kamera telah diaktifkan di browser.');
          setIsCameraActive(false);
        });
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCameraActive, inlineFacingMode]);

  // Sample students to display as quick test chips
  const quickTestStudents = (students.length > 0 ? students : initialStudents).slice(0, 6);

  return (
    <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-2xl space-y-4 flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Header Terminal */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-black text-emerald-400 tracking-wider uppercase">
              Scanner Standby
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-wide flex items-center justify-center gap-2">
            <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
            MESIN PEMINDAI
          </h2>
          <p className="text-xs text-slate-400">Dekatkan kartu / QR Code pada scanner atau masukkan NISN</p>
        </div>

        {/* Mode Absen Buttons */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setCurrentMode('DATANG');
              focusInput();
            }}
            className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              currentMode === 'DATANG'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>DATANG [F1]</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrentMode('PULANG');
              focusInput();
            }}
            className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              currentMode === 'PULANG'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>PULANG [F2]</span>
          </button>
        </div>

        {/* Scanner Input / Drop Area */}
        <form onSubmit={handleInputSubmit} className="relative">
          <div
            onClick={focusInput}
            className="relative w-full py-6 px-4 bg-slate-950 rounded-2xl border-2 border-dashed border-slate-700 hover:border-slate-500 transition flex flex-col items-center justify-center text-center space-y-2 cursor-pointer group"
          >
            <input
              ref={inputRef}
              type="text"
              value={scanInputValue}
              onChange={(e) => setScanInputValue(e.target.value)}
              placeholder="Ketik NISN lalu tekan Enter..."
              autoComplete="off"
              className="w-full text-center bg-slate-900/80 border border-slate-700 text-white font-mono text-sm py-2 px-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />

            <div className="text-3xl animate-bounce group-hover:scale-110 transition">📟</div>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-200">SIAP MEMINDAI (KILAT)</p>
              <p className="text-[10px] text-slate-500">
                Mendukung scanner barcode USB, kartu RFID/QR, atau ketik langsung
              </p>
            </div>
          </div>
        </form>

        {/* Hidden Inline Canvas for jsQR decoding */}
        <canvas ref={inlineCanvasRef} className="hidden" />

        {/* Mobile Camera QR Scanner Buttons */}
        <div className="space-y-2 pt-1">
          {/* Main Fullscreen / Dedicated Mobile Camera Scan Button */}
          <button
            type="button"
            onClick={() => setCameraModalOpen(true)}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 border border-emerald-400/40 transition-all transform active:scale-[0.99] cursor-pointer"
            title="Buka kamera HP layar penuh untuk memindai kartu siswa Datang / Pulang"
          >
            <Smartphone className="w-4 h-4" />
            <span>📱 Buka Scan QR Kamera HP (Layar Penuh)</span>
          </button>

          {/* Inline Camera Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCameraActive(!isCameraActive)}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-sky-400 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{isCameraActive ? 'Matikan Kamera Inline' : 'Aktifkan Kamera di Panel Ini'}</span>
            </button>

            {isCameraActive && (
              <button
                type="button"
                onClick={() =>
                  setInlineFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                }
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs transition cursor-pointer"
                title="Ganti Kamera Depan/Belakang"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {isCameraActive && (
            <div className="mt-2 relative rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-black aspect-video flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                autoPlay
              />

              {/* Reticle Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                <div className="relative w-40 h-40 rounded-2xl border-2 border-dashed border-emerald-400/80 shadow-2xl flex items-center justify-center overflow-hidden">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />

                  {/* Laser line animation */}
                  <div className="absolute inset-x-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-bounce" />

                  <span className="text-[9px] font-extrabold text-white bg-black/70 px-2 py-0.5 rounded border border-white/10">
                    Mode: {currentMode}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Test Chips */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              ⚡ Klik Cepat (Simulasi Kartu Siswa):
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {quickTestStudents.map((s) => (
              <button
                key={s.nis}
                type="button"
                onClick={() => processScan(s.nis)}
                className="text-left px-2 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800/80 text-[10px] text-slate-300 hover:text-white transition truncate cursor-pointer group"
                title={`Scan ${s.nama} (${s.kelas})`}
              >
                <div className="font-bold truncate text-slate-200 group-hover:text-amber-400">{s.nama}</div>
                <div className="text-[9px] font-mono text-slate-500">
                  {s.nis} • {s.kelas}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Status Banner Result */}
        {statusState.show && (
          <div
            className={`p-3 rounded-2xl text-center transition-all duration-150 animate-in fade-in zoom-in-95 shadow-xl ${statusState.bgClass}`}
          >
            <p className="text-xs sm:text-sm font-black flex items-center justify-center gap-1.5">
              {statusState.bgClass.includes('emerald') && <CheckCircle2 className="w-4 h-4" />}
              {statusState.bgClass.includes('amber') && <AlertTriangle className="w-4 h-4" />}
              {statusState.bgClass.includes('rose') && <XCircle className="w-4 h-4" />}
              {statusState.title}
            </p>
            {statusState.subText && (
              <p className="text-[11px] font-bold mt-0.5 opacity-90">{statusState.subText}</p>
            )}
          </div>
        )}
      </div>

      {/* Live Log Scan Terakhir */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
            ⚡ Riwayat Scan Sesi Ini
          </span>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
            {recentLogs.length} Siswa
          </span>
        </div>
        <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-800/80">
            {recentLogs.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-600 italic">
                Belum ada aktivitas scan sesi ini
              </div>
            ) : (
              recentLogs.map((log) => {
                let badgeColor =
                  log.mode === 'DATANG'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30';

                if (log.isTerlambat) {
                  badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
                }
                if (log.failed) {
                  badgeColor = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
                }

                return (
                  <div
                    key={log.id}
                    className="p-2.5 flex items-center justify-between text-xs bg-slate-900/40 hover:bg-slate-900 transition"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${badgeColor} shrink-0`}
                      >
                        {log.isTerlambat ? 'TERLAMBAT' : log.mode}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span
                          className={`font-extrabold truncate text-xs ${
                            log.failed ? 'text-rose-400' : 'text-white'
                          }`}
                        >
                          {log.nama}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          NISN: {log.nis} {log.kelas !== '-' && `• ${log.kelas}`}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                      {log.timeStr}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Full-Screen Mobile QR Camera Scanner Modal */}
      <MobileCameraScannerModal
        isOpen={isCameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onScanSuccess={onScanSuccess}
        initialMode={currentMode}
        onAddLog={(newLog) => setRecentLogs((prev) => [newLog, ...prev.slice(0, 8)])}
      />
    </div>
  );
}
