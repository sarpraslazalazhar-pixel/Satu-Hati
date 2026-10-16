# Panduan Deploy ke cPanel

Panduan langkah demi langkah menaruh aplikasi ini di hosting cPanel (shared hosting).

---

## 1. Prasyarat

Cek di **cPanel → Select PHP Version** (atau **MultiPHP Manager**):

- PHP **8.3** atau lebih baru — wajib.
- Ekstensi aktif: `zip`, `xml`, `simplexml`, `mbstring`, `openssl`, `pdo`, `pdo_sqlite` (atau `pdo_mysql`), `fileinfo`, `curl`, `tokenizer`.

Cara cek dari SSH:

```bash
php -v
php -m | grep -E "zip|xml|simplexml|mbstring|openssl|pdo|fileinfo|curl|tokenizer"
```

**Jika `zip` tidak aktif, impor/ekspor Excel tidak akan jalan.** Aktifkan dulu di Select PHP Version.

---

## 2. Dapatkan Kode

Ada dua cara. Pilih salah satu.

### Cara A — Git Version Control (paling rapi)

**cPanel → Git™ Version Control → Create**

| Field | Nilai |
|---|---|
| Clone URL | `https://github.com/sarpraslazalazhar-pixel/Satu-Hati.git` |
| Repository Path | `/home/USERNAME/satuhati` |
| Repository Name | `satuhati` |

Klik **Create**. Setelah selesai, buka **Manage → Pull or Deploy → Update from Remote**.

### Cara B — Upload ZIP

1. Download ZIP repo dari GitHub.
2. **cPanel → File Manager** → buat folder `/home/USERNAME/satuhati`.
3. Upload ZIP ke folder itu, lalu **Extract**.

---

## 3. Install Dependency (Composer)

Aplikasi butuh folder `vendor/`. Ada dua opsi.

### Opsi 1 — Composer tersedia di cPanel

**cPanel → Terminal** (atau SSH):

```bash
cd ~/satuhati
composer install --no-dev --optimize-autoloader
```

### Opsi 2 — Hosting tanpa Composer

Build `vendor/` di komputer lokal, lalu upload:

```bash
# di komputer lokal
composer install --no-dev --optimize-autoloader
```

Lalu upload folder `vendor/` dan `composer.lock` ke `/home/USERNAME/satuhati/` via File Manager (upload sebagai ZIP lalu extract — jauh lebih cepat daripada upload ribuan file).

**Aset frontend sudah ikut di repo** (`public/build/`), jadi `npm` **tidak** diperlukan di server. Bila ingin build ulang, jalankan `npm install && npm run build` secara lokal lalu upload ulang `public/build/`.

---

## 4. Susun Direktori Publik

cPanel menyajikan dari `public_html`. Document root Laravel harus menunjuk ke `satuhati/public`.

### Opsi A — Document root langsung (paling bersih)

**cPanel → Domains → (domain Anda) → Manage → Document Root**

Ubah menjadi:

```
/home/USERNAME/satuhati/public
```

### Opsi B — Pindahkan isi `public/` (bila document root tidak bisa diubah)

```bash
cd ~/satuhati
cp -R public/* ~/public_html/
cp public/.htaccess ~/public_html/
mv ~/public_html/index.php ~/public_html/index.php.orig
```

Edit `~/public_html/index.php`, ganti dua baris `require`:

```php
// SEBELUM
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';

// SESUDAH
require __DIR__.'/../satuhati/vendor/autoload.php';
$app = require_once __DIR__.'/../satuhati/bootstrap/app.php';
```

Lalu edit `~/public_html/.htaccess`, tambahkan di paling atas:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
```

> Opsi A lebih disarankan. Opsi B menyebar file ke dua tempat dan mudah salah saat update.

---

## 5. Buat Database

**cPanel → MySQL® Databases** (atau PostgreSQL):

1. Buat database, mis. `user_satuhati`.
2. Buat user database + password kuat.
3. Tambahkan user ke database dengan **ALL PRIVILEGES**.

Catat: nama DB, user, password. (Kalau memilih SQLite, lewati langkah ini — file `database/database.sqlite` sudah ada di repo.)

---

## 6. Konfigurasi `.env`

Buat file `.env` di `/home/USERNAME/satuhati/` (salin dari `.env.example`, jangan upload `.env` lokal).

**cPanel → File Manager** → masuk `satuhati` → aktifkan *Show Hidden Files* → klik kanan `.env.example` → **Copy** → nama baru `.env`.

Edit isinya:

```dotenv
APP_NAME="Zecrus 11th"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://domain-anda.com

APP_LOCALE=id
APP_TIMEZONE=Asia/Jakarta

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=user_satuhati
DB_USERNAME=user_satuhati
DB_PASSWORD=PASSWORD_DB_ANDA

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_PATH=/
SESSION_DOMAIN=null
SESSION_SECURE_COOKIE=true

BROADCAST_CONNECTION=log
```

Lalu generate application key:

```bash
cd ~/satuhati
php artisan key:generate --force
```

> **Penting:** `SESSION_PATH` wajib `/`. Jangan isi dengan path filesystem.

---

## 7. Migrasi & Akun Amil

```bash
cd ~/satuhati
php artisan migrate --force
php artisan db:seed --force
```

Akun default yang dibuat:

| Email | Password |
|---|---|
| `amil@lazalazhar.org` | `admin123` |
| `admin@zecrus.com` | `admin123` |

**Ganti password segera** (lihat langkah 10).

---

## 8. Izin Folder

```bash
cd ~/satuhati
chmod -R 775 storage bootstrap/cache
```

Folder `storage/app` dan `public/uploads/slides` **wajib bisa ditulis** — dipakai menyimpan file sementara Excel dan foto kegiatan.

```bash
chmod -R 775 public/uploads
```

---

## 9. Optimasi Produksi

```bash
cd ~/satuhati
php artisan optimize
php artisan storage:link
```

Kalau selesai update kode dan ingin membersihkan cache:

```bash
php artisan optimize:clear
```

---

## 10. Ganti Password Amil

Lewat Tinker:

```bash
cd ~/satuhati
php artisan tinker
```

```php
App\Models\User::where('email', 'amil@lazalazhar.org')
    ->update(['password' => bcrypt('PasswordBaruYangKuat'));
```

Atau lewat **cPanel → phpMyAdmin**, edit tabel `users`, isi kolom `password` dengan hash bcrypt yang dihasilkan dari:

```bash
php artisan tinker --execute "echo bcrypt('PasswordBaruYangKuat');"
```

---

## 11. Verifikasi

1. Buka `https://domain-anda.com/` → kiosk harus tampil (total donasi, daftar donatur, QRIS, slideshow).
2. Buka `https://domain-anda.com/admin` → panel amil tampil tanpa error.
3. Klik **Input Cash / Komitmen**, isi nominal `1.000.000` → tersimpan.
4. Klik **Ekspor Excel** → file `.xlsx` terunduh dan bisa dibuka di Excel.
5. Klik **Impor Excel** → unggah file hasil ekspor tadi → muncul di pratinjau.
6. Cek `storage/logs/laravel.log` bila ada yang gagal.

---

## Real-time (Opsional)

Tanpa WebSocket, kiosk tetap akurat — `DonationContext` melakukan polling tiap 3 detik. Untuk update instan (confetti & angka naik seketika), aktifkan Laravel Reverb di VPS, atau pakai Pusher:

```dotenv
BROADCAST_CONNECTION=pusher
PUSHER_APP_ID=xxxx
PUSHER_APP_KEY=xxxx
PUSHER_APP_SECRET=xxxx
PUSHER_APP_CLUSTER=ap1
```

Setelah mengubah `.env`:

```bash
php artisan config:clear
php artisan optimize
```

cPanel shared hosting **tidak bisa** menjalankan Reverb (butuh proses long-running). Pakai Pusher bila butuh real-time penuh.

---

## Update Aplikasi

```bash
cd ~/satuhati
git pull origin main
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan optimize
```

Lewat cPanel Git™ Version Control: **Manage → Pull or Deploy → Update from Remote**.

---

## Troubleshooting

| Gejala | Sebab & solusi |
|---|---|
| Halaman 500, log kosong | `APP_DEBUG=false` menyembunyikan pesan. Set sementara `true`, muat ulang, baca pesannya, lalu kembalikan ke `false`. |
| `The cookie path "..." contains invalid characters` | `SESSION_PATH` salah. Set ke `/` di `.env`, lalu `php artisan config:clear`. |
| Halaman putih / aset 404 | `public/build/` belum ter-upload, atau document root salah. |
| `Class "ZipArchive" not found` | Ekstensi `zip` mati. Aktifkan di **cPanel → Select PHP Version**. |
| Impor/ekspor Excel gagal | Cek `zip` aktif, dan `storage/app` bisa ditulis (`chmod -R 775 storage`). |
| Upload slide gagal | `public/uploads/slides` harus writable (`chmod -R 775 public/uploads`). |
| `Vite manifest not found` | `public/build/manifest.json` hilang. Jalankan `npm run build` lokal, upload `public/build/`. |
| Total donasi tidak update di kiosk | Cek `/api/donations` bisa diakses. Tanpa WebSocket, tunggu maksimal 3 detik. |
| CSS/JS basi setelah update | `php artisan optimize:clear`, lalu hard refresh browser (Ctrl+Shift+R). |

---

## Catatan Keamanan

- **`APP_DEBUG=false`** di produksi. Jangan pernah `true` saat live.
- **`.env` tidak boleh masuk git** — sudah ada di `.gitignore`.
- **Ganti password akun amil default** sebelum acara.
- Panel `/admin` saat ini terbuka tanpa login (dirancang untuk device internal venue). Tambahkan middleware auth di `routes/api.php` pada grup `admin` bila host ini publik.
