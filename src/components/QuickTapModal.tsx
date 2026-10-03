import React, { useState } from 'react';
import { X, CreditCard, Radio, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Student, ScanResult } from '../types/attendance';
import { AttendanceService } from '../services/attendanceService';
import { StorageService } from '../services/storageService';

interface QuickTapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickTapModal: React.FC<QuickTapModalProps> = ({ isOpen, onClose }) => {
  const [students] = useState<Student[]>(StorageService.getStudents());
  const [customUid, setCustomUid] = useState<string>('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleTap = async (uid: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await AttendanceService.scanRfid(uid, 'QUICK-MODAL-TEST');
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Simulasi Tap Kartu RFID Siswa</h3>
          </div>
          <button
            onClick={() => {
              setResult(null);
              onClose();
            }}
            className="p-1 text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert if tested */}
        {result && (
          <div
            className={`mt-4 p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
              result.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : result.outcome === 'DOUBLE_SCAN_PREVENTED'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : result.outcome === 'DOUBLE_SCAN_PREVENTED' ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <div>
              <p className="font-bold">
                {result.student ? result.student.name : 'Kartu Tidak Terdaftar'}
              </p>
              <p className="mt-0.5">{result.message}</p>
            </div>
          </div>
        )}

        {/* Preset Cards List */}
        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-1">
          <p className="text-xs text-slate-500 font-medium">
            Pilih kartu siswa untuk ditap ke mesin presensi:
          </p>
          {students.map((student) => (
            <button
              key={student.id}
              onClick={() => handleTap(student.rfidUid)}
              disabled={isProcessing}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/80 border border-slate-200/80 text-left transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={student.photoUrl}
                  alt={student.name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-lg object-cover bg-slate-200"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-700">
                    {student.name}
                  </p>
                  <p className="text-[10px] font-mono text-slate-500">
                    {student.className} · UID: {student.rfidUid}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-indigo-600 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-2xs group-hover:border-indigo-300">
                Tap Kartu &rarr;
              </span>
            </button>
          ))}
        </div>

        {/* Custom UID Input */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            placeholder="UID kustom (misal: 11 22 33 44)"
            value={customUid}
            onChange={(e) => setCustomUid(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 uppercase"
          />
          <button
            onClick={() => {
              if (customUid.trim()) {
                handleTap(customUid.trim());
                setCustomUid('');
              }
            }}
            disabled={!customUid.trim() || isProcessing}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Kirim UID
          </button>
        </div>
      </div>
    </div>
  );
};
