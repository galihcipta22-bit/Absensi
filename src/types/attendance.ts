export type AttendanceType = 'MASUK' | 'PULANG';

export type AttendanceStatus = 'HADIR' | 'TERLAMBAT' | 'IZIN' | 'SAKIT' | 'ALPA';

export type ScanMethod = 'RFID_HARDWARE' | 'BARCODE_CAMERA' | 'MANUAL_TEACHER' | 'SIMULATOR';

export interface Student {
  id: string;
  nisn: string;
  name: string;
  classId: string;
  className: string;
  gender: 'L' | 'P';
  rfidUid: string; // e.g. "A4 89 2C 11"
  barcodeCode: string; // e.g. "SIS-2026-001"
  phone: string;
  parentPhone: string;
  parentName: string;
  photoUrl: string;
  isActive: boolean;
  createdAt: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  grade: string;
  major: string;
  homeroomTeacher: string;
}

export interface AttendanceLog {
  id: string;
  studentId: string;
  studentName: string;
  nisn: string;
  className: string;
  date: string; // YYYY-MM-DD
  scanTime: string; // HH:mm:ss
  type: AttendanceType;
  status: AttendanceStatus;
  method: ScanMethod;
  rfidUid?: string;
  barcodeCode?: string;
  notes?: string;
  kioskId?: string;
  createdAt: string;
}

export interface SystemSettings {
  masukStart: string; // e.g. "06:00"
  masukOnTimeEnd: string; // e.g. "07:15"
  masukLateEnd: string; // e.g. "08:30"
  pulangStart: string; // e.g. "14:00"
  doubleScanDebounceMinutes: number; // e.g. 5
  soundEnabled: boolean;
  voiceSynthesisEnabled: boolean;
  schoolName: string;
  schoolAddress: string;
  academicYear: string;
}

export type ScanOutcome =
  | 'SUCCESS'
  | 'DOUBLE_SCAN_PREVENTED'
  | 'CARD_NOT_FOUND'
  | 'STUDENT_INACTIVE'
  | 'ALREADY_COMPLETED'
  | 'ERROR';

export interface ScanResult {
  outcome: ScanOutcome;
  success: boolean;
  message: string;
  student?: Student;
  log?: AttendanceLog;
  timestamp: string;
  type?: AttendanceType;
  diffMinutes?: number;
}

export interface AttendanceStats {
  totalStudents: number;
  totalHadir: number;
  totalTerlambat: number;
  totalIzin: number;
  totalSakit: number;
  totalAlpa: number;
  totalMasuk: number;
  totalPulang: number;
  attendanceRate: number; // percentage
}
