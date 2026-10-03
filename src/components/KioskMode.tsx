import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Volume2,
  VolumeX,
  CreditCard,
  History,
  Clock,
  Sparkles,
  ArrowRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { AttendanceLog, ScanResult, Student } from '../types/attendance';
import { AttendanceService } from '../services/attendanceService';
import { StorageService } from '../services/storageService';

export const KioskMode: React.FC = () => {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [recentLogs, setRecentLogs] = useState<AttendanceLog[]>([]);
  const [customUid, setCustomUid] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [settings, setSettings] = useState(StorageService.getSettings());

  // Keystroke buffer for USB RFID reader (HID Keyboard emulation)
  const keyBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load students & recent logs
  const refreshData = () => {
    setStudents(StorageService.getStudents());
    const allLogs = StorageService.getLogs();
    const today = AttendanceService.getTodayDate();
    setRecentLogs(allLogs.filter((l) => l.date === today).slice(0, 6));
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Listen for USB RFID Reader keystrokes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing inside an explicit input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const now = Date.now();
      // If keystrokes are more than 500ms apart, reset buffer
      if (now - lastKeyTimeRef.current > 500) {
        keyBufferRef.current = '';
      }
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        const uid = keyBufferRef.current.trim();
        keyBufferRef.current = '';
        if (uid.length >= 4) {
          handleRfidScan(uid, 'USB-HID-READER');
        }
      } else if (e.key.length === 1) {
        keyBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle RFID Scan (from hardware or virtual click)
  const handleRfidScan = async (uid: string, kioskId: string = 'KIOSK-GATE-01') => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const result = await AttendanceService.scanRfid(uid, kioskId);
      setScanResult(result);
      refreshData();

      // Reset banner after 6 seconds
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setScanResult(null);
      }, 6500);
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSound = () => {
    const updated = {
      ...settings,
      soundEnabled: !settings.soundEnabled,
      voiceSynthesisEnabled: !settings.voiceSynthesisEnabled,
    };
    StorageService.saveSettings(updated);
    setSettings(updated);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Top Banner Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs uppercase tracking-wider text-indigo-600 font-semibold">
            Gerbang Masuk & Pulang Utama
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Kiosk Presensi Siswa Real-Time
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mendukung Kartu RFID (ESP32 / USB Reader) & Barcode ID Card
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleSound}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              settings.soundEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{settings.soundEnabled ? 'Suara Aktif' : 'Mute'}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Layar Penuh"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Kiosk Centerpiece */}
      <div className="my-6">
        {scanResult ? (
          /* RESULT DISPLAY CARD */
          <div
            className={`relative rounded-3xl p-6 sm:p-10 border transition-all duration-300 shadow-xl ${
              scanResult.outcome === 'SUCCESS'
                ? 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white border-emerald-500'
                : scanResult.outcome === 'DOUBLE_SCAN_PREVENTED'
                ? 'bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white border-amber-400'
                : 'bg-gradient-to-br from-rose-600 via-rose-700 to-red-800 text-white border-rose-500'
            }`}
          >
            <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
              {/* Outcome Icon / Student Photo */}
              <div className="shrink-0 relative">
                {scanResult.student?.photoUrl ? (
                  <div className="relative">
                    <img
                      src={scanResult.student.photoUrl}
                      alt={scanResult.student.name}
                      referrerPolicy="no-referrer"
                      className="w-28 h-32 sm:w-36 sm:h-44 object-cover rounded-2xl border-4 border-white/40 shadow-lg bg-slate-800"
                    />
                    <div
                      className={`absolute -bottom-2 -right-2 p-1.5 rounded-full text-white shadow-md ${
                        scanResult.outcome === 'SUCCESS'
                          ? 'bg-emerald-400'
                          : scanResult.outcome === 'DOUBLE_SCAN_PREVENTED'
                          ? 'bg-amber-400'
                          : 'bg-rose-400'
                      }`}
                    >
                      {scanResult.outcome === 'SUCCESS' ? (
                        <CheckCircle2 className="w-6 h-6 text-slate-900" />
                      ) : scanResult.outcome === 'DOUBLE_SCAN_PREVENTED' ? (
                        <AlertTriangle className="w-6 h-6 text-slate-900" />
                      ) : (
                        <XCircle className="w-6 h-6 text-white" />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-white/10 border-2 border-white/30 flex items-center justify-center">
                    {scanResult.outcome === 'SUCCESS' ? (
                      <CheckCircle2 className="w-16 h-16 text-emerald-200" />
                    ) : scanResult.outcome === 'DOUBLE_SCAN_PREVENTED' ? (
                      <AlertTriangle className="w-16 h-16 text-amber-200" />
                    ) : (
                      <XCircle className="w-16 h-16 text-rose-200" />
                    )}
                  </div>
                )}
              </div>

              {/* Information Text */}
              <div className="flex-1 text-center md:text-left space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 text-xs font-semibold backdrop-blur-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {scanResult.type === 'MASUK'
                      ? 'PRESENSI MASUK'
                      : scanResult.type === 'PULANG'
                      ? 'PRESENSI PULANG'
                      : 'STATUS VERIFIKASI'}
                  </span>
                  <span>·</span>
                  <span className="font-mono tabular-nums">
                    {new Date(scanResult.timestamp).toLocaleTimeString('id-ID')}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                  {scanResult.student ? scanResult.student.name : 'Kartu Tidak Dikenali'}
                </h2>

                {scanResult.student && (
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-white/90">
                    <span className="font-mono bg-white/20 px-2 py-0.5 rounded">
                      NISN: {scanResult.student.nisn}
                    </span>
                    <span>·</span>
                    <span className="font-medium">{scanResult.student.className}</span>
                    <span>·</span>
                    <span className="font-mono text-xs opacity-80">
                      UID: {scanResult.student.rfidUid}
                    </span>
                  </div>
                )}

                <p className="text-base sm:text-lg text-white/95 font-medium pt-2">
                  {scanResult.message}
                </p>

                {scanResult.outcome === 'DOUBLE_SCAN_PREVENTED' && (
                  <div className="mt-3 p-3 rounded-xl bg-black/30 border border-white/20 text-xs sm:text-sm text-amber-100 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300" />
                    <span>
                      Sistem menerapkan proteksi <strong>5 menit debounce</strong> untuk mencegah
                      presensi ganda tak disengaja.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* STANDBY AWAITING SCAN */
          <div className="rounded-3xl bg-white border border-slate-200/80 p-8 sm:p-14 text-center shadow-xs relative overflow-hidden">
            {/* Background radio wave animation */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-xl mx-auto space-y-5">
              <div className="w-24 h-24 mx-auto rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm relative group">
                <Radio className="w-12 h-12 animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500"></span>
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Dekatkan Kartu RFID atau Scan Barcode
                </h2>
                <p className="text-sm text-slate-500 mt-2">
                  Tempelkan kartu pelajar pada alat pembaca ESP32 MFRC522 atau USB RFID Reader
                </p>
              </div>

              {/* Status Indicator */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Sensor Gerbang Siap Menerima Scan</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Interactive Testing & Simulator Panel */}
      <div className="space-y-4">
        <div className="bg-slate-100/80 rounded-2xl p-4 sm:p-5 border border-slate-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Simulasi Tap Kartu RFID Siswa (Uji Coba Langsung)</span>
            </div>
            <span className="text-[11px] text-slate-500">
              Klik nama siswa di bawah untuk mensimulasikan tap kartu ke gerbang
            </span>
          </div>

          {/* Student quick tap chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {students.slice(0, 8).map((student) => (
              <button
                key={student.id}
                onClick={() => handleRfidScan(student.rfidUid, 'SIMULATOR-KIOSK')}
                disabled={isProcessing}
                className="flex items-center gap-2.5 p-2 bg-white hover:bg-indigo-50/80 rounded-xl border border-slate-200/90 text-left transition-all hover:border-indigo-300 group disabled:opacity-50"
              >
                <img
                  src={student.photoUrl}
                  alt={student.name}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-lg object-cover shrink-0 bg-slate-200"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-700">
                    {student.name}
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 truncate">
                    {student.className} · {student.rfidUid}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Custom UID Manual Input for testing hardware emulator */}
          <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Uji Coba UID Manual / Tidak Terdaftar:</span>
            <input
              type="text"
              placeholder="Contoh: FF 00 11 22"
              value={customUid}
              onChange={(e) => setCustomUid(e.target.value)}
              className="px-3 py-1 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 w-44"
            />
            <button
              onClick={() => {
                if (customUid.trim()) {
                  handleRfidScan(customUid.trim(), 'CUSTOM-UID-TEST');
                  setCustomUid('');
                }
              }}
              className="px-3 py-1 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Kirim Scan
            </button>
            <span className="text-[11px] text-slate-400 italic">
              (Gunakan tombol ini untuk menguji respon kartu ditolak/merah)
            </span>
          </div>
        </div>

        {/* Recent Scans Real-time Feed */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <History className="w-4 h-4 text-indigo-600" />
              <span>Aktivitas Presensi Hari Ini</span>
            </div>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              Total Scan: {recentLogs.length}
            </span>
          </div>

          {recentLogs.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">Belum ada aktivitas presensi hari ini.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-semibold text-slate-900 truncate">{log.studentName}</p>
                    <p className="text-[11px] text-slate-500">
                      {log.className} · {log.method === 'RFID_HARDWARE' ? 'RFID' : 'Kamera'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        log.status === 'HADIR'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.status === 'TERLAMBAT'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {log.type} · {log.status}
                    </span>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5 tabular-nums">
                      {log.scanTime}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
