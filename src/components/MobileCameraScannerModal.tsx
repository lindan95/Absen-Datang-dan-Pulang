import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  RotateCw,
  Zap,
  ZapOff,
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sun,
  Home,
  Volume2,
  VolumeX,
  Smartphone,
  ScanLine,
} from 'lucide-react';
import { catatAbsen, loadStudents } from '../data/database';
import {
  playSuccessBeep,
  playLateBeep,
  playWarningBeep,
  playErrorBeep,
  sanitizeNameForSpeech,
  speakText,
} from '../utils/audio';
import { RecentScanLog, Siswa } from '../types';

interface MobileCameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: () => void;
  initialMode?: 'DATANG' | 'PULANG';
  onAddLog?: (log: RecentScanLog) => void;
}

interface ScanResultFeedback {
  type: 'success' | 'late' | 'error' | 'warning';
  title: string;
  name: string;
  nisn: string;
  kelas: string;
  timeStr: string;
  statusText: string;
}

export function MobileCameraScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  initialMode = 'DATANG',
  onAddLog,
}: MobileCameraScannerModalProps) {
  const [currentMode, setCurrentMode] = useState<'DATANG' | 'PULANG'>(initialMode);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [activeFeedback, setActiveFeedback] = useState<ScanResultFeedback | null>(null);
  const [scanCount, setScanCount] = useState<number>(0);
  const [recentScans, setRecentScans] = useState<Array<{ name: string; time: string; status: string }>>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastScanCodeRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync mode if initialMode changes
  useEffect(() => {
    setCurrentMode(initialMode);
  }, [initialMode]);

  // Handle Scan Logic
  const handleDetectedCode = useCallback(
    (rawCode: string) => {
      const code = rawCode.trim();
      if (!code) return;

      const now = Date.now();
      // Debounce: ignore repeated detections of the same student within 2.5s
      if (code === lastScanCodeRef.current && now - lastScanTimeRef.current < 2500) {
        return;
      }

      lastScanCodeRef.current = code;
      lastScanTimeRef.current = now;

      // Haptic feedback if supported on mobile
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([100, 50, 100]);
        } catch {
          // Ignore
        }
      }

      const timeFormatted = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const result = catatAbsen(code, currentMode);

      if (result.success) {
        setScanCount((c) => c + 1);

        if (result.isTerlambat) {
          if (soundEnabled) {
            playLateBeep();
            speakText(`${sanitizeNameForSpeech(result.nama)}, terlambat`);
          }
          setActiveFeedback({
            type: 'late',
            title: '⏰ ABSENSI DITERIMA (TERLAMBAT)',
            name: result.nama,
            nisn: code,
            kelas: result.kelas || '-',
            timeStr: timeFormatted,
            statusText: 'Terlambat',
          });
        } else {
          if (soundEnabled) {
            playSuccessBeep();
            speakText(
              `${sanitizeNameForSpeech(result.nama)}, absen ${currentMode.toLowerCase()} berhasil`
            );
          }
          setActiveFeedback({
            type: 'success',
            title: currentMode === 'DATANG' ? '✅ BERHASIL ABSEN DATANG' : '🔵 BERHASIL ABSEN PULANG',
            name: result.nama,
            nisn: code,
            kelas: result.kelas || '-',
            timeStr: timeFormatted,
            statusText: result.status || currentMode,
          });
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

        if (onAddLog) onAddLog(newLog);
        setRecentScans((prev) => [
          { name: result.nama, time: timeFormatted, status: result.status || currentMode },
          ...prev.slice(0, 4),
        ]);

        onScanSuccess();
      } else {
        if (soundEnabled) {
          playErrorBeep();
          speakText('Siswa tidak ditemukan');
        }
        setActiveFeedback({
          type: 'error',
          title: '❌ KARTU TIDAK TERDAFTAR',
          name: result.message || 'Siswa tidak ditemukan dalam database',
          nisn: code,
          kelas: '-',
          timeStr: timeFormatted,
          statusText: 'Gagal',
        });
      }

      // Auto-hide feedback card after 3 seconds
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = setTimeout(() => {
        setActiveFeedback(null);
      }, 3000);
    },
    [currentMode, soundEnabled, onAddLog, onScanSuccess]
  );

  // Initialize and run Camera Stream
  useEffect(() => {
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      setIsTorchOn(false);
      return;
    }

    let isSubscribed = true;
    setCameraError(null);

    const constraints: MediaStreamConstraints = {
      audio: false,
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    };

    navigator.mediaDevices
      ?.getUserMedia(constraints)
      .then((stream) => {
        if (!isSubscribed) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const videoTrack = stream.getVideoTracks()[0];
        trackRef.current = videoTrack;

        // Check if torch/flashlight is supported
        if (videoTrack && typeof (videoTrack as any).getCapabilities === 'function') {
          const capabilities = (videoTrack as any).getCapabilities();
          setHasTorch(!!capabilities?.torch);
        } else {
          setHasTorch(false);
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.play().catch(() => {
            // Auto-play was prevented
          });
        }

        // Native BarcodeDetector if available as optional fast check
        let nativeBarcodeDetector: any = null;
        if ('BarcodeDetector' in window) {
          try {
            nativeBarcodeDetector = new (window as any).BarcodeDetector({
              formats: ['qr_code', 'code_128', 'code_39', 'ean_13'],
            });
          } catch {
            nativeBarcodeDetector = null;
          }
        }

        // Continuous Scanning Frame Loop
        let lastScanAttempt = 0;
        const scanFrame = async () => {
          if (!isSubscribed) return;

          const video = videoRef.current;
          const canvas = canvasRef.current;

          if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
            const now = Date.now();
            // Run scanner every 120ms to save mobile battery while staying super responsive
            if (now - lastScanAttempt >= 120) {
              lastScanAttempt = now;

              const width = video.videoWidth;
              const height = video.videoHeight;

              if (width > 0 && height > 0) {
                // Try Native BarcodeDetector first if available
                let detected = false;
                if (nativeBarcodeDetector) {
                  try {
                    const barcodes = await nativeBarcodeDetector.detect(video);
                    if (barcodes.length > 0 && barcodes[0].rawValue) {
                      handleDetectedCode(barcodes[0].rawValue);
                      detected = true;
                    }
                  } catch {
                    // Fall back to jsQR
                  }
                }

                // Fall back to pure jsQR (works on all iOS Safari, Chrome, WebView, etc.)
                if (!detected) {
                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d', { willReadFrequently: true });
                  if (ctx) {
                    ctx.drawImage(video, 0, 0, width, height);
                    const imageData = ctx.getImageData(0, 0, width, height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                      inversionAttempts: 'dontInvert',
                    });

                    if (code && code.data) {
                      handleDetectedCode(code.data);
                    }
                  }
                }
              }
            }
          }

          animFrameIdRef.current = requestAnimationFrame(scanFrame);
        };

        animFrameIdRef.current = requestAnimationFrame(scanFrame);
      })
      .catch((err) => {
        if (!isSubscribed) return;
        console.error('Kamera gagal diakses:', err);
        setCameraError(
          'Izin akses kamera belum diizinkan atau kamera sedang digunakan aplikasi lain. Silakan periksa pengaturan izin kamera pada browser HP Anda.'
        );
      });

    return () => {
      isSubscribed = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      trackRef.current = null;
      setIsTorchOn(false);
    };
  }, [isOpen, facingMode, handleDetectedCode]);

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!trackRef.current) return;
    try {
      const nextState = !isTorchOn;
      await (trackRef.current as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.warn('Gagal mengaktifkan senter:', err);
    }
  };

  // Flip Camera (Front / Rear)
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between p-2 sm:p-4 animate-in fade-in duration-200">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Controls Bar */}
      <div className="w-full max-w-lg flex items-center justify-between px-2 py-2 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white leading-tight flex items-center gap-1.5">
              <span>SCANNER KAMERA HP</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </h3>
            <p className="text-[10px] text-slate-400">SMA NEGERI 05 BOMBANA</p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          {hasTorch && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isTorchOn
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title={isTorchOn ? 'Matikan Senter' : 'Nyalakan Senter'}
            >
              {isTorchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
            </button>
          )}

          <button
            type="button"
            onClick={toggleFacingMode}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Balik Kamera (Depan/Belakang)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              soundEnabled
                ? 'bg-slate-900/80 text-emerald-400 border-slate-700'
                : 'bg-slate-900/80 text-slate-500 border-slate-700'
            }`}
            title={soundEnabled ? 'Suara Aktif' : 'Suara Senyap'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white transition cursor-pointer ml-1"
            title="Tutup Scanner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Switcher: DATANG vs PULANG */}
      <div className="w-full max-w-sm px-2 py-1 z-20">
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-xl">
          <button
            type="button"
            onClick={() => setCurrentMode('DATANG')}
            className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              currentMode === 'DATANG'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400/50'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>☀️ ABSEN DATANG</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentMode('PULANG')}
            className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              currentMode === 'PULANG'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/50'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>🏠 ABSEN PULANG</span>
          </button>
        </div>
      </div>

      {/* Center Viewport Area */}
      <div className="relative w-full max-w-md flex-1 my-2 rounded-3xl overflow-hidden bg-black border-2 border-slate-800 shadow-2xl flex items-center justify-center">
        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />

        {/* Camera Error Message */}
        {cameraError && (
          <div className="absolute inset-0 bg-slate-950/90 p-6 flex flex-col items-center justify-center text-center z-30">
            <AlertTriangle className="w-12 h-12 text-rose-500 mb-3" />
            <h4 className="text-sm font-bold text-white mb-1">Akses Kamera Bermasalah</h4>
            <p className="text-xs text-slate-400 max-w-xs mb-4">{cameraError}</p>
            <button
              type="button"
              onClick={() => {
                setCameraError(null);
                setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Coba Kamera Lain
            </button>
          </div>
        )}

        {/* Viewfinder Reticle Overlay with Laser Animation */}
        {!cameraError && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 z-10">
            {/* Target Reticle Box */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl border-2 border-dashed border-emerald-400/70 shadow-2xl flex items-center justify-center overflow-hidden">
              {/* Four Corner Accents */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

              {/* Laser Scanning Animation Line */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-bounce" />

              {/* Center Guidance Hint */}
              <div className="text-center px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10">
                <p className="text-[11px] font-bold text-white tracking-wide">
                  Arahkan QR Kartu ke Sini
                </p>
                <p className="text-[9px] text-emerald-400 font-mono">
                  Mode: {currentMode}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Live HUD Feedback Card when Scanned */}
        {activeFeedback && (
          <div className="absolute bottom-4 inset-x-4 z-30 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div
              className={`p-4 rounded-2xl shadow-2xl backdrop-blur-md border ${
                activeFeedback.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500 text-white'
                  : activeFeedback.type === 'late'
                  ? 'bg-amber-950/90 border-amber-500 text-white'
                  : 'bg-rose-950/90 border-rose-500 text-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    activeFeedback.type === 'success'
                      ? 'bg-emerald-500 text-slate-950'
                      : activeFeedback.type === 'late'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-rose-500 text-white'
                  }`}
                >
                  {activeFeedback.type === 'success' && <CheckCircle2 className="w-6 h-6" />}
                  {activeFeedback.type === 'late' && <AlertTriangle className="w-6 h-6" />}
                  {activeFeedback.type === 'error' && <XCircle className="w-6 h-6" />}
                </div>

                <div className="flex-1 min-w-0">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider mb-1 ${
                      activeFeedback.type === 'success'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : activeFeedback.type === 'late'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {activeFeedback.title}
                  </span>

                  <h4 className="text-base font-extrabold text-white truncate leading-tight">
                    {activeFeedback.name}
                  </h4>

                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-300 font-mono">
                    <span>NISN: {activeFeedback.nisn}</span>
                    {activeFeedback.kelas !== '-' && <span>• Kelas {activeFeedback.kelas}</span>}
                    <span>• {activeFeedback.timeStr}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Summary Bar & Quick Tips */}
      <div className="w-full max-w-md px-3 py-2 z-20 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400">Total Scan Sesi Ini:</span>
          <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded-lg">
            {scanCount} Siswa
          </span>
        </div>

        {recentScans.length > 0 && (
          <div className="text-[11px] text-slate-400 truncate max-w-[170px]">
            Terakhir: <span className="text-emerald-400 font-bold">{recentScans[0].name}</span>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
        >
          Selesai
        </button>
      </div>
    </div>
  );
}
