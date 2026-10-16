import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getEcho } from '../echo';

const INITIAL_CAMPAIGN = {
  id: 1,
  title: 'Satu Hati untuk Palestina',
  subtitle: 'Lembaga Amil Zakat (LAZ) Al Azhar Peduli',
  targetAmount: 500000000, // Rp 500.000.000 (Target 500 Juta)
  currentAmount: 0,
  progressPercentage: 0,
  verifiedCount: 0,
  qrisAmount: 0,
  qrisCount: 0,
  cashAmount: 0,
  cashCount: 0,
  committedAmount: 0,
  committedCount: 0,
  qrisImagePath: '/images/qris-palestina.png',
  bankInfo: {
    bankName: 'Bank Syariah Indonesia (BSI)',
    accountNumber: '7000192826',
    accountHolder: 'YPI Al Azhar'
  }
};

const DonationContext = createContext(null);

export function DonationProvider({ children }) {
  const [campaign, setCampaign] = useState(INITIAL_CAMPAIGN);
  const [verifiedDonations, setVerifiedDonations] = useState([]);
  const [allAdminDonations, setAllAdminDonations] = useState([]);
  const [activeTab, setActiveTab] = useState('public'); // 'public' | 'admin'
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [latestApprovedDonation, setLatestApprovedDonation] = useState(null);
  // Fetch Public Data (Total progress & Verified Dinding Doa)
  const fetchPublicData = useCallback(async () => {
    try {
      const res = await fetch('/api/donations', {
        headers: { Accept: 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setCampaign((prev) => ({
          ...prev,
          ...data.campaign
        }));
        setVerifiedDonations((prev) => {
          const next = data.donations || [];
          if (
            prev.length === next.length &&
            prev.every((item, idx) => item.id === next[idx]?.id && item.amount === next[idx]?.amount && item.status === next[idx]?.status)
          ) {
            return prev;
          }
          return next;
        });
      }
    } catch (err) {
      console.error('[ZECRUS API] Gagal memuat data donasi publik:', err);
    }
  }, []);

  // Fetch Admin Data (All Pending, Verified, Rejected)
  const fetchAdminData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/donations', {
        headers: { Accept: 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setAllAdminDonations(data.donations || []);
        // CATATAN: currentAmount hanya ditulis oleh fetchPublicData (/api/donations)
        // agar tidak bentrok bolak-balik dengan /api/admin/donations.
        if (data.committedAmount !== undefined) {
          setCampaign((prev) => ({
            ...prev,
            committedAmount: data.committedAmount || 0,
            committedCount: data.committedCount || 0,
            committedPaidAmount: data.committedPaidAmount || 0,
            committedPaidCount: data.committedPaidCount || 0
          }));
        }
      }
    } catch (err) {
      console.error('[ZECRUS API] Gagal memuat data admin:', err);
    }
  }, []);

  // Check auth session
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/me', {
        headers: { Accept: 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  // Logout Admin / Kembali ke Kiosk
  const logoutAdmin = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        headers: { Accept: 'application/json' }
      });
    } catch (err) {
      console.error('[ZECRUS] Gagal memanggil logout API:', err);
    }
    window.location.href = '/';
  };

  // Initial load: langsung muat data publik & data admin tanpa perlu login
  useEffect(() => {
    fetchPublicData();
    fetchAdminData();
    checkAuth();
  }, [fetchPublicData, fetchAdminData, checkAuth]);

  // Realtime Auto-Sync Polling (Sync berkala setiap 3 detik & saat tab aktif)
  useEffect(() => {
    const syncInterval = setInterval(() => {
      fetchPublicData();
      fetchAdminData();
    }, 3000);

    const handleFocus = () => {
      fetchPublicData();
      fetchAdminData();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchPublicData, fetchAdminData]);
  // Realtime WebSocket Subscription with Pusher / Laravel Echo
  useEffect(() => {
    const echo = getEcho();
    if (!echo) return;

    // 1. Channel Publik: Menerima status donasi disetujui/ditolak & update progress
    const publicChannel = echo.channel('public-donations');
    publicChannel.listen('.donation.status.updated', (e) => {
      setCampaign((prev) => ({
        ...prev,
        currentAmount: e.currentAmount,
        progressPercentage: e.progressPercentage,
        verifiedCount: e.verifiedCount
      }));
      if (e.action === 'approved' && e.donation) {
        setLatestApprovedDonation(e.donation);
        setVerifiedDonations((prev) => {
          // Hindari duplikasi jika id sudah ada
          if (prev.some((item) => item.id === e.donation.id)) {
            return prev.map((item) => (item.id === e.donation.id ? e.donation : item));
          }
          return [e.donation, ...prev];
        });
      } else if (e.action === 'rejected' && e.donation) {
        setVerifiedDonations((prev) => prev.filter((item) => item.id !== e.donation.id));
      }
    });

    // 2. Channel Admin: Menerima notifikasi seketika donatur transfer baru
    const adminChannel = echo.channel('admin-donations');
    adminChannel.listen('.donation.created', (e) => {
      if (e.donation) {
        setAllAdminDonations((prev) => {
          if (prev.some((item) => item.id === e.donation.id)) return prev;
          return [e.donation, ...prev];
        });
      }
    });

    return () => {
      echo.leaveChannel('public-donations');
      echo.leaveChannel('admin-donations');
    };
  }, []);

  // Filtered lists for Admin Panel
  const pendingDonations = allAdminDonations.filter((d) => d.status === 'pending');
  const adminVerifiedDonations = allAdminDonations.filter((d) => d.status === 'verified');
  const rejectedDonations = allAdminDonations.filter((d) => d.status === 'rejected');

  // Approve donasi oleh admin
  const approveDonation = async (id) => {
    // Optimistic UI update
    setAllAdminDonations((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'verified', verifiedAt: 'Baru saja' } : d))
    );

    try {
      const res = await fetch(`/api/admin/donations/${id}/approve`, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json'
        }
      });
      if (res.ok) {
        fetchPublicData();
        fetchAdminData();
      }
    } catch (err) {
      console.error('[ZECRUS] Gagal approve donasi:', err);
      fetchAdminData();
    }
  };

  // Tolak donasi oleh admin
  const rejectDonation = async (id) => {
    setAllAdminDonations((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'rejected' } : d))
    );

    try {
      const res = await fetch(`/api/admin/donations/${id}/reject`, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json'
        }
      });
      if (res.ok) {
        fetchPublicData();
        fetchAdminData();
      }
    } catch (err) {
      console.error('[ZECRUS] Gagal reject donasi:', err);
      fetchAdminData();
    }
  };

  // Input manual donasi cash / komitmen oleh amil
  const submitManualCash = async ({ donorName, donorPhone, amount, donatedAt, isCommitment, prayerMessage }) => {
    try {
      const res = await fetch('/api/admin/donations/manual-cash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          donor_name: donorName,
          donor_phone: donorPhone,
          amount: Number(amount),
          donated_at: donatedAt,
          is_commitment: Boolean(isCommitment),
          prayer_message: prayerMessage
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchPublicData();
        fetchAdminData();
        return { success: true, message: data.message };
      }
      return {
        success: false,
        message: data.message || (data.errors ? Object.values(data.errors).flat()[0] : 'Gagal mencatat donasi')
      };
    } catch (err) {
      console.error('[ZECRUS] Error input cash manual:', err);
      return { success: false, message: 'Koneksi error ke server' };
    }
  };

  // Parse PDF laporan QRIS Danamon (Mendukung 1 file atau banyak file sekaligus)
  const parseQrisPdf = async (files) => {
    const formData = new FormData();
    if (Array.isArray(files)) {
      files.forEach((file) => {
        formData.append('pdfs[]', file);
      });
    } else {
      formData.append('pdf', files);
    }
    try {
      const res = await fetch('/api/admin/donations/parse-pdf', {
        method: 'POST',
        headers: {
          Accept: 'application/json'
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, ...data };
      }
      return {
        success: false,
        message: data.message || (data.errors ? Object.values(data.errors).flat()[0] : 'Gagal memproses file PDF')
      };
    } catch (err) {
      console.error('[ZECRUS] Error parsing PDF:', err);
      return { success: false, message: 'Gagal menghubungi server untuk parsing PDF' };
    }
  };

  // Impor batch transaksi QRIS hasil review ke database
  const importPdfBatch = async (items) => {
    try {
      const res = await fetch('/api/admin/donations/import-pdf-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ items })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchPublicData();
        fetchAdminData();
        return { success: true, message: data.message, ...data };
      }
      return {
        success: false,
        message: data.message || (data.errors ? Object.values(data.errors).flat()[0] : 'Gagal mengimpor batch QRIS')
      };
    } catch (err) {
      console.error('[ZECRUS] Error batch import QRIS:', err);
      return { success: false, message: 'Gagal menyimpan transaksi QRIS ke server' };
    }
  };

  // Impor batch transaksi dari file Excel (.xlsx)
  const parseExcel = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/admin/donations/parse-excel', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, ...data };
      }
      return {
        success: false,
        message: data.message || (data.errors ? Object.values(data.errors).flat()[0] : 'Gagal memproses file Excel')
      };
    } catch (err) {
      console.error('[ZECRUS] Error parsing Excel:', err);
      return { success: false, message: 'Gagal menghubungi server untuk parsing Excel' };
    }
  };

  const importExcelBatch = async (items) => {
    try {
      const res = await fetch('/api/admin/donations/import-excel-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ items })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchPublicData();
        fetchAdminData();
        return { success: true, ...data };
      }
      return {
        success: false,
        message: data.message || (data.errors ? Object.values(data.errors).flat()[0] : 'Gagal mengimpor batch Excel')
      };
    } catch (err) {
      console.error('[ZECRUS] Error batch import Excel:', err);
      return { success: false, message: 'Gagal menyimpan data Excel ke server' };
    }
  };

  return (
    <DonationContext.Provider
      value={{
        campaign,
        donations: allAdminDonations,
        verifiedDonations,
        pendingDonations,
        adminVerifiedDonations,
        rejectedDonations,
        currentAmount: campaign.currentAmount,
        progressPercentage: campaign.progressPercentage,
        activeTab,
        setActiveTab,
        currentUser: currentUser || { name: 'Amil LAZ Al Azhar Peduli', email: 'amil@lazalazhar.org' },
        isAuthenticated: true,
        isAuthLoading: false,
        logoutAdmin,
        approveDonation,
        rejectDonation,
        submitManualCash,
        parseQrisPdf,
        importPdfBatch,
        parseExcel,
        importExcelBatch,
        latestApprovedDonation,
        setLatestApprovedDonation,
        refetchPublic: fetchPublicData,
        refetchAdmin: fetchAdminData
      }}
    >
      {children}
    </DonationContext.Provider>
  );
}

export function useDonation() {
  const context = useContext(DonationContext);
  if (!context) {
    throw new Error('useDonation must be used within a DonationProvider');
  }
  return context;
}
