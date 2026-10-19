import React, { useState, useEffect } from 'react';
import { DonationProvider, useDonation } from './context/DonationContext';
import SinglePageKiosk from './components/SinglePageKiosk';
import AdminPanel from './components/AdminPanel';

function MainContent() {
  const { activeTab, setActiveTab, isAuthenticated, isAuthLoading } = useDonation();
  const [isAdminRoute, setIsAdminRoute] = useState(() => {
    return window.location.pathname.startsWith('/admin');
  });

  useEffect(() => {
    const handleLocation = () => {
      setIsAdminRoute(window.location.pathname.startsWith('/admin'));
    };

    window.addEventListener('popstate', handleLocation);
    return () => window.removeEventListener('popstate', handleLocation);
  }, []);

  // Jika sedang mengakses URL /admin atau tab admin aktif -> Langsung ke Admin Panel
  if (isAdminRoute || activeTab === 'admin') {
    return (
      <div className="min-h-screen w-full bg-[#f1f5f3] text-slate-900 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-950 relative">
        <main className="flex-grow relative z-10 py-6">
          <AdminPanel />
        </main>
      </div>
    );
  }

  // Halaman Publik Utama (/) - 1 Layar Kiosk Display (No Scroll)
  return (
    <div className="min-h-screen md:h-screen md:max-h-screen bg-black text-white flex flex-col font-sans selection:bg-red-600 selection:text-white relative md:overflow-hidden">
      <SinglePageKiosk />
    </div>
  );
}

export default function ZecrusApp() {
  return (
    <DonationProvider>
      <MainContent />
    </DonationProvider>
  );
}
