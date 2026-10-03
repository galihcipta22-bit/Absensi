import React, { useState } from 'react';
import { Header, NavTab } from './components/Header';
import { KioskMode } from './components/KioskMode';
import { CameraScanner } from './components/CameraScanner';
import { AdminDashboard } from './components/AdminDashboard';
import { StudentPortal } from './components/StudentPortal';
import { ArchitectureDocs } from './components/ArchitectureDocs';
import { QuickTapModal } from './components/QuickTapModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('kiosk');
  const [isQuickTapOpen, setIsQuickTapOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Bar Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickTap={() => setIsQuickTapOpen(true)}
      />

      {/* Main Viewport */}
      <main className="flex-1">
        {activeTab === 'kiosk' && <KioskMode />}
        {activeTab === 'camera' && <CameraScanner />}
        {activeTab === 'admin' && <AdminDashboard />}
        {activeTab === 'student' && <StudentPortal />}
        {activeTab === 'architecture' && <ArchitectureDocs />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">SI-ABSENSI</span>
            <span>·</span>
            <span>Sistem Presensi Siswa Terpadu RFID & Barcode</span>
            <span>·</span>
            <span>Versi MVP 2.4</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('architecture')}
              className="hover:text-indigo-600 transition-colors"
            >
              Skema Database & C++ ESP32
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveTab('kiosk')}
              className="hover:text-indigo-600 transition-colors"
            >
              Standby Kiosk Gerbang
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveTab('student')}
              className="hover:text-indigo-600 transition-colors"
            >
              Kartu Pelajar Digital
            </button>
          </div>
        </div>
      </footer>

      {/* Quick Tap Testing Modal */}
      <QuickTapModal
        isOpen={isQuickTapOpen}
        onClose={() => setIsQuickTapOpen(false)}
      />
    </div>
  );
}
