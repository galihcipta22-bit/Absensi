import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  CreditCard,
  QrCode,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  ChevronDown,
  Search,
  Sparkles,
  Phone,
} from 'lucide-react';
import { AttendanceLog, Student } from '../types/attendance';
import { StorageService } from '../services/storageService';
import { StudentCardModal } from './StudentCardModal';

export const StudentPortal: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentLogs, setStudentLogs] = useState<AttendanceLog[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isCardModalOpen, setIsCardModalOpen] = useState<boolean>(false);
  const settings = StorageService.getSettings();

  useEffect(() => {
    const list = StorageService.getStudents();
    setStudents(list);
    if (list.length > 0 && !selectedStudentId) {
      setSelectedStudentId(list[0].id);
    }
  }, []);

  const activeStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  useEffect(() => {
    if (activeStudent) {
      // Generate QR Code data URL for scanner
      QRCode.toDataURL(activeStudent.barcodeCode, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('QR code generation error', err));

      // Fetch personal attendance logs
      const allLogs = StorageService.getLogs();
      const logs = allLogs.filter((l) => l.studentId === activeStudent.id);
      setStudentLogs(logs);
    }
  }, [activeStudent]);

  if (!activeStudent) return null;

  // Personal statistics
  const totalLogs = studentLogs.length;
  const hadirCount = studentLogs.filter((l) => l.status === 'HADIR').length;
  const terlambatCount = studentLogs.filter((l) => l.status === 'TERLAMBAT').length;
  const izinCount = studentLogs.filter((l) => l.status === 'IZIN' || l.status === 'SAKIT').length;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs uppercase tracking-wider text-indigo-600 font-semibold">
            Portal Mandiri Siswa & Orang Tua
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Kartu Digital & Riwayat Presensi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tunjukkan kode QR atau Barcode ini ke kamera scanner sekolah saat masuk dan pulang
          </p>
        </div>

        {/* Student Switcher dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-slate-500 font-medium whitespace-nowrap">
            Pilih Siswa:
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full sm:w-64 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg shadow-2xs focus:ring-2 focus:ring-indigo-500"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.className})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Digital Pass Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Kartu Pelajar Digital</h3>
              </div>
              <button
                onClick={() => setIsCardModalOpen(true)}
                className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:underline"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / Bagikan</span>
              </button>
            </div>

            {/* Visual Card */}
            <div className="relative bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-indigo-700/50 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-400/20 pb-3">
                <div className="min-w-0">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-200 truncate">
                    {settings.schoolName}
                  </h4>
                  <p className="text-[10px] text-indigo-300/80">KARTU PRESENSI DIGITAL</p>
                </div>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                  AKTIF
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <img
                  src={activeStudent.photoUrl}
                  alt={activeStudent.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-20 rounded-xl object-cover border-2 border-indigo-300/40 shrink-0 bg-slate-800"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="text-base font-bold text-white truncate leading-tight">
                    {activeStudent.name}
                  </h3>
                  <p className="text-xs text-indigo-200 font-medium">{activeStudent.className}</p>
                  <p className="text-xs font-mono text-indigo-300">NISN: {activeStudent.nisn}</p>
                  <div className="pt-1">
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                      RFID: {activeStudent.rfidUid}
                    </span>
                  </div>
                </div>
              </div>

              {/* Scannable Barcode & QR Box */}
              <div className="bg-white rounded-xl p-4 text-center text-slate-900 shadow-sm space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Scan Pada Layar Kamera Gerbang
                </span>

                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="QR Code Presensi"
                    className="w-48 h-48 mx-auto rounded-lg border border-slate-200"
                  />
                ) : (
                  <div className="w-48 h-48 mx-auto bg-slate-100 rounded-lg animate-pulse" />
                )}

                <div>
                  <p className="font-mono font-bold text-sm text-slate-900 tracking-wider">
                    {activeStudent.barcodeCode}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Kecerahan layar ponsel otomatis dioptimalkan untuk pemindaian
                  </p>
                </div>
              </div>
            </div>

            {/* Parent Info */}
            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Orang Tua / Wali
                </span>
                <span className="font-bold text-slate-800">{activeStudent.parentName || '-'}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Nomor HP
                </span>
                <span className="font-mono text-slate-700">{activeStudent.parentPhone || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Personal Attendance History */}
        <div className="lg:col-span-7 space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium">Hadir Tepat Waktu</span>
              <p className="text-xl font-extrabold text-emerald-600 font-mono tabular-nums mt-1">
                {hadirCount} Kali
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium">Terlambat</span>
              <p className="text-xl font-extrabold text-amber-600 font-mono tabular-nums mt-1">
                {terlambatCount} Kali
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium">Izin / Sakit</span>
              <p className="text-xl font-extrabold text-blue-600 font-mono tabular-nums mt-1">
                {izinCount} Kali
              </p>
            </div>
          </div>

          {/* History Log Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Riwayat Presensi ({activeStudent.name})
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {studentLogs.length} Catatan
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Tanggal & Waktu</th>
                    <th className="px-4 py-3">Sesi</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Metode Scan</th>
                    <th className="px-4 py-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        Belum ada riwayat presensi yang tercatat untuk siswa ini.
                      </td>
                    </tr>
                  ) : (
                    studentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-bold text-slate-800">{log.date}</span>
                          <span className="block font-mono text-[10px] text-slate-400 tabular-nums">
                            {log.scanTime}
                          </span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                              log.type === 'MASUK'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-purple-50 text-purple-700'
                            }`}
                          >
                            {log.type}
                          </span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                              log.status === 'HADIR'
                                ? 'bg-emerald-100 text-emerald-800'
                                : log.status === 'TERLAMBAT'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {log.method === 'RFID_HARDWARE' ? 'Kartu RFID' : 'Kamera Barcode'}
                        </td>

                        <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                          {log.notes || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Cetak Kartu */}
      <StudentCardModal
        student={isCardModalOpen ? activeStudent : null}
        onClose={() => setIsCardModalOpen(false)}
      />
    </div>
  );
};
