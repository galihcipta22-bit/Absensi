import React, { useState, useEffect, useRef } from 'react';
import { X, Radio, CreditCard, CheckCircle2, AlertTriangle, RefreshCw, KeyRound, Sparkles } from 'lucide-react';
import { Student } from '../types/attendance';
import { AttendanceService } from '../services/attendanceService';
import { StorageService } from '../services/storageService';

interface PairRfidModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const PairRfidModal: React.FC<PairRfidModalProps> = ({
  student,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [rfidInput, setRfidInput] = useState<string>('');
  const [isListeningUsb, setIsListeningUsb] = useState<boolean>(true);
  const [duplicateOwner, setDuplicateOwner] = useState<Student | null>(null);
  const keyBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    if (student) {
      setRfidInput(student.rfidUid || '');
      setDuplicateOwner(null);
    }
  }, [student]);

  // Check duplicate UID
  useEffect(() => {
    if (!student || !rfidInput.trim()) {
      setDuplicateOwner(null);
      return;
    }

    const normalized = AttendanceService.normalizeRfid(rfidInput);
    const allStudents = StorageService.getStudents();
    const existing = allStudents.find(
      (s) => s.id !== student.id && AttendanceService.normalizeRfid(s.rfidUid) === normalized
    );

    setDuplicateOwner(existing || null);
  }, [rfidInput, student]);

  // Global listener for USB RFID Reader while modal is open
  useEffect(() => {
    if (!isOpen || !isListeningUsb) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is actively typing in the manual input box
      if (e.target instanceof HTMLInputElement && e.target.id === 'manualRfidInput') {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTimeRef.current > 500) {
        keyBufferRef.current = '';
      }
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        const scannedUid = keyBufferRef.current.trim();
        keyBufferRef.current = '';
        if (scannedUid.length >= 4) {
          const normalized = AttendanceService.normalizeRfid(scannedUid);
          setRfidInput(normalized);
        }
      } else if (e.key.length === 1) {
        keyBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isListeningUsb]);

  if (!isOpen || !student) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = AttendanceService.normalizeRfid(rfidInput);

    const allStudents = StorageService.getStudents();
    const updated = allStudents.map((s) =>
      s.id === student.id ? { ...s, rfidUid: normalized } : s
    );

    StorageService.saveStudents(updated);
    onSaved();
    onClose();
  };

  const handleUnpair = () => {
    if (confirm(`Lepaskan kartu RFID dari siswa ${student.name}?`)) {
      const allStudents = StorageService.getStudents();
      const updated = allStudents.map((s) =>
        s.id === student.id ? { ...s, rfidUid: '' } : s
      );
      StorageService.saveStudents(updated);
      onSaved();
      onClose();
    }
  };

  const generateRandomUid = () => {
    const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
    const randomUid = `${hex()} ${hex()} ${hex()} ${hex()}`;
    setRfidInput(randomUid);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Pendaftaran / Asosiasi Kartu RFID</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Profile Snapshot */}
        <div className="flex items-center gap-3 p-3.5 my-4 bg-slate-50 rounded-xl border border-slate-200/80">
          <img
            src={student.photoUrl}
            alt={student.name}
            referrerPolicy="no-referrer"
            className="w-12 h-14 rounded-lg object-cover border border-slate-300 bg-slate-200 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-slate-900 text-sm truncate">{student.name}</h4>
            <p className="text-xs text-slate-600">{student.className}</p>
            <p className="text-[11px] font-mono text-slate-400">NISN: {student.nisn}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* USB RFID Detection Banner */}
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse text-indigo-600" />
                Mode Deteksi Reader Aktif
              </span>
              <span className="text-[10px] bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded font-semibold">
                Siap Tap
              </span>
            </div>
            <p className="text-indigo-800 text-[11px] leading-relaxed">
              Tempelkan kartu fisik ke <strong>USB RFID Reader</strong> atau ketikkan UID heksadesimal secara manual di bawah.
            </p>
          </div>

          {/* UID Manual Input Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                UID Kartu RFID (Heksadesimal) *
              </label>
              <button
                type="button"
                onClick={generateRandomUid}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Buat UID Acak</span>
              </button>
            </div>

            <input
              id="manualRfidInput"
              type="text"
              required
              placeholder="Contoh: A4 89 2C 11 atau 3B19FF82"
              value={rfidInput}
              onChange={(e) => setRfidInput(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 text-sm font-mono tracking-wider font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 uppercase"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Format umum: 4 byte / 8 karakter heksadesimal (Mifare 1K S50 13.56 MHz)
            </span>
          </div>

          {/* Duplicate Owner Warning */}
          {duplicateOwner && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Peringatan: Kartu Telah Digunakan!</p>
                <p className="mt-0.5 text-[11px] leading-relaxed">
                  UID ini sudah terdaftar atas nama <strong>{duplicateOwner.name}</strong> ({duplicateOwner.className}). Satu kartu fisik tidak boleh dimiliki oleh dua siswa.
                </p>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            {student.rfidUid ? (
              <button
                type="button"
                onClick={handleUnpair}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                Lepas Kartu
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!rfidInput.trim() || !!duplicateOwner}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                Simpan & Tautkan Kartu
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
