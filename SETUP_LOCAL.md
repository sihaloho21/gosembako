# Setup Lokal GoSembako

## Status Setup ✅

Repositori GoSembako telah berhasil di-clone dan dikonfigurasi untuk berjalan secara lokal.

## Informasi Proyek

- **Nama:** GoSembako - Platform E-commerce Paket Sembako
- **Tipe:** Web Frontend Statis (HTML/CSS/JavaScript)
- **Teknologi:** 
  - Frontend: HTML5, TailwindCSS, JavaScript Vanilla
  - Backend: Google Sheets + SheetDB/Google Apps Script
  - Deployment: Netlify

## Lokasi Proyek

```
/home/ubuntu/gosembako
```

## Struktur Direktori Utama

```
gosembako/
├── index.html              # Halaman utama toko
├── akun.html               # Halaman akun pengguna
├── referral.html           # Program referral
├── admin/                  # Panel admin
├── assets/
│   ├── css/                # Stylesheet (TailwindCSS, custom CSS)
│   ├── js/                 # JavaScript files
│   │   ├── config.js       # Konfigurasi API
│   │   ├── api-service.js  # Service untuk API calls
│   │   ├── script.js       # Main script
│   │   └── ...
│   ├── img/                # Gambar dan logo
│   └── images/             # Gambar produk
├── docs/                   # Dokumentasi
└── Paket Sembako.xlsx      # Data sample

```

## Fitur Utama

1. **E-commerce Platform** - Jual beli paket sembako
2. **Reward Points** - Sistem poin reward untuk pelanggan
3. **Referral Program** - Program referral dengan bonus
4. **Tiered Pricing** - Harga grosir bertingkat
5. **Admin Panel** - Manajemen produk dan pesanan
6. **Wishlist & Cart** - Daftar keinginan dan keranjang belanja

## Konfigurasi API

Aplikasi menggunakan SheetDB untuk backend:

- **Main API:** https://sheetdb.io/api/v1/epcjnpzmllvkb
- **Admin API:** https://sheetdb.io/api/v1/epcjnpzmllvkb

Konfigurasi dapat diubah melalui localStorage tanpa perlu edit kode.

## Menjalankan Aplikasi Secara Lokal

### Opsi 1: Menggunakan Python HTTP Server (Sudah Berjalan)

```bash
cd /home/ubuntu/gosembako
python3 -m http.server 8000
```

Akses aplikasi di: http://localhost:8000

### Opsi 2: Menggunakan Node.js HTTP Server

```bash
cd /home/ubuntu/gosembako
npx http-server -p 8000
```

### Opsi 3: Menggunakan Live Server (VSCode Extension)

Buka folder di VSCode dan gunakan Live Server extension untuk development dengan auto-refresh.

## Dokumentasi Penting

Repositori berisi dokumentasi lengkap untuk berbagai fitur:

- `REFERRAL_PROGRAM_COMPLETE_GUIDE.md` - Panduan program referral
- `implementation_guide.md` - Panduan implementasi fitur
- `DATABASE_SETUP_REFERRAL.md` - Setup database referral
- `REFERRAL_DEPLOYMENT_GUIDE.md` - Deploy guide
- `panduan_implementasi_fitur_katalog_paket_sembako.md` - Katalog produk
- `panduan_implementasi_fitur_harga_grosir_bertingkat_(tiered_pricing).md` - Tiered pricing

## File JavaScript Penting

| File | Fungsi |
|------|--------|
| `config.js` | Manajemen konfigurasi API dan settings |
| `api-service.js` | Service untuk API calls ke SheetDB |
| `script.js` | Main script untuk homepage |
| `akun.js` | Logic untuk halaman akun |
| `referral-helper.js` | Helper untuk program referral |
| `tiered-pricing-logic.js` | Logic untuk harga grosir bertingkat |
| `banner-carousel.js` | Carousel untuk banner promosi |

## Data Sample

Repositori menyertakan file CSV dan XLSX dengan data sample:

- `Paket Sembako - products.csv` - Data produk
- `Paket Sembako - users.csv` - Data pengguna
- `Paket Sembako - orders.csv` - Data pesanan
- `Paket Sembako - referrals.csv` - Data referral
- `Paket Sembako.xlsx` - Spreadsheet lengkap

## Langkah Selanjutnya

1. **Setup Google Sheets** - Hubungkan dengan SheetDB
2. **Konfigurasi API URL** - Update API URL di config.js jika diperlukan
3. **Test Fitur** - Jalankan aplikasi dan test semua fitur
4. **Deploy** - Deploy ke Netlify atau hosting lainnya

## Catatan Penting

- Aplikasi ini adalah frontend statis yang bergantung pada Google Sheets sebagai backend
- Semua data disimpan di Google Sheets dan diakses melalui SheetDB API
- Tidak ada database lokal yang perlu dikonfigurasi
- Aplikasi dapat dijalankan dari mana saja asalkan ada koneksi internet

## Troubleshooting

### Port 8000 Sudah Digunakan

```bash
# Gunakan port berbeda
python3 -m http.server 9000
```

### CORS Issues

Jika mengalami CORS issues saat development, pastikan:
1. API endpoint di config.js sudah benar
2. SheetDB API sudah dikonfigurasi dengan benar
3. Gunakan proxy atau CORS extension untuk testing

### Gambar Tidak Muncul

Pastikan path relatif di HTML sudah benar dan file gambar ada di folder `assets/img/` dan `assets/images/`

---

**Setup Selesai!** Aplikasi siap untuk dijalankan dan dikembangkan. 🎉
