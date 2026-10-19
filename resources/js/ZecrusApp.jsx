import React, { useState, useEffect } from 'react';
import { DonationProvider, useDonation } from './context/DonationContext';
import SinglePageKiosk from './components/SinglePageKiosk';
import AdminPanel from './components/AdminPanel';
import SandParticleOverlay from './components/SandParticleOverlay';
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
      <div
        className="min-h-screen w-full relative font-sans text-[#1C140E] bg-[#EFE8DD] selection:bg-amber-200 selection:text-amber-950 flex flex-col"
        style={{
          backgroundImage: "url('/images/bg-desert.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-[#EFE8DD]/88 backdrop-blur-[2px] pointer-events-none z-0" />
        <div className="pointer-events-none opacity-35 fixed inset-0 z-0 overflow-hidden">
          <SandParticleOverlay />
        </div>
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
