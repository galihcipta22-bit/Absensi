import {
  AttendanceLog,
  AttendanceStats,
  AttendanceStatus,
  AttendanceType,
  ScanMethod,
  ScanResult,
  Student,
  SystemSettings,
} from '../types/attendance';
import { StorageService } from './storageService';
import { playErrorBuzz, playSuccessBeep, playWarningBeep, speakIndonesian } from '../utils/audioFeedback';

export class AttendanceService {
  /**
   * Helper to format current date as YYYY-MM-DD
   */
  static getTodayDate(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Helper to format current time as HH:mm:ss
   */
  static getCurrentTimeString(): string {
    const d = new Date();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Normalize RFID UID string (e.g. "a4:89:2c:11" or "a4892c11" -> "A4 89 2C 11")
   */
  static normalizeRfid(uid: string): string {
    const clean = uid.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
    return clean.match(/.{1,2}/g)?.join(' ') || clean;
  }

  /**
   * Determine whether scan is MASUK or PULANG based on time-window and student history
   */
  static evaluateAttendanceType(
    studentId: string,
    today: string,
    currentTime: string,
    settings: SystemSettings,
    existingLogs: AttendanceLog[]
  ): { type: AttendanceType; alreadyDone: boolean; reason?: string } {
    const studentTodayLogs = existingLogs.filter(
      (l) => l.studentId === studentId && l.date === today
    );

    const hasMasuk = studentTodayLogs.some((l) => l.type === 'MASUK');
    const hasPulang = studentTodayLogs.some((l) => l.type === 'PULANG');

    if (hasMasuk && hasPulang) {
      return {
        type: 'PULANG',
        alreadyDone: true,
        reason: 'Siswa sudah menyelesaikan presensi Masuk dan Pulang hari ini.',
      };
    }

    if (!hasMasuk) {
      // First scan of the day is always MASUK
      return { type: 'MASUK', alreadyDone: false };
    }

    // Already has MASUK, evaluating PULANG
    // Check if time reached pulang window or if manual override
    if (currentTime >= settings.pulangStart) {
      return { type: 'PULANG', alreadyDone: false };
    } else {
      // It is before pulangStart, but student is scanning again
      // We can record PULANG as early leave or prompt
      return { type: 'PULANG', alreadyDone: false, reason: 'Presensi Pulang Awal' };
    }
  }

  /**
   * Determine attendance status (HADIR or TERLAMBAT) based on time-window
   */
  static evaluateAttendanceStatus(
    type: AttendanceType,
    currentTime: string,
    settings: SystemSettings
  ): { status: AttendanceStatus; notes: string } {
    if (type === 'PULANG') {
      return { status: 'HADIR', notes: 'Presensi Pulang Sesuai Prosedur' };
    }

    // For MASUK: compare with on-time cutoff
    const timeHHmm = currentTime.slice(0, 5);
    if (timeHHmm <= settings.masukOnTimeEnd) {
      return { status: 'HADIR', notes: 'Tepat Waktu' };
    } else if (timeHHmm <= settings.masukLateEnd) {
      return {
        status: 'TERLAMBAT',
        notes: `Terlambat (Batas Masuk: ${settings.masukOnTimeEnd})`,
      };
    } else {
      return {
        status: 'TERLAMBAT',
        notes: `Terlambat Sangat Siang (Setelah ${settings.masukLateEnd})`,
      };
    }
  }

  /**
   * Core logic for processing an attendance scan
   */
  private static async processScanInternal(
    student: Student,
    method: ScanMethod,
    identifier: string,
    kioskId: string = 'KIOSK-MAIN'
  ): Promise<ScanResult> {
    const today = this.getTodayDate();
    const timeStr = this.getCurrentTimeString();
    const timestamp = new Date().toISOString();
    const settings = StorageService.getSettings();
    const allLogs = StorageService.getLogs();

    // 1. Verify Student Active Status
    if (!student.isActive) {
      if (settings.soundEnabled) playErrorBuzz();
      if (settings.voiceSynthesisEnabled) {
        speakIndonesian(`Perhatian: Status ${student.name} tidak aktif. Silakan hubungi bagian tata usaha.`);
      }
      return {
        outcome: 'STUDENT_INACTIVE',
        success: false,
        message: `Status siswa ${student.name} (${student.nisn}) sedang NONAKTIF. Hubungi Tata Usaha.`,
        student,
        timestamp,
      };
    }

    // 2. Check 5-Minute Double Scan Debounce Constraint
    const studentTodayLogs = allLogs.filter(
      (l) => l.studentId === student.id && l.date === today
    );

    if (studentTodayLogs.length > 0) {
      // Find the most recent log
      const lastLog = studentTodayLogs.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      const lastTime = new Date(lastLog.createdAt).getTime();
      const nowTime = new Date().getTime();
      const diffMs = nowTime - lastTime;
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffSeconds = Math.floor((diffMs % 60000) / 1000);

      const debounceThresholdMs = settings.doubleScanDebounceMinutes * 60 * 1000;

      if (diffMs < debounceThresholdMs) {
        if (settings.soundEnabled) playWarningBeep();
        if (settings.voiceSynthesisEnabled) {
          speakIndonesian(`Peringatan: Kartu ${student.name} sudah dipindai beberapa saat yang lalu.`);
        }

        const remainingSeconds = Math.ceil((debounceThresholdMs - diffMs) / 1000);
        const remainingMin = Math.floor(remainingSeconds / 60);
        const remainingSec = remainingSeconds % 60;

        return {
          outcome: 'DOUBLE_SCAN_PREVENTED',
          success: false,
          message: `Double-scan dicegah! Terakhir scan ${diffMinutes > 0 ? `${diffMinutes} menit ` : ''}${diffSeconds} detik lalu. Tunggu ${remainingMin}m ${remainingSec}s lagi.`,
          student,
          timestamp,
          diffMinutes,
        };
      }
    }

    // 3. Determine Masuk or Pulang
    const evalType = this.evaluateAttendanceType(student.id, today, timeStr, settings, allLogs);

    if (evalType.alreadyDone) {
      if (settings.soundEnabled) playWarningBeep();
      if (settings.voiceSynthesisEnabled) {
        speakIndonesian(`${student.name} sudah menyelesaikan absensi masuk dan pulang hari ini.`);
      }
      return {
        outcome: 'ALREADY_COMPLETED',
        success: false,
        message: `${student.name} sudah mencatat presensi Masuk & Pulang hari ini.`,
        student,
        timestamp,
      };
    }

    // 4. Calculate Status (Hadir / Terlambat)
    const evalStatus = this.evaluateAttendanceStatus(evalType.type, timeStr, settings);

    // 5. Create new Attendance Log
    const newLog: AttendanceLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      studentId: student.id,
      studentName: student.name,
      nisn: student.nisn,
      className: student.className,
      date: today,
      scanTime: timeStr,
      type: evalType.type,
      status: evalStatus.status,
      method,
      rfidUid: method === 'RFID_HARDWARE' ? identifier : student.rfidUid,
      barcodeCode: method === 'BARCODE_CAMERA' ? identifier : student.barcodeCode,
      notes: evalStatus.notes + (evalType.reason ? ` (${evalType.reason})` : ''),
      kioskId,
      createdAt: timestamp,
    };

    // Save to storage
    const updatedLogs = [newLog, ...allLogs];
    StorageService.saveLogs(updatedLogs);

    // 6. Audio Feedback
    if (settings.soundEnabled) playSuccessBeep();
    if (settings.voiceSynthesisEnabled) {
      if (evalType.type === 'MASUK') {
        const greeting =
          evalStatus.status === 'TERLAMBAT'
            ? `Selamat datang ${student.name}. Anda tercatat terlambat.`
            : `Selamat pagi ${student.name}. Presensi masuk berhasil.`;
        speakIndonesian(greeting);
      } else {
        speakIndonesian(`Presensi pulang berhasil. Hati-hati di jalan, ${student.name}!`);
      }
    }

    return {
      outcome: 'SUCCESS',
      success: true,
      message: `Presensi ${evalType.type} berhasil dicatat (${evalStatus.status})`,
      student,
      log: newLog,
      type: evalType.type,
      timestamp,
    };
  }

  /**
   * API Endpoint Implementation: POST /api/attendance/scan-rfid
   */
  static async scanRfid(rawUid: string, kioskId: string = 'ESP32-READER-01'): Promise<ScanResult> {
    const normalizedUid = this.normalizeRfid(rawUid);
    const students = StorageService.getStudents();
    const settings = StorageService.getSettings();

    // Look for matching student
    const student = students.find((s) => {
      const stored = this.normalizeRfid(s.rfidUid);
      return stored === normalizedUid;
    });

    if (!student) {
      if (settings.soundEnabled) playErrorBuzz();
      if (settings.voiceSynthesisEnabled) {
        speakIndonesian('Kartu RFID tidak terdaftar di sistem.');
      }
      return {
        outcome: 'CARD_NOT_FOUND',
        success: false,
        message: `Kartu RFID dengan UID [${normalizedUid}] belum terdaftar dalam database siswa.`,
        timestamp: new Date().toISOString(),
      };
    }

    return this.processScanInternal(student, 'RFID_HARDWARE', normalizedUid, kioskId);
  }

  /**
   * API Endpoint Implementation: POST /api/attendance/scan-barcode
   */
  static async scanBarcode(payload: string, kioskId: string = 'CAM-SCANNER-01'): Promise<ScanResult> {
    const cleanPayload = payload.trim();
    const students = StorageService.getStudents();
    const settings = StorageService.getSettings();

    // Match by barcodeCode or NISN or student ID
    const student = students.find(
      (s) =>
        s.barcodeCode.toLowerCase() === cleanPayload.toLowerCase() ||
        s.nisn === cleanPayload ||
        s.id === cleanPayload
    );

    if (!student) {
      if (settings.soundEnabled) playErrorBuzz();
      if (settings.voiceSynthesisEnabled) {
        speakIndonesian('Barcode atau QR Code tidak dikenali.');
      }
      return {
        outcome: 'CARD_NOT_FOUND',
        success: false,
        message: `Barcode/QR Code "${cleanPayload}" tidak terdaftar dalam database siswa.`,
        timestamp: new Date().toISOString(),
      };
    }

    return this.processScanInternal(student, 'BARCODE_CAMERA', cleanPayload, kioskId);
  }

  /**
   * Manual Attendance Record by Teacher (e.g. Izin, Sakit, Alpa)
   */
  static recordManualAttendance(
    studentId: string,
    status: AttendanceStatus,
    notes: string,
    teacherName: string = 'Petugas Piket'
  ): AttendanceLog {
    const students = StorageService.getStudents();
    const student = students.find((s) => s.id === studentId);
    if (!student) throw new Error('Student not found');

    const today = this.getTodayDate();
    const timeStr = this.getCurrentTimeString();
    const timestamp = new Date().toISOString();

    const newLog: AttendanceLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      studentId: student.id,
      studentName: student.name,
      nisn: student.nisn,
      className: student.className,
      date: today,
      scanTime: timeStr,
      type: 'MASUK',
      status,
      method: 'MANUAL_TEACHER',
      rfidUid: student.rfidUid,
      barcodeCode: student.barcodeCode,
      notes: `${notes} (Dicatat oleh: ${teacherName})`,
      kioskId: 'ADMIN-CONSOLE',
      createdAt: timestamp,
    };

    const logs = StorageService.getLogs();
    StorageService.saveLogs([newLog, ...logs]);
    return newLog;
  }

  /**
   * Compute comprehensive metrics for dashboard
   */
  static getStats(targetDate?: string): AttendanceStats {
    const date = targetDate || this.getTodayDate();
    const students = StorageService.getStudents().filter((s) => s.isActive);
    const logs = StorageService.getLogs().filter((l) => l.date === date);

    // Group logs by student to avoid double-counting student presence
    const studentMap = new Map<string, AttendanceLog[]>();
    for (const log of logs) {
      if (!studentMap.has(log.studentId)) {
        studentMap.set(log.studentId, []);
      }
      studentMap.get(log.studentId)!.push(log);
    }

    let totalHadir = 0;
    let totalTerlambat = 0;
    let totalIzin = 0;
    let totalSakit = 0;
    let totalAlpa = 0;
    let totalMasuk = 0;
    let totalPulang = 0;

    for (const [, studentLogs] of studentMap.entries()) {
      // Check masuk logs
      const masukLog = studentLogs.find((l) => l.type === 'MASUK');
      const pulangLog = studentLogs.find((l) => l.type === 'PULANG');

      if (masukLog) totalMasuk++;
      if (pulangLog) totalPulang++;

      if (masukLog) {
        if (masukLog.status === 'HADIR') totalHadir++;
        else if (masukLog.status === 'TERLAMBAT') totalTerlambat++;
        else if (masukLog.status === 'IZIN') totalIzin++;
        else if (masukLog.status === 'SAKIT') totalSakit++;
        else if (masukLog.status === 'ALPA') totalAlpa++;
      }
    }

    const recordedCount = studentMap.size;
    const absentWithoutReason = Math.max(0, students.length - recordedCount);
    // Add absent students to totalAlpa
    totalAlpa += absentWithoutReason;

    const totalPresent = totalHadir + totalTerlambat;
    const attendanceRate = students.length > 0 ? Math.round((totalPresent / students.length) * 100) : 0;

    return {
      totalStudents: students.length,
      totalHadir,
      totalTerlambat,
      totalIzin,
      totalSakit,
      totalAlpa,
      totalMasuk,
      totalPulang,
      attendanceRate,
    };
  }

  /**
   * Export attendance logs to CSV
   */
  static exportToCSV(logs: AttendanceLog[]): string {
    const headers = [
      'No',
      'Tanggal',
      'Waktu',
      'NISN',
      'Nama Siswa',
      'Kelas',
      'Tipe',
      'Status',
      'Metode Scan',
      'UID RFID',
      'Keterangan',
      'Perangkat/Kiosk',
    ];

    const rows = logs.map((log, index) => [
      index + 1,
      log.date,
      log.scanTime,
      `'${log.nisn}`, // prefix with quote to prevent Excel scientific notation
      `"${log.studentName.replace(/"/g, '""')}"`,
      `"${log.className}"`,
      log.type,
      log.status,
      log.method,
      log.rfidUid || '-',
      `"${(log.notes || '').replace(/"/g, '""')}"`,
      log.kioskId || '-',
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    return csvContent;
  }
}
