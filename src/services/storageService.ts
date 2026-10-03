import { Student, ClassRoom, AttendanceLog, SystemSettings } from '../types/attendance';

const STORAGE_KEYS = {
  STUDENTS: 'si_absensi_students_v1',
  CLASSES: 'si_absensi_classes_v1',
  LOGS: 'si_absensi_logs_v1',
  SETTINGS: 'si_absensi_settings_v1',
};

export const INITIAL_CLASSES: ClassRoom[] = [
  { id: 'cls-1', name: 'X Rekayasa Perangkat Lunak 1', grade: 'X', major: 'RPL', homeroomTeacher: 'Budi Santoso, S.Kom.' },
  { id: 'cls-2', name: 'X Teknik Jaringan & Komputer', grade: 'X', major: 'TKJ', homeroomTeacher: 'Siti Rahmawati, S.Pd.' },
  { id: 'cls-3', name: 'XI Rekayasa Perangkat Lunak 1', grade: 'XI', major: 'RPL', homeroomTeacher: 'Agus Wijaya, M.Kom.' },
  { id: 'cls-4', name: 'XII IPA 1 (Olimpiade Sains)', grade: 'XII', major: 'MIPA', homeroomTeacher: 'Dr. Dewi Lestari, M.Si.' },
  { id: 'cls-5', name: 'XII IPS 2 (Sosial)', grade: 'XII', major: 'IPS', homeroomTeacher: 'Hendra Gunawan, S.Pd.' },
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std-001',
    nisn: '0068192841',
    name: 'Ahmad Fauzan Syahputra',
    classId: 'cls-1',
    className: 'X RPL 1',
    gender: 'L',
    rfidUid: 'A4 89 2C 11',
    barcodeCode: 'SIS-0068192841',
    phone: '081234567801',
    parentPhone: '081298765401',
    parentName: 'H. Bambang Syahputra',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
    isActive: true,
    createdAt: '2026-07-15T08:00:00Z',
  },
  {
    id: 'std-002',
    nisn: '0071294812',
    name: 'Anisa Putri Ramadhani',
    classId: 'cls-1',
    className: 'X RPL 1',
    gender: 'P',
    rfidUid: '3B 19 FF 82',
    barcodeCode: 'SIS-0071294812',
    phone: '081234567802',
    parentPhone: '081298765402',
    parentName: 'Hj. Nurul Hidayati',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    isActive: true,
    createdAt: '2026-07-15T08:05:00Z',
  },
  {
    id: 'std-003',
    nisn: '0065412890',
    name: 'Bayu Pratama Wijaya',
    classId: 'cls-2',
    className: 'X TKJ',
    gender: 'L',
    rfidUid: '7C 42 90 1D',
    barcodeCode: 'SIS-0065412890',
    phone: '081234567803',
    parentPhone: '081298765403',
    parentName: 'Rudi Wijaya',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    isActive: true,
    createdAt: '2026-07-15T08:10:00Z',
  },
  {
    id: 'std-004',
    nisn: '0059128374',
    name: 'Citra Kirana Maharani',
    classId: 'cls-3',
    className: 'XI RPL 1',
    gender: 'P',
    rfidUid: 'F1 22 55 AA',
    barcodeCode: 'SIS-0059128374',
    phone: '081234567804',
    parentPhone: '081298765404',
    parentName: 'Drs. Iwan Setiawan',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
    isActive: true,
    createdAt: '2025-07-14T08:00:00Z',
  },
  {
    id: 'std-005',
    nisn: '0047281903',
    name: 'Dimas Arya Nugraha',
    classId: 'cls-4',
    className: 'XII IPA 1',
    gender: 'L',
    rfidUid: 'E8 91 3C 44',
    barcodeCode: 'SIS-0047281903',
    phone: '081234567805',
    parentPhone: '081298765405',
    parentName: 'dr. Hendra Nugraha, Sp.A',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
    isActive: true,
    createdAt: '2024-07-12T08:00:00Z',
  },
  {
    id: 'std-006',
    nisn: '0048192044',
    name: 'Eka Nurul Fadhilah',
    classId: 'cls-5',
    className: 'XII IPS 2',
    gender: 'P',
    rfidUid: '12 88 D4 90',
    barcodeCode: 'SIS-0048192044',
    phone: '081234567806',
    parentPhone: '081298765406',
    parentName: 'Supriyanto, S.E.',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
    isActive: true,
    createdAt: '2024-07-12T08:05:00Z',
  },
  {
    id: 'std-007',
    nisn: '0069912384',
    name: 'Farhan Rizki Ramadhan',
    classId: 'cls-1',
    className: 'X RPL 1',
    gender: 'L',
    rfidUid: '88 BC 12 77',
    barcodeCode: 'SIS-0069912384',
    phone: '081234567807',
    parentPhone: '081298765407',
    parentName: 'H. Ridwan Ramadhan',
    photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=250',
    isActive: true,
    createdAt: '2026-07-15T08:15:00Z',
  },
  {
    id: 'std-008',
    nisn: '0051829301',
    name: 'Gita Safitri Utami',
    classId: 'cls-3',
    className: 'XI RPL 1',
    gender: 'P',
    rfidUid: '99 44 A1 C2',
    barcodeCode: 'SIS-0051829301',
    phone: '081234567808',
    parentPhone: '081298765408',
    parentName: 'M. Taufiq, S.H.',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
    isActive: false, // inactive demo student
    createdAt: '2025-07-14T08:10:00Z',
  },
];

export const DEFAULT_SETTINGS: SystemSettings = {
  masukStart: '06:00',
  masukOnTimeEnd: '07:15',
  masukLateEnd: '08:30',
  pulangStart: '14:00',
  doubleScanDebounceMinutes: 5,
  soundEnabled: true,
  voiceSynthesisEnabled: true,
  schoolName: 'SMK Negeri 1 Teknologi Terpadu',
  schoolAddress: 'Jl. Pendidikan Vokasi No. 45, Kota Cerdas',
  academicYear: '2026/2027',
};

// Generate seed attendance logs for today to give the dashboard realistic life right away
function getSeedLogs(): AttendanceLog[] {
  const today = new Date().toISOString().slice(0, 10);
  return [
    {
      id: 'log-seed-01',
      studentId: 'std-001',
      studentName: 'Ahmad Fauzan Syahputra',
      nisn: '0068192841',
      className: 'X RPL 1',
      date: today,
      scanTime: '06:48:12',
      type: 'MASUK',
      status: 'HADIR',
      method: 'RFID_HARDWARE',
      rfidUid: 'A4 89 2C 11',
      notes: 'Tepat Waktu via ESP32 Gerbang Utama',
      kioskId: 'KIOSK-GATE-01',
      createdAt: `${today}T06:48:12Z`,
    },
    {
      id: 'log-seed-02',
      studentId: 'std-002',
      studentName: 'Anisa Putri Ramadhani',
      nisn: '0071294812',
      className: 'X RPL 1',
      date: today,
      scanTime: '07:05:40',
      type: 'MASUK',
      status: 'HADIR',
      method: 'BARCODE_CAMERA',
      barcodeCode: 'SIS-0071294812',
      notes: 'Tepat Waktu via Scan Kamera Petugas Piket',
      kioskId: 'KIOSK-MOBILE-01',
      createdAt: `${today}T07:05:40Z`,
    },
    {
      id: 'log-seed-03',
      studentId: 'std-003',
      studentName: 'Bayu Pratama Wijaya',
      nisn: '0065412890',
      className: 'X TKJ',
      date: today,
      scanTime: '07:22:15',
      type: 'MASUK',
      status: 'TERLAMBAT',
      method: 'RFID_HARDWARE',
      rfidUid: '7C 42 90 1D',
      notes: 'Terlambat 7 menit (Batas 07:15)',
      kioskId: 'KIOSK-GATE-01',
      createdAt: `${today}T07:22:15Z`,
    },
    {
      id: 'log-seed-04',
      studentId: 'std-005',
      studentName: 'Dimas Arya Nugraha',
      nisn: '0047281903',
      className: 'XII IPA 1',
      date: today,
      scanTime: '07:10:02',
      type: 'MASUK',
      status: 'HADIR',
      method: 'RFID_HARDWARE',
      rfidUid: 'E8 91 3C 44',
      notes: 'Tepat Waktu via ESP32 Gerbang Barat',
      kioskId: 'KIOSK-GATE-02',
      createdAt: `${today}T07:10:02Z`,
    },
  ];
}

export class StorageService {
  static getStudents(): Student[] {
    const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!data) {
      this.saveStudents(INITIAL_STUDENTS);
      return INITIAL_STUDENTS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_STUDENTS;
    }
  }

  static saveStudents(students: Student[]): void {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }

  static getClasses(): ClassRoom[] {
    const data = localStorage.getItem(STORAGE_KEYS.CLASSES);
    if (!data) {
      this.saveClasses(INITIAL_CLASSES);
      return INITIAL_CLASSES;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_CLASSES;
    }
  }

  static saveClasses(classes: ClassRoom[]): void {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  }

  static getLogs(): AttendanceLog[] {
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!data) {
      const seeds = getSeedLogs();
      this.saveLogs(seeds);
      return seeds;
    }
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveLogs(logs: AttendanceLog[]): void {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  }

  static getSettings(): SystemSettings {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) {
      this.saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  static saveSettings(settings: SystemSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  static resetToDefault(): void {
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.CLASSES);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  }
}
