import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit2,
  Printer,
  Search,
  Filter,
  RefreshCw,
  Sliders,
  FileText,
  UserPlus,
  Save,
  X,
  CreditCard,
  QrCode,
} from 'lucide-react';
import {
  AttendanceLog,
  AttendanceStats,
  AttendanceStatus,
  ClassRoom,
  Student,
  SystemSettings,
} from '../types/attendance';
import { AttendanceService } from '../services/attendanceService';
import { StorageService } from '../services/storageService';
import { StudentCardModal } from './StudentCardModal';
import { PairRfidModal } from './PairRfidModal';

export const AdminDashboard: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'logs' | 'students' | 'settings'>('logs');
  const [stats, setStats] = useState<AttendanceStats>(AttendanceService.getStats());
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(StorageService.getSettings());

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(AttendanceService.getTodayDate());

  // Modal states
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<Student | null>(null);
  const [studentForRfidPairing, setStudentForRfidPairing] = useState<Student | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);

  // Manual status form state
  const [manualStudentId, setManualStudentId] = useState<string>('');
  const [manualStatus, setManualStatus] = useState<AttendanceStatus>('IZIN');
  const [manualNotes, setManualNotes] = useState<string>('Surat izin orang tua');

  // New Student form state
  const [formStudent, setFormStudent] = useState<Partial<Student>>({
    name: '',
    nisn: '',
    classId: '',
    className: '',
    gender: 'L',
    rfidUid: '',
    barcodeCode: '',
    phone: '',
    parentPhone: '',
    parentName: '',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    isActive: true,
  });

  const loadData = () => {
    setStudents(StorageService.getStudents());
    setClasses(StorageService.getClasses());
    setLogs(StorageService.getLogs());
    setStats(AttendanceService.getStats(selectedDate));
    setSettings(StorageService.getSettings());
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  // Export CSV Handler
  const handleExportCSV = () => {
    const csv = AttendanceService.exportToCSV(filteredLogs);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rekap-absensi-${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Student CRUD
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudent.name || !formStudent.nisn) return;

    const classObj = classes.find((c) => c.id === formStudent.classId);
    const className = classObj ? classObj.name : formStudent.className || 'Umum';

    const normalizedRfid = AttendanceService.normalizeRfid(formStudent.rfidUid || '');
    const barcodeCode = formStudent.barcodeCode || `SIS-${formStudent.nisn}`;

    let updatedList: Student[];
    if (editingStudent) {
      updatedList = students.map((s) =>
        s.id === editingStudent.id
          ? ({
              ...s,
              ...formStudent,
              className,
              rfidUid: normalizedRfid,
              barcodeCode,
            } as Student)
          : s
      );
    } else {
      const newStudent: Student = {
        id: `std-${Date.now()}`,
        nisn: formStudent.nisn!,
        name: formStudent.name!,
        classId: formStudent.classId || classes[0]?.id || 'cls-1',
        className,
        gender: formStudent.gender || 'L',
        rfidUid: normalizedRfid,
        barcodeCode,
        phone: formStudent.phone || '',
        parentPhone: formStudent.parentPhone || '',
        parentName: formStudent.parentName || '',
        photoUrl:
          formStudent.photoUrl ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
        isActive: formStudent.isActive ?? true,
        createdAt: new Date().toISOString(),
      };
      updatedList = [newStudent, ...students];
    }

    StorageService.saveStudents(updatedList);
    setStudents(updatedList);
    setIsStudentModalOpen(false);
    setEditingStudent(null);
    loadData();
  };

  const handleDeleteStudent = (id: string) => {
    if (confirm('Yakin ingin menghapus data siswa ini?')) {
      const updated = students.filter((s) => s.id !== id);
      StorageService.saveStudents(updated);
      setStudents(updated);
      loadData();
    }
  };

  const handleOpenEditStudent = (student: Student) => {
    setEditingStudent(student);
    setFormStudent(student);
    setIsStudentModalOpen(true);
  };

  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setFormStudent({
      name: '',
      nisn: '',
      classId: classes[0]?.id || '',
      className: classes[0]?.name || '',
      gender: 'L',
      rfidUid: '',
      barcodeCode: '',
      phone: '',
      parentPhone: '',
      parentName: '',
      photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
      isActive: true,
    });
    setIsStudentModalOpen(true);
  };

  // Manual Attendance Record
  const handleRecordManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudentId) return;

    AttendanceService.recordManualAttendance(manualStudentId, manualStatus, manualNotes);
    setIsManualModalOpen(false);
    setManualStudentId('');
    loadData();
  };

  // Settings Save
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSettings(settings);
    alert('Pengaturan jam operasional dan sistem berhasil disimpan!');
  };

  // Reset Demo Data
  const handleResetData = () => {
    if (confirm('Apakah Anda yakin ingin mengembalikan data ke bawaan demo awal?')) {
      StorageService.resetToDefault();
      loadData();
      alert('Data sistem telah direset ke setelan awal.');
    }
  };

  // Filtering Logs
  const filteredLogs = logs.filter((log) => {
    if (selectedDate && log.date !== selectedDate) return false;
    if (selectedStatus !== 'ALL' && log.status !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = log.studentName.toLowerCase().includes(q);
      const matchNisn = log.nisn.includes(q);
      const matchClass = log.className.toLowerCase().includes(q);
      if (!matchName && !matchNisn && !matchClass) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Title & Submenu Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs uppercase tracking-wider text-indigo-600 font-semibold">
            Pusat Kendali Administrator & Guru
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard Presensi & Siswa
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data siswa, asosiasi kartu RFID, dan rekap log kehadiran harian
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('logs')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeSubTab === 'logs'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Log Presensi ({filteredLogs.length})
          </button>
          <button
            onClick={() => setActiveSubTab('students')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeSubTab === 'students'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Manajemen Siswa ({students.length})
          </button>
          <button
            onClick={() => setActiveSubTab('settings')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeSubTab === 'settings'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pengaturan Waktu
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Total Siswa Aktif</span>
          <p className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums mt-1">
            {stats.totalStudents}
          </p>
          <span className="text-[10px] text-slate-400">Terdaftar di database</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-2xs bg-emerald-50/20">
          <span className="text-xs text-emerald-700 font-medium">Hadir Tepat Waktu</span>
          <p className="text-2xl font-extrabold text-emerald-600 font-mono tabular-nums mt-1">
            {stats.totalHadir}
          </p>
          <span className="text-[10px] text-emerald-600">Scan &le; {settings.masukOnTimeEnd}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-2xs bg-amber-50/20">
          <span className="text-xs text-amber-700 font-medium">Terlambat</span>
          <p className="text-2xl font-extrabold text-amber-600 font-mono tabular-nums mt-1">
            {stats.totalTerlambat}
          </p>
          <span className="text-[10px] text-amber-600">Scan &gt; {settings.masukOnTimeEnd}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200/80 shadow-2xs bg-blue-50/20">
          <span className="text-xs text-blue-700 font-medium">Izin / Sakit</span>
          <p className="text-2xl font-extrabold text-blue-600 font-mono tabular-nums mt-1">
            {stats.totalIzin + stats.totalSakit}
          </p>
          <span className="text-[10px] text-blue-600">
            {stats.totalIzin} Izin · {stats.totalSakit} Sakit
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-2xs bg-rose-50/20">
          <span className="text-xs text-rose-700 font-medium">Alpa / Belum Scan</span>
          <p className="text-2xl font-extrabold text-rose-600 font-mono tabular-nums mt-1">
            {stats.totalAlpa}
          </p>
          <span className="text-[10px] text-rose-600">Tanpa keterangan</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-indigo-200/80 shadow-2xs bg-indigo-50/20">
          <span className="text-xs text-indigo-700 font-medium">Tingkat Kehadiran</span>
          <p className="text-2xl font-extrabold text-indigo-600 font-mono tabular-nums mt-1">
            {stats.attendanceRate}%
          </p>
          <span className="text-[10px] text-indigo-600">Persentase hari ini</span>
        </div>
      </div>

      {/* SUBTAB 1: LOGS REKAP */}
      {activeSubTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {/* Search */}
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, NISN, atau kelas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Date Filter */}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
              />

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
              >
                <option value="ALL">Semua Status</option>
                <option value="HADIR">Hadir</option>
                <option value="TERLAMBAT">Terlambat</option>
                <option value="IZIN">Izin</option>
                <option value="SAKIT">Sakit</option>
                <option value="ALPA">Alpa</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsManualModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Input Izin/Sakit</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export CSV/Excel</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Nama Siswa</th>
                  <th className="px-4 py-3">Kelas</th>
                  <th className="px-4 py-3">Tipe</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Metode Scan</th>
                  <th className="px-4 py-3">Perangkat / Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      Tidak ada data log presensi untuk kriteria yang dipilih.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap tabular-nums">
                        {log.scanTime}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {log.date}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-bold text-slate-900">{log.studentName}</p>
                        <p className="text-[11px] font-mono text-slate-400">NISN: {log.nisn}</p>
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                        {log.className}
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
                              : log.status === 'IZIN' || log.status === 'SAKIT'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-slate-600 font-medium">
                          {log.method === 'RFID_HARDWARE'
                            ? 'RFID Sensor'
                            : log.method === 'BARCODE_CAMERA'
                            ? 'Scan HP Barcode'
                            : log.method === 'MANUAL_TEACHER'
                            ? 'Input Guru'
                            : 'Simulasi'}
                        </span>
                        {log.rfidUid && (
                          <span className="block text-[10px] font-mono text-slate-400">
                            UID: {log.rfidUid}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                        {log.notes || '-'}
                        {log.kioskId && (
                          <span className="block text-[10px] font-mono text-slate-400">
                            {log.kioskId}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: MANAJEMEN SISWA */}
      {activeSubTab === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Header Action */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari siswa atau NISN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenAddStudent}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Tambah Siswa Baru</span>
              </button>
            </div>
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Siswa</th>
                  <th className="px-4 py-3">NISN</th>
                  <th className="px-4 py-3">Kelas</th>
                  <th className="px-4 py-3">RFID Card UID</th>
                  <th className="px-4 py-3">Barcode Siswa</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students
                  .filter((s) =>
                    searchQuery
                      ? s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.nisn.includes(searchQuery)
                      : true
                  )
                  .map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={student.photoUrl}
                            alt={student.name}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-lg object-cover bg-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{student.name}</p>
                            <p className="text-[10px] text-slate-500">
                              Wali: {student.parentName || '-'} ({student.parentPhone || '-'})
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono font-semibold text-slate-700 whitespace-nowrap">
                        {student.nisn}
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                        {student.className}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => setStudentForRfidPairing(student)}
                          className="font-mono text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200 transition-colors flex items-center gap-1.5 group"
                          title="Klik untuk daftarkan atau ganti kartu RFID"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-indigo-500 group-hover:text-indigo-600" />
                          <span>{student.rfidUid || 'Belum Ada Kartu (+)'}</span>
                        </button>
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {student.barcodeCode}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            student.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {student.isActive ? 'AKTIF' : 'NONAKTIF'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setStudentForRfidPairing(student)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Tautkan Kartu RFID"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedStudentForCard(student)}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Cetak / Lihat Kartu Pelajar"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditStudent(student)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Data Siswa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: PENGATURAN WAKTU & SISTEM */}
      {activeSubTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 max-w-3xl">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900">
              Konfigurasi Jam Presensi & Anti-Double Scan
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Atur time-window masuk sekolah, batas keterlambatan, jam kepulangan, serta proteksi
              debounce RFID.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jam Mulai Presensi Masuk
                </label>
                <input
                  type="time"
                  value={settings.masukStart}
                  onChange={(e) => setSettings({ ...settings, masukStart: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Batas Waktu Tepat Waktu (On-Time)
                </label>
                <input
                  type="time"
                  value={settings.masukOnTimeEnd}
                  onChange={(e) => setSettings({ ...settings, masukOnTimeEnd: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Scan setelah jam ini dicatat sebagai TERLAMBAT
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Batas Terlambat Maksimal
                </label>
                <input
                  type="time"
                  value={settings.masukLateEnd}
                  onChange={(e) => setSettings({ ...settings, masukLateEnd: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jam Mulai Presensi Pulang
                </label>
                <input
                  type="time"
                  value={settings.pulangStart}
                  onChange={(e) => setSettings({ ...settings, pulangStart: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Debounce Setting */}
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
              <label className="block text-xs font-bold text-amber-900">
                Pencegahan Double-Scan (Jeda Menit)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={settings.doubleScanDebounceMinutes}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      doubleScanDebounceMinutes: parseInt(e.target.value) || 5,
                    })
                  }
                  className="w-24 px-3 py-1.5 text-xs font-mono bg-white border border-amber-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-bold"
                />
                <span className="text-xs text-amber-800">
                  Menit (Bawaan standar: <strong>5 Menit</strong>)
                </span>
              </div>
              <p className="text-[11px] text-amber-700">
                Mencegah kartu terscan berulang kali secara tidak sengaja dalam kurun waktu 5 menit.
              </p>
            </div>

            {/* Audio Synthesis toggles */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="soundToggle"
                  checked={settings.soundEnabled}
                  onChange={(e) => setSettings({ ...settings, soundEnabled: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="soundToggle" className="text-xs font-medium text-slate-800">
                  Aktifkan Efek Suara Beep Kiosk (Web Audio)
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="voiceToggle"
                  checked={settings.voiceSynthesisEnabled}
                  onChange={(e) =>
                    setSettings({ ...settings, voiceSynthesisEnabled: e.target.checked })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="voiceToggle" className="text-xs font-medium text-slate-800">
                  Aktifkan Suara Panggilan Bahasa Indonesia (Speech Synthesis "Selamat datang, [Nama Siswa]")
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetData}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
              >
                Reset Data ke Bawaan Demo
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Tambah/Edit Siswa */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">
                {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Siswa *
                </label>
                <input
                  type="text"
                  required
                  value={formStudent.name || ''}
                  onChange={(e) => setFormStudent({ ...formStudent, name: e.target.value })}
                  placeholder="Contoh: Muhammad Rizki"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">NISN *</label>
                  <input
                    type="text"
                    required
                    value={formStudent.nisn || ''}
                    onChange={(e) => setFormStudent({ ...formStudent, nisn: e.target.value })}
                    placeholder="007819201"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={formStudent.classId || classes[0]?.id}
                    onChange={(e) => {
                      const c = classes.find((cls) => cls.id === e.target.value);
                      setFormStudent({
                        ...formStudent,
                        classId: e.target.value,
                        className: c?.name || '',
                      });
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* RFID UID & Barcode Code */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <div>
                  <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                    UID Kartu RFID
                  </label>
                  <input
                    type="text"
                    value={formStudent.rfidUid || ''}
                    onChange={(e) => setFormStudent({ ...formStudent, rfidUid: e.target.value })}
                    placeholder="Contoh: A4 89 2C 11"
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                  <span className="text-[10px] text-indigo-600 block mt-0.5">
                    Dapat diisi via scan alat
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                    Kode Barcode / QR
                  </label>
                  <input
                    type="text"
                    value={formStudent.barcodeCode || ''}
                    onChange={(e) =>
                      setFormStudent({ ...formStudent, barcodeCode: e.target.value })
                    }
                    placeholder="Otomatis (SIS-NISN)"
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                  <span className="text-[10px] text-indigo-600 block mt-0.5">
                    ID untuk scan kamera
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Orang Tua / Wali
                  </label>
                  <input
                    type="text"
                    value={formStudent.parentName || ''}
                    onChange={(e) =>
                      setFormStudent({ ...formStudent, parentName: e.target.value })
                    }
                    placeholder="Nama wali..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp Wali
                  </label>
                  <input
                    type="text"
                    value={formStudent.parentPhone || ''}
                    onChange={(e) =>
                      setFormStudent({ ...formStudent, parentPhone: e.target.value })
                    }
                    placeholder="08123456789"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveStudent"
                  checked={formStudent.isActive ?? true}
                  onChange={(e) => setFormStudent({ ...formStudent, isActive: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isActiveStudent" className="text-xs font-medium text-slate-800">
                  Status Siswa Aktif (Dapat Melakukan Presensi)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
                >
                  Simpan Data Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Input Izin / Sakit Manual */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Catat Izin / Sakit Manual</h3>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordManual} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Siswa
                </label>
                <select
                  required
                  value={manualStudentId}
                  onChange={(e) => setManualStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Pilih Siswa --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.className} - {s.nisn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['IZIN', 'SAKIT', 'ALPA'] as AttendanceStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setManualStatus(st)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                        manualStatus === st
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan / Alasan
                </label>
                <textarea
                  rows={2}
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Contoh: Surat keterangan dokter dari RSUD..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!manualStudentId}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
                >
                  Simpan Presensi Manual
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Student Card Modal */}
      <StudentCardModal
        student={selectedStudentForCard}
        onClose={() => setSelectedStudentForCard(null)}
      />

      {/* Dedicated RFID Pairing Modal */}
      <PairRfidModal
        student={studentForRfidPairing}
        isOpen={!!studentForRfidPairing}
        onClose={() => setStudentForRfidPairing(null)}
        onSaved={loadData}
      />
    </div>
  );
};
