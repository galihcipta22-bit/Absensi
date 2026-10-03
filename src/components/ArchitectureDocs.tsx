import React, { useState } from 'react';
import {
  Database,
  Server,
  Cpu,
  Share2,
  Copy,
  Check,
  Code2,
  Send,
  Terminal,
  BookOpen,
  ArrowRight,
  Layers,
  Wrench,
  Wifi,
} from 'lucide-react';
import { AttendanceService } from '../services/attendanceService';
import { ScanResult } from '../types/attendance';

export const ArchitectureDocs: React.FC = () => {
  const [activeSection, setActiveSection] = useState<
    'database' | 'api' | 'esp32' | 'wiring' | 'deployment' | 'tester'
  >('database');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live API Tester states
  const [testEndpoint, setTestEndpoint] = useState<'rfid' | 'barcode'>('rfid');
  const [testPayload, setTestPayload] = useState<string>('A4 89 2C 11');
  const [testKioskId, setTestKioskId] = useState<string>('ESP32-GATE-MAIN');
  const [testResponse, setTestResponse] = useState<ScanResult | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRunApiTest = async () => {
    setIsTesting(true);
    try {
      let result: ScanResult;
      if (testEndpoint === 'rfid') {
        result = await AttendanceService.scanRfid(testPayload, testKioskId);
      } else {
        result = await AttendanceService.scanBarcode(testPayload, testKioskId);
      }
      setTestResponse(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTesting(false);
    }
  };

  const sqlSchemaCode = `-- =========================================================================
-- SISTEM ABSENSI SISWA TERINTEGRASI BERBASIS RFID & BARCODE/QR CODE
-- Database: PostgreSQL 14+ / Supabase (Kompatibel dengan MySQL 8.0+)
-- Desain Skema Ternormalisasi, High-Throughput Indexing & Concurrency Safe
-- =========================================================================

-- 1. TABEL PENGGUNA SISTEM (USERS / PETUGAS / GURU)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'TEACHER', 'SECURITY', 'STAFF')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABEL KELAS (CLASSES)
CREATE TABLE classes (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,       -- Contoh: 'X RPL 1'
    grade VARCHAR(10) NOT NULL,             -- Contoh: 'X', 'XI', 'XII'
    major VARCHAR(50) NOT NULL,             -- Contoh: 'RPL', 'TKJ', 'MIPA'
    homeroom_teacher VARCHAR(100),
    academic_year VARCHAR(20) NOT NULL,     -- Contoh: '2026/2027'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABEL SISWA (STUDENTS)
CREATE TABLE students (
    id VARCHAR(36) PRIMARY KEY,
    nisn VARCHAR(20) UNIQUE NOT NULL,       -- Nomor Induk Siswa Nasional
    name VARCHAR(150) NOT NULL,
    class_id VARCHAR(36) NOT NULL REFERENCES classes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    gender CHAR(1) CHECK (gender IN ('L', 'P')),
    barcode_code VARCHAR(50) UNIQUE NOT NULL, -- Kode unik untuk Barcode & QR Code (misal 'SIS-0068192841')
    phone VARCHAR(20),
    parent_name VARCHAR(100),
    parent_phone VARCHAR(20),
    photo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABEL KARTU RFID (RFID_CARDS) - Relasi 1-to-1 / 1-to-many kartu aktif
CREATE TABLE rfid_cards (
    id VARCHAR(36) PRIMARY KEY,
    rfid_uid VARCHAR(32) UNIQUE NOT NULL,   -- UID Hex dari MFRC522 (misal 'A4 89 2C 11' atau 'A4892C11')
    student_id VARCHAR(36) REFERENCES students(id) ON DELETE SET NULL,
    card_status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (card_status IN ('ACTIVE', 'BLOCKED', 'LOST')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- 5. TABEL LOG REKAP PRESENSI (ATTENDANCE_LOGS)
CREATE TABLE attendance_logs (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    scan_date DATE NOT NULL,                -- YYYY-MM-DD
    scan_time TIME NOT NULL,                -- HH:MI:SS
    attendance_type VARCHAR(10) NOT NULL CHECK (attendance_type IN ('MASUK', 'PULANG')),
    attendance_status VARCHAR(15) NOT NULL CHECK (attendance_status IN ('HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPA')),
    scan_method VARCHAR(20) NOT NULL CHECK (scan_method IN ('RFID_HARDWARE', 'BARCODE_CAMERA', 'MANUAL_TEACHER', 'SIMULATOR')),
    rfid_uid_scanned VARCHAR(32),
    barcode_scanned VARCHAR(50),
    kiosk_id VARCHAR(50),                   -- ID alat fisik (misal 'ESP32-GATE-01')
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- INDEKS PERFORMA CEPAT (HIGH CONCURRENCY INDEXES)
-- Sangat krusial saat ribuan siswa tap kartu secara serentak di pagi hari (< 50ms)
-- =========================================================================

-- Indeks pencarian instan UID kartu RFID saat hardware ESP32 mengirim request
CREATE INDEX idx_rfid_cards_uid ON rfid_cards (rfid_uid) WHERE card_status = 'ACTIVE';

-- Indeks pencarian instan Barcode / QR Code untuk scan kamera HP
CREATE INDEX idx_students_barcode ON students (barcode_code) WHERE is_active = TRUE;
CREATE INDEX idx_students_nisn ON students (nisn);

-- Indeks komposit untuk verifikasi Double-Scan (5 menit) & Time-Window harian
CREATE INDEX idx_attendance_student_date ON attendance_logs (student_id, scan_date, created_at DESC);

-- Indeks untuk query rekap harian & filter per kelas
CREATE INDEX idx_attendance_date_type ON attendance_logs (scan_date, attendance_type);
`;

  const esp32CppCode = `/*
  =========================================================================
  SKETCH ARDUINO / ESP32: SISTEM PRESENSI RFID DENGAN RC522 & WI-FI HTTP
  Hardware: ESP32 NodeMCU-32S + MFRC522 RFID Reader via SPI
  Keluaran Feedback: Active Buzzer + LED Hijau (Sukses) + LED Merah (Gagal)
  =========================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ArduinoJson.h> // Library ArduinoJson v6+

// 1. KONFIGURASI JARINGAN WI-FI & BACKEND SERVER
const char* WIFI_SSID     = "SMK_SMART_CAMPUS";
const char* WIFI_PASSWORD = "PasswordAman123";

// URL Endpoint Backend (Ganti dengan IP server lokal atau domain cloud)
const char* SERVER_ENDPOINT = "http://192.168.1.100:3000/api/attendance/scan-rfid";
const char* KIOSK_ID        = "ESP32-GATEWAY-GERBANG-01";

// 2. PINOUT WIRING ESP32 KE MFRC522 (STANDAR SPI)
#define SS_PIN    5   // Chip Select (SDA)
#define RST_PIN   22  // Reset pin MFRC522
#define BUZZER_PIN 4  // Active Buzzer
#define LED_GREEN  2  // LED Status Sukses (Built-in LED / Eksternal)
#define LED_RED   15  // LED Status Ditolak / Double Scan

MFRC522 rfid(SS_PIN, RST_PIN);

// Debounce Hardware untuk mencegah trigger berulang dalam milidetik
unsigned long lastScanMillis = 0;
const unsigned long HARDWARE_DEBOUNCE_MS = 2500;

// Deklarasi Fungsi Feedback Audio Visual
void feedbackSuccess() {
  digitalWrite(LED_GREEN, HIGH);
  tone(BUZZER_PIN, 1800, 100);
  delay(120);
  tone(BUZZER_PIN, 2400, 150);
  delay(200);
  digitalWrite(LED_GREEN, LOW);
}

void feedbackWarning() {
  digitalWrite(LED_RED, HIGH);
  tone(BUZZER_PIN, 600, 250);
  delay(300);
  tone(BUZZER_PIN, 600, 250);
  delay(200);
  digitalWrite(LED_RED, LOW);
}

void feedbackError() {
  digitalWrite(LED_RED, HIGH);
  tone(BUZZER_PIN, 300, 600);
  delay(650);
  digitalWrite(LED_RED, LOW);
}

void connectToWiFi() {
  Serial.print("Menghubungkan ke Wi-Fi: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\\n[Wi-Fi] Terkoneksi! IP Address: " + WiFi.localIP().toString());
  } else {
    Serial.println("\\n[Wi-Fi] Gagal terkoneksi! Periksa SSID & Password.");
  }
}

void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);

  // Beep start up
  tone(BUZZER_PIN, 1500, 80);
  connectToWiFi();

  Serial.println("==================================================");
  Serial.println("ESP32 RFID Attendance Scanner Kiosk Siap...");
  Serial.println("Dekatkan Kartu Siswa ke MFRC522...");
  Serial.println("==================================================");
}

void loop() {
  // Cek koneksi Wi-Fi secara periodik
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  // Cek apakah ada kartu RFID baru terdeteksi
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    return;
  }

  // Proteksi hardware debounce
  if (millis() - lastScanMillis < HARDWARE_DEBOUNCE_MS) {
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    return;
  }
  lastScanMillis = millis();

  // Konversi UID Byte Array ke Format String Hex (contoh: "A4 89 2C 11")
  String uidString = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uidString += "0";
    uidString += String(rfid.uid.uidByte[i], HEX);
    if (i < rfid.uid.size - 1) uidString += " ";
  }
  uidString.toUpperCase();

  Serial.println("\\n[RFID] Kartu Terdeteksi! UID: " + uidString);

  // Kirim HTTP POST Request ke Backend Server
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(SERVER_ENDPOINT);
    http.addHeader("Content-Type", "application/json");

    // Format JSON Payload
    StaticJsonDocument<200> doc;
    doc["rfid_uid"] = uidString;
    doc["kiosk_id"] = KIOSK_ID;
    String requestBody;
    serializeJson(doc, requestBody);

    Serial.println("[HTTP] Mengirim data ke server: " + requestBody);
    int httpResponseCode = http.POST(requestBody);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("[HTTP] Response (" + String(httpResponseCode) + "): " + response);

      StaticJsonDocument<512> resDoc;
      DeserializationError err = deserializeJson(resDoc, response);

      if (!err) {
        bool success = resDoc["success"];
        const char* outcome = resDoc["outcome"];

        if (success) {
          Serial.println("[STATUS] Presensi Berhasil Dicatat!");
          feedbackSuccess();
        } else if (strcmp(outcome, "DOUBLE_SCAN_PREVENTED") == 0) {
          Serial.println("[STATUS] Double Scan Dicegah (5 Menit Debounce).");
          feedbackWarning();
        } else {
          Serial.println("[STATUS] Kartu Ditolak / Tidak Dikenali!");
          feedbackError();
        }
      } else {
        feedbackError();
      }
    } else {
      Serial.println("[HTTP] Gagal mengirim data! Error: " + http.errorToString(httpResponseCode));
      feedbackError();
    }
    http.end();
  } else {
    Serial.println("[Wi-Fi] Tidak ada jaringan!");
    feedbackError();
  }

  // Hentikan pembacaan kartu saat ini
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}
`;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs uppercase tracking-wider text-indigo-600 font-semibold">
            Dokumentasi Arsitektur & Hardware Engineering
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Blueprint Teknis Sistem Absensi RFID & QR
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Skema database SQL, spesifikasi REST API, kode C++ firmware ESP32, dan petunjuk deployment
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
        <button
          onClick={() => setActiveSection('database')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeSection === 'database'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>1. Skema Database SQL</span>
        </button>

        <button
          onClick={() => setActiveSection('api')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeSection === 'api'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>2. Logika API & Time-Window</span>
        </button>

        <button
          onClick={() => setActiveSection('esp32')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeSection === 'esp32'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>3. Kode Firmware ESP32 C++</span>
        </button>

        <button
          onClick={() => setActiveSection('wiring')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeSection === 'wiring'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>4. Skematik Wiring MFRC522</span>
        </button>

        <button
          onClick={() => setActiveSection('deployment')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeSection === 'deployment'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>5. Panduan Deployment</span>
        </button>

        <button
          onClick={() => setActiveSection('tester')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeSection === 'tester'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-indigo-600 hover:bg-indigo-50'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Live API Tester</span>
        </button>
      </div>

      {/* SECTION 1: DATABASE SCHEMA */}
      {activeSection === 'database' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Skema Database SQL Lengkap (PostgreSQL / Supabase / MySQL)
              </h3>
              <p className="text-xs text-slate-500">
                Dilengkapi Foreign Keys, Constraints, dan Composite Index untuk kecepatan scan &lt; 50ms
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(sqlSchemaCode, 'sql')}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs"
            >
              {copiedKey === 'sql' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin SQL DDL</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 bg-slate-950 overflow-x-auto max-h-[580px]">
            <pre className="font-mono text-xs text-emerald-400 leading-relaxed selection:bg-emerald-900">
              {sqlSchemaCode}
            </pre>
          </div>

          {/* Architecture notes */}
          <div className="p-5 bg-slate-50/70 border-t border-slate-200 text-xs space-y-2">
            <h4 className="font-bold text-slate-900">Penjelasan Desain Skema:</h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>
                <strong>Tabel <code>rfid_cards</code>:</strong> Memisahkan kartu fisik dari entitas siswa.
                Hal ini memungkinkan proses penggantian kartu yang hilang tanpa merusak riwayat presensi lama.
              </li>
              <li>
                <strong>Indeks Komposit <code>idx_attendance_student_date</code>:</strong> Mengunci pencarian
                riwayat siswa pada hari H dalam milidetik untuk validasi double-scan 5 menit.
              </li>
              <li>
                <strong>Tabel <code>attendance_logs</code>:</strong> Menggunakan timestamp presisi dengan
                pencatatan kiosk_id perangkat fisik untuk audit trail keamanan sekolah.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* SECTION 2: API & BUSINESS LOGIC */}
      {activeSection === 'api' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Spesifikasi API Endpoint & Aturan Time-Window
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Protokol komunikasi REST JSON antara alat Hardware ESP32, Kamera HP Web Scanner, dan Backend Server.
              </p>
            </div>

            {/* Endpoint 1: RFID */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 p-3.5 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-indigo-600 text-white px-2 py-0.5 rounded">
                    POST
                  </span>
                  <span className="font-mono font-bold text-xs text-slate-800">
                    /api/attendance/scan-rfid
                  </span>
                </div>
                <span className="text-xs text-slate-500">Hardware ESP32 / USB HID Reader</span>
              </div>

              <div className="p-4 space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Request Payload (JSON):</span>
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono">
{`{
  "rfid_uid": "A4 89 2C 11",
  "kiosk_id": "ESP32-GATEWAY-GERBANG-01"
}`}
                  </pre>
                </div>

                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Response Success (200 OK):</span>
                  <pre className="p-3 bg-slate-900 text-emerald-300 rounded-lg font-mono">
{`{
  "outcome": "SUCCESS",
  "success": true,
  "type": "MASUK",
  "message": "Presensi MASUK berhasil dicatat (HADIR)",
  "student": {
    "id": "std-001",
    "nisn": "0068192841",
    "name": "Ahmad Fauzan Syahputra",
    "className": "X RPL 1"
  },
  "timestamp": "2026-10-03T07:05:12Z"
}`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Endpoint 2: Barcode / QR */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 p-3.5 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-indigo-600 text-white px-2 py-0.5 rounded">
                    POST
                  </span>
                  <span className="font-mono font-bold text-xs text-slate-800">
                    /api/attendance/scan-barcode
                  </span>
                </div>
                <span className="text-xs text-slate-500">Kamera HP Web / PWA</span>
              </div>

              <div className="p-4 space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Request Payload (JSON):</span>
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono">
{`{
  "barcode": "SIS-0068192841",
  "kiosk_id": "MOBILE-CAM-PIKET-01"
}`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Algoritma Double-Scan 5 Menit */}
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-2">
              <h4 className="font-bold text-amber-900">
                Logika Perlindungan Double-Scan (5-Minute Window):
              </h4>
              <p className="text-amber-800 leading-relaxed">
                Saat siswa menempelkan kartu berulang kali atau kartu tertahan di atas sensor, backend
                mengecek riwayat scan hari ini untuk <code>student_id</code> tersebut. Jika selisih waktu
                antara scan saat ini dan scan terakhir kurang dari 300 detik (5 menit), request ditolak
                dengan status <code>DOUBLE_SCAN_PREVENTED</code> dan mengembalikan sisa waktu tunggu.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: ESP32 CODE */}
      {activeSection === 'esp32' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Kode C++ Arduino IDE (ESP32 + RFID MFRC522 + Wi-Fi HTTP)
              </h3>
              <p className="text-xs text-slate-500">
                Dilengkapi auto reconnect Wi-Fi, serial debugging, buzzer dual-tone, dan parsing JSON response
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(esp32CppCode, 'esp32')}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs"
            >
              {copiedKey === 'esp32' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Kode C++</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 bg-slate-950 overflow-x-auto max-h-[580px]">
            <pre className="font-mono text-xs text-cyan-300 leading-relaxed selection:bg-cyan-900">
              {esp32CppCode}
            </pre>
          </div>
        </div>
      )}

      {/* SECTION 4: WIRING SCHEMATIC */}
      {activeSection === 'wiring' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Tabel Skematik & Wiring Pinout (ESP32 ke MFRC522)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Hubungkan pin SPI modul MFRC522 RFID, Active Buzzer, dan LED Indikator ke pin GPIO ESP32.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Modul MFRC522 Pin</th>
                  <th className="px-4 py-3">Pin ESP32 (GPIO)</th>
                  <th className="px-4 py-3">Fungsi / Deskripsi SPI</th>
                  <th className="px-4 py-3">Warna Kabel Standar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr>
                  <td className="px-4 py-2.5 font-bold text-indigo-700">VCC (3.3V)</td>
                  <td className="px-4 py-2.5 font-bold text-rose-600">3V3</td>
                  <td className="px-4 py-2.5 font-sans text-slate-600">
                    Catu daya 3.3V (PERINGATAN: Jangan hubungkan ke 5V!)
                  </td>
                  <td className="px-4 py-2.5 font-sans text-rose-700">Merah</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-bold text-indigo-700">RST (Reset)</td>
                  <td className="px-4 py-2.5 text-slate-800">GPIO 22</td>
                  <td className="px-4 py-2.5 font-sans text-slate-600">Hardware Reset Pin</td>
                  <td className="px-4 py-2.5 font-sans text-amber-700">Kuning / Orange</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-bold text-indigo-700">GND (Ground)</td>
                  <td className="px-4 py-2.5 text-slate-800">GND</td>
                  <td className="px-4 py-2.5 font-sans text-slate-600">Ground Referensi</td>
                  <td className="px-4 py-2.5 font-sans text-slate-800">Hitam</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-bold text-indigo-700">MISO</td>
                  <td className="px-4 py-2.5 text-slate-800">GPIO 19</td>
                  <td className="px-4 py-2.5 font-sans text-slate-600">Master In Slave Out (SPI)</td>
                  <td className="px-4 py-2.5 font-sans text-blue-700">Biru</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-bold text-indigo-700">MOSI</td>
                  <td className="px-4 py-2.5 text-slate-800">GPIO 23</td>
                  <td className="px-4 py-2.5 font-sans text-slate-600">Master Out Slave In (SPI)</td>
                  <td className="px-4 py-2.5 font-sans text-emerald-700">Hijau</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-bold text-indigo-700">SCK</td>
                  <td className="px-4 py-2.5 text-slate-800">GPIO 18</td>
                  <td className="px-4 py-2.5 font-sans text-slate-600">Serial Clock (SPI)</td>
                  <td className="px-4 py-2.5 font-sans text-purple-700">Ungu</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-bold text-indigo-700">SDA (SS / CS)</td>
                  <td className="px-4 py-2.5 text-slate-800">GPIO 5</td>
                  <td className="px-4 py-2.5 font-sans text-slate-600">Slave Select (Chip Enable)</td>
                  <td className="px-4 py-2.5 font-sans text-slate-600">Putih / Abu</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Feedback peripherals table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Komponen Feedback</th>
                  <th className="px-4 py-3">Pin ESP32 (GPIO)</th>
                  <th className="px-4 py-3">Indikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr>
                  <td className="px-4 py-2.5 font-bold text-slate-800">Active Buzzer (Positif)</td>
                  <td className="px-4 py-2.5">GPIO 4</td>
                  <td className="px-4 py-2.5 font-sans text-slate-600">
                    Beep 2x = Berhasil; Buzz Panjang = Gagal / Double Scan
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-bold text-emerald-700">LED Hijau (Anoda)</td>
                  <td className="px-4 py-2.5">GPIO 2 (Built-in)</td>
                  <td className="px-4 py-2.5 font-sans text-slate-600">Menyala saat presensi berhasil</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-bold text-rose-700">LED Merah (Anoda)</td>
                  <td className="px-4 py-2.5">GPIO 15</td>
                  <td className="px-4 py-2.5 font-sans text-slate-600">
                    Menyala saat kartu tidak terdaftar / double scan dicegah
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 5: DEPLOYMENT GUIDE */}
      {activeSection === 'deployment' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Panduan Integrasi Alat & Opsi Deployment
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Langkah menghubungkan alat fisik ke backend dan memilih infrastruktur cloud gratis/hemat biaya.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>Langkah 1: Setup Jaringan Lokal Sekolah (LAN / Wi-Fi)</span>
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Untuk lingkungan sekolah dengan koneksi internet terbatas, server Node.js / Express
                dapat dijalankan pada komputer server mini (seperti Intel NUC atau Mini PC di ruang tata usaha).
                Berikan IP Statis (misalnya <code>192.168.1.100</code>), lalu masukkan URL endpoint tersebut
                pada file sketch ESP32.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>Langkah 2: Opsi Penggelaran Cloud (Hemat Biaya / Free Tier)</span>
              </h4>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li>
                  <strong>Database: Supabase (PostgreSQL)</strong> - Menyediakan free-tier 500MB database,
                  cukup untuk menampung jutaan riwayat scan siswa selama bertahun-tahun.
                </li>
                <li>
                  <strong>Backend API: Render / Railway</strong> - Deploy image Node.js atau Docker
                  dengan free web service dan HTTPS gratis.
                </li>
                <li>
                  <strong>Frontend PWA / Kiosk: Vercel / Cloudflare Pages</strong> - Cepat diakses dari
                  HP guru piket dan browser monitor gerbang dengan caching edge global.
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>Alternatif Hardware: USB RFID Reader HID Keyboard Emulation</span>
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Jika sekolah tidak ingin merakit mikrokontroler ESP32, cukup beli alat <strong>USB RFID Reader 13.56MHz</strong> (seharga ~Rp 45.000). Alat ini langsung dicolokkan ke laptop/PC pos satpam melalui USB dan bekerja sebagai keyboard emulator yang mengetikkan UID kartu secara otomatis ke halaman Kiosk Monitor aplikasi ini.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: LIVE API TESTER SANDBOX */}
      {activeSection === 'tester' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Live API Endpoint Tester & Simulator
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Kirimkan simulasi payload HTTP POST secara langsung untuk menguji respon JSON backend, verifikasi time-window, dan pencegahan double-scan 5 menit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Request Editor */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Target Endpoint
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTestEndpoint('rfid');
                      setTestPayload('A4 89 2C 11');
                    }}
                    className={`p-2.5 rounded-lg border text-xs font-bold text-left transition-all ${
                      testEndpoint === 'rfid'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    POST /scan-rfid
                    <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                      Hardware UID RFID
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTestEndpoint('barcode');
                      setTestPayload('SIS-0068192841');
                    }}
                    className={`p-2.5 rounded-lg border text-xs font-bold text-left transition-all ${
                      testEndpoint === 'barcode'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    POST /scan-barcode
                    <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                      Kamera HP Barcode
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nilai Payload ({testEndpoint === 'rfid' ? 'rfid_uid' : 'barcode'})
                </label>
                <input
                  type="text"
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kiosk Device ID
                </label>
                <input
                  type="text"
                  value={testKioskId}
                  onChange={(e) => setTestKioskId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={handleRunApiTest}
                disabled={isTesting || !testPayload}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isTesting ? 'Mengirim Request...' : 'Kirim HTTP POST Request'}</span>
              </button>

              <div className="pt-2 text-[11px] text-slate-400">
                <strong>Tips Uji Coba:</strong> Klik tombol kirim 2 kali berturut-turut untuk melihat
                langsung respon <code>DOUBLE_SCAN_PREVENTED</code> bekerja.
              </div>
            </div>

            {/* Response Viewer */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                JSON Response Output (Live)
              </label>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 h-80 overflow-y-auto font-mono text-xs">
                {testResponse ? (
                  <pre
                    className={`leading-relaxed ${
                      testResponse.success
                        ? 'text-emerald-300'
                        : testResponse.outcome === 'DOUBLE_SCAN_PREVENTED'
                        ? 'text-amber-300'
                        : 'text-rose-300'
                    }`}
                  >
                    {JSON.stringify(testResponse, null, 2)}
                  </pre>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
                    Belum ada request dikirim. Tekan tombol Kirim di samping.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
