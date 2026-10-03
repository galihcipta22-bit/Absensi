import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Printer, Download, CreditCard, CheckCircle2 } from 'lucide-react';
import { Student } from '../types/attendance';
import { StorageService } from '../services/storageService';

interface StudentCardModalProps {
  student: Student | null;
  onClose: () => void;
}

export const StudentCardModal: React.FC<StudentCardModalProps> = ({ student, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const settings = StorageService.getSettings();

  useEffect(() => {
    if (student) {
      // The QR code contains the student's unique barcode/NISN identifier
      QRCode.toDataURL(student.barcodeCode, {
        width: 256,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR code generation failed', err));
    }
  }, [student]);

  if (!student) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900">Kartu Tanda Pelajar Digital</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="p-6">
          <div
            id="printable-card-area"
            className="relative bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-indigo-700/50 overflow-hidden"
          >
            {/* Background watermark badge */}
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* School Header */}
            <div className="flex items-center gap-3 border-b border-indigo-400/30 pb-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center shrink-0">
                <span className="font-bold text-lg text-indigo-200">SMK</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold tracking-tight uppercase text-indigo-100 truncate">
                  {settings.schoolName}
                </h4>
                <p className="text-[11px] text-indigo-300/80 truncate">
                  Tahun Ajaran {settings.academicYear} · Kartu Presensi
                </p>
              </div>
            </div>

            {/* Student Info & Photo */}
            <div className="flex gap-4 items-start mb-4">
              <div className="relative shrink-0">
                <img
                  src={student.photoUrl}
                  alt={student.name}
                  referrerPolicy="no-referrer"
                  className="w-24 h-28 object-cover rounded-xl border-2 border-indigo-300/60 shadow-md bg-slate-800"
                />
                <span className="absolute -bottom-2 -right-1 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                  AKTIF
                </span>
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-indigo-300 tracking-wider">
                    Nama Lengkap
                  </span>
                  <h3 className="text-base font-bold text-white truncate leading-tight">
                    {student.name}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-indigo-300 font-medium">NISN</span>
                    <p className="font-mono text-indigo-100 font-semibold">{student.nisn}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-indigo-300 font-medium">Kelas</span>
                    <p className="font-semibold text-indigo-100 truncate">{student.className}</p>
                  </div>
                </div>

                <div className="pt-0.5">
                  <span className="text-[10px] uppercase text-indigo-300 font-medium">RFID UID</span>
                  <p className="font-mono text-[11px] text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 inline-block">
                    {student.rfidUid}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Bar: Barcode Graphic & QR Code */}
            <div className="bg-white rounded-xl p-3 flex items-center justify-between text-slate-900 gap-3">
              <div className="flex-1">
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-1">
                  Barcode ID Siswa
                </span>
                {/* Simulated SVG Barcode (Code128-like styling) */}
                <div className="h-8 flex items-stretch gap-0.5 bg-slate-50 p-1 rounded border border-slate-200">
                  {student.barcodeCode.split('').map((char, i) => (
                    <div
                      key={i}
                      className="bg-slate-900 rounded-[0.5px]"
                      style={{
                        width: `${(char.charCodeAt(0) % 3) + 1}px`,
                        marginRight: `${(char.charCodeAt(0) % 2) + 0.5}px`,
                      }}
                    />
                  ))}
                  {/* Fill out lines for realistic look */}
                  {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 4, 2, 1, 3].map((w, idx) => (
                    <div
                      key={`fill-${idx}`}
                      className="bg-slate-900 rounded-[0.5px]"
                      style={{ width: `${w}px`, marginRight: '1px' }}
                    />
                  ))}
                </div>
                <p className="text-[11px] font-mono text-center tracking-widest text-slate-700 mt-0.5 font-bold">
                  {student.barcodeCode}
                </p>
              </div>

              {/* Real QR Code */}
              <div className="shrink-0 text-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code Siswa"
                    className="w-16 h-16 rounded border border-slate-200"
                  />
                ) : (
                  <div className="w-16 h-16 bg-slate-100 rounded animate-pulse" />
                )}
                <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">Scan HP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Dapat dipindai menggunakan Kamera Web & Scanner RFID
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Cetak Kartu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
