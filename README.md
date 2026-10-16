# Satu Hati untuk Palestina — Zecrus 11th

Platform penggalangan dana **LAZ Al Azhar Peduli** untuk konser amal Zecrus 11th (SMP Islam Al Azhar 16 Cikarang).

Ada dua antarmuka:

| Antarmuka | URL | Fungsi |
|---|---|---|
| **Kiosk** | `/` | Layar monitor besar di venue. Total donasi real-time, daftar donatur berjalan, QRIS statis, slideshow dokumentasi kegiatan. |
| **Panel Amil** | `/admin` | Verifikasi donasi, input tunai/komitmen, impor QRIS (PDF) & Excel, kelola slide, rekap PDF, ekspor Excel. |

---

## Fitur

### Kiosk Publik (`/`)
- **Total donasi raksasa** dengan animasi hitung naik saat donasi baru masuk.
- **Daftar donatur** auto-scroll, menampilkan 3 nama sekaligus dengan badge metode (QRIS / TUNAI / KOMITMEN / ONLINE).
- **QRIS statis** — donatur memindai langsung tanpa unggah struk.
- **Slideshow dokumentasi kegiatan** dari foto yang diunggah amil.
- **Popup donatur terbaru** (ganti tiap 5 detik) + **selebrasi confetti** saat amil mencatat donasi.
- Sinkronisasi real-time via WebSocket (Laravel Echo) dengan fallback polling 3 detik.

### Panel Amil (`/admin`)
- **KPI**: total terverifikasi, total QRIS, total tunai, komitmen (sudah/belum donasi).
- **Filter**: semua, QRIS, tunai, komitmen, pending, terverifikasi, ditolak. Pencarian nama/ref/file.
- **Verifikasi**: setujui atau tolak donasi pending.
- **Komitmen/book**: ditandai `⏳ BELUM DONASI` / `💰 SUDAH DONASI`; tombol *Tandai Sudah Donasi* memasukkannya ke total progres.
- **Input tunai manual**: nama, nominal (format ribuan otomatis), tanggal, metode, pesan.
- **Impor QRIS (PDF)**: baca mutasi merchant Danamon, deteksi duplikat, review per baris sebelum impor.
- **Impor Excel (.xlsx)**: kolom *Nama, Nominal, Status, Metode, Tanggal, Ref, Pesan*; deteksi header otomatis; normalisasi tanggal & nominal Indonesia.
- **Ekspor Excel (.xlsx)**: seluruh donasi dengan 11 kolom lengkap.
- **Kelola slide kegiatan**: unggah/hapus foto dokumentasi.
- **Rekap PDF laporan**: ringkasan siap cetak + log audit dokumen PDF yang diimpor.

---

## Kebutuhan Sistem

- PHP **8.3+** dengan ekstensi `zip`, `xml`, `simplexml`, `pdo_sqlite` (atau `pdo_mysql`)
- Composer 2
- Node.js 20+ (hanya untuk build aset)

Tidak ada dependency PHP tambahan untuk baca/tulis Excel — `.xlsx` diproses langsung via `ZipArchive` + `SimpleXML`.

---

## Instalasi Lokal

```bash
git clone https://github.com/sarpraslazalazhar-pixel/Satu-Hati.git
cd Satu-Hati
composer setup
```

`composer setup` menjalankan: `composer install` → salin `.env` → `key:generate` → `migrate` → `npm install` → `npm run build`.

Setelah itu isi `.env` (lihat bagian Konfigurasi), lalu:

```bash
php artisan serve
```

Buka `http://localhost:8000/` untuk kiosk dan `http://localhost:8000/admin` untuk panel amil.

### Akun amil default

Dibuat oleh `php artisan db:seed`:

| Email | Password |
|---|---|
| `amil@lazalazhar.org` | `admin123` |
| `admin@zecrus.com` | `admin123` |

> Ganti password ini sebelum dipakai di produksi.

---

## Konfigurasi `.env`

```dotenv
APP_NAME="Zecrus 11th"
APP_ENV=production
APP_KEY=            # php artisan key:generate
APP_DEBUG=false
APP_URL=https://domain-anda.com

DB_CONNECTION=sqlite
# atau MySQL:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=nama_database
# DB_USERNAME=user
# DB_PASSWORD=password

SESSION_DRIVER=database
SESSION_PATH=/       # WAJIB "/" — jangan diubah

# Route maintenance tanpa SSH (/mig321, /mig123, /mig000, /mig999).
# Kosongkan setelah setup di produksi untuk mematikannya.
MAINTENANCE_TOKEN=

# Real-time (opsional; tanpa ini kiosk tetap jalan via polling 3 detik)
BROADCAST_CONNECTION=reverb   # atau pusher
PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_APP_CLUSTER=ap1
```

**Catatan penting:** `SESSION_PATH` harus `/`. Jika diisi path filesystem (mis. `C:/...`), Laravel akan gagal dengan `The cookie path "..." contains invalid characters`.

### Pembayaran online (opsional)

Kiosk memakai **QRIS statis**, jadi tidak perlu payment gateway. Isi bagian ini hanya jika ingin donasi online otomatis:

```dotenv
MAYAR_API_KEY=
MAYAR_BASE_URL=https://api.mayar.id
MAYAR_WEBHOOK_TOKEN=

TAKO_API_KEY=
TAKO_USERNAME=
TAKO_WEBHOOK_SECRET=
TAKO_BASE_URL=https://tako.id
```

---

## Perintah Berguna

```bash
php artisan serve              # server lokal
npm run dev                    # vite dev server (hot reload)
npm run build                  # build aset produksi
php artisan migrate --force    # jalankan migrasi
php artisan db:seed --force    # buat akun amil
php artisan test --compact     # jalankan tes
php artisan optimize           # cache config/route/view (produksi)
php artisan optimize:clear     # bersihkan cache
```

### Migrasi tanpa Terminal (shared hosting)

Set `MAINTENANCE_TOKEN` di `.env`, lalu buka lewat browser:

| URL | Fungsi |
|---|---|
| `/mig999?key=TOKEN` | Status migrasi + daftar tabel + akun amil |
| `/mig321?key=TOKEN` | Jalankan migrasi |
| `/mig000?key=TOKEN` | Buat akun amil (`db:seed`) |
| `/mig123?key=TOKEN` | **Hapus semua tabel** lalu migrasi ulang |

Kosongkan `MAINTENANCE_TOKEN` setelah selesai untuk mematikan route tersebut. Detail: [DEPLOYMENT.md](DEPLOYMENT.md).

---

## Struktur Direktori

```
app/
  Events/           DonationCreated, DonationStatusUpdated (broadcast real-time)
  Http/Controllers/ DonationController, ActivitySlideController, AuthController
  Models/           Donation, ActivitySlide, User
  Services/         ExcelImportService, ExcelExportService, QrisPdfParserService
resources/js/
  components/       SinglePageKiosk, AdminPanel, ExcelImportModal, QrisImportModal, ...
  context/          DonationContext (sumber state tunggal + polling/Echo)
  hooks/            useCountUp
routes/
  api.php           Endpoint publik + admin
  web.php           Catch-all SPA (kiosk & /admin)
```

---

## Alur Data Donasi

Status donasi: `pending` → `verified` | `rejected`.

**Hanya donasi `verified` yang masuk total terkumpul dan tampil di kiosk.** Komitmen berstatus `pending` belum dihitung sampai amil menandainya *Sudah Donasi*.

| Sumber | Metode | Status awal |
|---|---|---|
| Impor QRIS (PDF) | `qris` | `verified` |
| Impor Excel | sesuai kolom | sesuai kolom |
| Input tunai manual | `cash` | `verified` |
| Input komitmen | `cash` + `is_commitment` | `pending` |

---

## Deployment

Panduan lengkap untuk cPanel ada di **[DEPLOYMENT.md](DEPLOYMENT.md)**.

---

## Lisensi

Perangkat lunak internal LAZ Al Azhar Peduli. Dibangun di atas [Laravel](https://laravel.com) (MIT).
