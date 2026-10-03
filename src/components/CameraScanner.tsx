import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  RefreshCw,
  Zap,
  ZapOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Upload,
  Sparkles,
  QrCode,
  ScanLine,
} from 'lucide-react';
import { AttendanceLog, ScanResult, Student } from '../types/attendance';
import { AttendanceService } from '../services/attendanceService';
import { StorageService } from '../services/storageService';
import { CameraBarcodeDetector } from '../utils/barcodeDetector';

export const CameraScanner: React.FC = () => {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<AttendanceLog[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [manualCode, setManualCode] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<CameraBarcodeDetector | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastScannedPayloadRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  useEffect(() => {
    detectorRef.current = new CameraBarcodeDetector();
    setStudents(StorageService.getStudents());
    refreshLogs();

    return () => {
      stopCamera();
    };
  }, []);

  const refreshLogs = () => {
    const today = AttendanceService.getTodayDate();
    const logs = StorageService.getLogs().filter((l) => l.date === today && l.method === 'BARCODE_CAMERA');
    setRecentScans(logs.slice(0, 5));
  };

  // Start camera stream
  const startCamera = async () => {
    stopCamera();
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setHasCameraPermission(true);
      startDetectionLoop();
    } catch (err) {
      console.warn('Camera access error:', err);
      setHasCameraPermission(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  // Continuous frame detection loop
  const startDetectionLoop = () => {
    const scanFrame = async () => {
      if (
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
        isScanning &&
        !isProcessing &&
        detectorRef.current
      ) {
        const detected = await detectorRef.current.detect(videoRef.current);
        if (detected && detected.rawValue) {
          const now = Date.now();
          // Prevent repeated triggers of the same barcode within 3 seconds
          if (
            lastScannedPayloadRef.current.code !== detected.rawValue ||
            now - lastScannedPayloadRef.current.time > 3000
          ) {
            lastScannedPayloadRef.current = { code: detected.rawValue, time: now };
            await handleBarcodeScanned(detected.rawValue);
          }
        }
      }
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  // Handle scanned barcode / QR
  const handleBarcodeScanned = async (payload: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const result = await AttendanceService.scanBarcode(payload, 'MOBILE-CAM-01');
      setScanResult(result);
      refreshLogs();

      setTimeout(() => {
        setIsProcessing(false);
      }, 2000);
    } catch (err) {
      console.error('Barcode scan error:', err);
      setIsProcessing(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const toggleTorch = async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as { torch?: boolean };
      if (capabilities && capabilities.torch) {
        try {
          // @ts-expect-error torch constraint
          await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
          setTorchOn(!torchOn);
        } catch (e) {
          console.warn('Torch not supported', e);
        }
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs uppercase tracking-wider text-indigo-600 font-semibold">
            Modul Pemindai Handphone & Browser
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Scan Barcode & QR Code Siswa
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dapat digunakan langsung oleh guru piket melalui kamera HP atau laptop
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleCameraFacing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Balik Kamera ({facingMode === 'environment' ? 'Belakang' : 'Depan'})</span>
          </button>
          <button
            onClick={toggleTorch}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              torchOn
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
            title="Lampu Flash"
          >
            {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Viewfinder & Live Camera */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-4/3 sm:aspect-16/9 bg-slate-950 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-xl flex items-center justify-center">
            {/* Live Video */}
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Viewfinder Overlay Frame */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
              {/* Darkened vignette around scanning square */}
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-2xl border-2 border-indigo-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                {/* 4 corner brackets */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-md" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-md" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-md" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-md" />

                {/* Animated laser scanning beam */}
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-rose-500 to-indigo-500 shadow-[0_0_12px_#6366f1] animate-laser" />
              </div>
            </div>

            {/* Camera Permission / Fallback Message */}
            {hasCameraPermission === false && (
              <div className="absolute inset-0 bg-slate-900/90 p-6 flex flex-col items-center justify-center text-center text-white space-y-3">
                <Camera className="w-12 h-12 text-slate-400" />
                <div>
                  <h3 className="font-bold text-base">Kamera Tidak Dapat Diakses</h3>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    Pastikan izin akses kamera telah diberikan pada peramban web Anda, atau gunakan
                    fitur input manual & simulasi kartu di samping.
                  </p>
                </div>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Coba Akses Kamera Lagi
                </button>
              </div>
            )}

            {/* Status chip over video */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Kamera Aktif · Arahkan ke QR / Barcode Siswa</span>
            </div>
          </div>

          {/* Manual Input Code Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Input Barcode / NISN Manual
              </label>
              <input
                type="text"
                placeholder="Masukkan Barcode (misal: SIS-0068192841) atau NISN..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualCode.trim()) {
                    handleBarcodeScanned(manualCode.trim());
                    setManualCode('');
                  }
                }}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={() => {
                if (manualCode.trim()) {
                  handleBarcodeScanned(manualCode.trim());
                  setManualCode('');
                }
              }}
              disabled={!manualCode.trim() || isProcessing}
              className="w-full sm:w-auto mt-2 sm:mt-5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              Proses Presensi
            </button>
          </div>
        </div>

        {/* Right Column: Scan Feedback & Quick Test Chips */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Scan Result Display */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Hasil Pemindaian Terakhir
            </h3>

            {scanResult ? (
              <div
                className={`p-4 rounded-xl border transition-all ${
                  scanResult.outcome === 'SUCCESS'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : scanResult.outcome === 'DOUBLE_SCAN_PREVENTED'
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex items-start gap-3">
                  {scanResult.student?.photoUrl ? (
                    <img
                      src={scanResult.student.photoUrl}
                      alt={scanResult.student.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-16 rounded-lg object-cover shrink-0 border border-slate-300 shadow-xs"
                    />
                  ) : (
                    <div className="p-2 rounded-lg bg-white/80 shrink-0">
                      {scanResult.outcome === 'SUCCESS' ? (
                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                      ) : scanResult.outcome === 'DOUBLE_SCAN_PREVENTED' ? (
                        <AlertTriangle className="w-8 h-8 text-amber-600" />
                      ) : (
                        <XCircle className="w-8 h-8 text-rose-600" />
                      )}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          scanResult.outcome === 'SUCCESS'
                            ? 'bg-emerald-200 text-emerald-900'
                            : scanResult.outcome === 'DOUBLE_SCAN_PREVENTED'
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-rose-200 text-rose-900'
                        }`}
                      >
                        {scanResult.type || 'VALIDASI'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono tabular-nums">
                        {new Date(scanResult.timestamp).toLocaleTimeString('id-ID')}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mt-1 truncate">
                      {scanResult.student ? scanResult.student.name : 'Data Tidak Ditemukan'}
                    </h4>

                    {scanResult.student && (
                      <p className="text-xs text-slate-600 font-medium">
                        {scanResult.student.className} · NISN: {scanResult.student.nisn}
                      </p>
                    )}

                    <p className="text-xs mt-1.5 font-medium leading-snug">
                      {scanResult.message}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400">
                <QrCode className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs">Arahkan kamera ke QR Code atau Barcode pada kartu siswa.</p>
              </div>
            )}
          </div>

          {/* Quick Simulation Chips for Evaluation */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Simulasi Scan Siswa (1-Click Test)
              </h3>
              <span className="text-[11px] text-slate-400">Klik untuk tes scan</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Berguna jika kamera fisik laptop/HP tidak diarahkan ke layar cetak barcode.
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {students.slice(0, 6).map((student) => (
                <button
                  key={student.id}
                  onClick={() => handleBarcodeScanned(student.barcodeCode)}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 text-left transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={student.photoUrl}
                      alt={student.name}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-lg object-cover bg-slate-200"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600">
                        {student.name}
                      </p>
                      <p className="text-[10px] font-mono text-slate-500">
                        {student.className} · {student.barcodeCode}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-600 group-hover:underline shrink-0">
                    Scan Barcode &rarr;
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
