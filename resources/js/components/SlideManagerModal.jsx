import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Trash2, Plus, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SlideManagerModal({ isOpen, onClose }) {
  const [slides, setSlides] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [badgeText, setBadgeText] = useState('DOKUMENTASI KEGIATAN');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const fileInputRef = useRef(null);

  const fetchSlides = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/activity-slides', {
        headers: { Accept: 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setSlides(data.slides || []);
      }
    } catch {
      setErrorMsg('Gagal memuat daftar slide kegiatan.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSlides();
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setErrorMsg('');
    }
  };

  const handleAddSlide = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!title.trim()) {
      setErrorMsg('Judul kegiatan wajib diisi.');
      return;
    }

    if (!imageFile) {
      setErrorMsg('Foto dokumentasi kegiatan wajib dipilih.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('badge_text', badgeText.trim());
    formData.append('image', imageFile);

    setIsUploading(true);
    try {
      const res = await fetch('/api/admin/activity-slides', {
        method: 'POST',
        headers: {
          Accept: 'application/json'
        },
        body: formData
      });
      const data = await res.json();
      setIsUploading(false);

      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Slide berhasil ditambahkan!');
        setTitle('');
        setDescription('');
        setImageFile(null);
        setImagePreview(null);
        fetchSlides();
      } else {
        setErrorMsg(data.message || 'Gagal mengunggah slide kegiatan.');
      }
    } catch {
      setIsUploading(false);
      setErrorMsg('Terjadi kesalahan jaringan.');
    }
  };

  const handleDeleteSlide = async (id) => {
    if (!confirm('Yakin ingin menghapus slide kegiatan ini?')) return;

    try {
      const res = await fetch(`/api/admin/activity-slides/${id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Slide kegiatan berhasil dihapus.');
        fetchSlides();
      } else {
        setErrorMsg(data.message || 'Gagal menghapus slide.');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan jaringan saat menghapus.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border-[3px] border-stone-900 rounded-3xl p-5 sm:p-6 max-w-2xl w-full shadow-brutal-lg animate-in zoom-in-95 my-6 text-stone-900">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b-2 border-stone-900 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400 border-2 border-stone-900 flex items-center justify-center font-bold text-lg shadow-brutal-sm">
              📸
            </div>
            <div>
              <h3 className="font-display text-xl sm:text-2xl text-stone-900 leading-none">
                KELOLA SLIDE FOTO KEGIATAN
              </h3>
              <p className="text-xs text-stone-600 font-semibold mt-0.5">
                Dokumentasi foto kegiatan yang tampil berputar di layar depan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border-2 border-stone-900 flex items-center justify-center hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="mb-3 bg-red-50 border-2 border-red-500 text-red-700 text-xs font-bold rounded-xl p-2.5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-3 bg-emerald-50 border-2 border-emerald-600 text-emerald-800 text-xs font-bold rounded-xl p-2.5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleAddSlide} className="bg-stone-50 border-2 border-stone-900 rounded-2xl p-4 mb-5 space-y-3">
          <h4 className="font-poster font-black text-xs text-stone-900 uppercase flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-emerald-700" />
            <span>Tambah Slide Foto Baru</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Judul Kegiatan *
              </label>
              <input
                type="text"
                placeholder="Cth: Penyerahan Bantuan Pangan Palestina"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-3 sm:py-2 border-2 border-stone-900 rounded-xl text-base sm:text-xs font-semibold outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Label Tag / Badge
              </label>
              <input
                type="text"
                placeholder="Cth: AKSI KEMANUSIAAN"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                className="w-full px-3 py-3 sm:py-2 border-2 border-stone-900 rounded-xl text-base sm:text-xs font-semibold outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-700 mb-1">
              Deskripsi Singkat (Opsional)
            </label>
            <input
              type="text"
              placeholder="Cth: Penyaluran logistik bersama relawan LAZ Al Azhar di kamp pengungsian"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-3 sm:py-2 border-2 border-stone-900 rounded-xl text-base sm:text-xs font-medium outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
            />
          </div>

          {/* Image Picker */}
          <div>
            <label className="block text-[11px] font-bold text-stone-700 mb-1">
              Upload Foto Kegiatan *
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-stone-400 hover:border-stone-900 rounded-xl p-3 text-center cursor-pointer bg-white transition-colors flex items-center justify-center gap-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              {imagePreview ? (
                <div className="flex items-center gap-3">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-16 h-12 object-cover rounded-lg border border-stone-300"
                  />
                  <div className="text-left">
                    <span className="text-xs font-bold text-emerald-800 block">{imageFile?.name}</span>
                    <span className="text-[10px] text-stone-500">Klik untuk ganti gambar</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-stone-600">
                  <ImageIcon className="w-5 h-5 text-stone-500" />
                  <span className="text-xs font-bold">Pilih File Foto (JPG / PNG / WebP)</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isUploading}
              className="w-full sm:w-auto px-5 py-3 sm:py-2 bg-emerald-700 hover:bg-emerald-800 text-white border-2 border-stone-900 rounded-xl text-sm sm:text-xs font-bold shadow-brutal-sm cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengunggah...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Simpan & Tayangkan Slide</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Existing Slides List */}
        <div>
          <h4 className="font-poster font-black text-xs text-stone-900 uppercase mb-2">
            Slide yang Sedang Tayang ({slides.length})
          </h4>

          {isLoading ? (
            <div className="py-6 text-center text-xs text-stone-500 font-bold">
              Memuat slide...
            </div>
          ) : slides.length === 0 ? (
            <div className="py-6 text-center text-xs text-stone-500 font-bold bg-stone-50 border border-stone-200 rounded-xl">
              Belum ada foto kegiatan. Silakan upload slide pertama di atas!
            </div>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {slides.map((s) => (
                <div
                  key={s.id}
                  className="bg-white border-2 border-stone-900 rounded-xl p-2.5 flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={s.image_path}
                      alt={s.title}
                      className="w-14 h-11 object-cover rounded-lg border border-stone-300 shrink-0"
                    />
                    <div className="truncate">
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded border border-amber-300 inline-block mb-0.5">
                        {s.badge_text || 'KEGIATAN'}
                      </span>
                      <h5 className="font-bold text-xs text-stone-900 truncate">{s.title}</h5>
                      {s.description && (
                        <p className="text-[10px] text-stone-500 truncate">{s.description}</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteSlide(s.id)}
                    className="p-2.5 sm:p-1.5 hover:bg-red-50 text-red-600 rounded-lg border border-stone-300 hover:border-red-600 transition-colors shrink-0 cursor-pointer"
                    title="Hapus slide"
                  >
                    <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
