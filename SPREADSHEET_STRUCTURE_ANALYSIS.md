# 📊 Analisis Struktur Spreadsheet Paket Sembako

**Tanggal Analisis:** 23 Januari 2026  
**Total Sheet:** 11 sheet  
**Total Kolom:** 106+ kolom

---

## 📋 Daftar Sheet & Struktur Kolom

### 1. **categories** (Kategori Produk)
📂 File: `Paket Sembako - categories.csv`

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | Timestamp | ID unik kategori (ms) |
| `nama` | String | Nama kategori (Paket Tahun Baru, Paket Hemat, dll) |
| `deskripsi` | String | Penjelasan singkat kategori |

**Data:** 7 kategori aktif
- Paket Tahun Baru
- Paket Hemat
- Paket Lengkap
- Bahan Pokok
- Paket Tahun Baru 2
- Paket Hemat Minggu

---

### 2. **products** (Data Produk)
📂 File: `Paket Sembako - products.csv`

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | Timestamp | ID unik produk |
| `nama` | String | Nama produk |
| `harga` | Number | Harga jual (Rp) |
| `harga_coret` | Number | Harga asli/coret (untuk diskon) |
| `gambar` | URL String | URL gambar produk (bisa multiple, dipisah koma) |
| `stok` | Integer | Jumlah stok tersedia |
| `kategori` | String | Kategori produk |
| `deskripsi` | String | Deskripsi produk (multi-line) |
| `variasi` | JSON Array | Varian produk (sku, nama, harga, stok, gambar) |
| `grosir` | JSON Object | Informasi harga grosir bertingkat |

**Data:** 25 produk aktif  
**Contoh Produk:**
- Minyak Kita 1L & 2L (Rp 19.000)
- Gula Pasir Curah (Rp 5.000 - Rp 17.500)
- Beras Slyp Super Cap Ketupat (Rp 12.000)

**Catatan:** 
- Kolom `gambar` dapat berisi URL tunggal atau multiple URLs dipisah koma
- Kolom `variasi` menyimpan data JSON dengan struktur varian produk
- Kolom `grosir` untuk harga grosir bertingkat

---

### 3. **users** (Data Pengguna/Pelanggan)
📂 File: `Paket Sembako - users.csv`

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | String | ID user (format: USR-XXXXXX) |
| `nama` | String | Nama lengkap pengguna |
| `whatsapp` | Number | Nomor WhatsApp tanpa kode negara |
| `pin` | Number | PIN login pengguna |
| `referral_code` | String | Kode referral unik pengguna |
| `referrer_id` | String | ID pengguna yang mereferensikan |
| `total_points` | Number | Total poin reward pengguna |
| `status` | String | Status akun (aktif, nonaktif, dll) |
| `created_at` | DateTime | Waktu pembuatan akun |
| `tanggal_daftar` | Date | Tanggal pendaftaran (YYYY-MM-DD) |

**Data:** 3 pengguna terdaftar  
**Contoh User:**
- USR-300718: RIDO ALPREDO SIHALOHO (08993370200)
- USR-804929: Riama Br Tumorang (812372124822)
- USR-531155: Sihaloho (852123456789)

**Status:** Semua aktif  
**Poin:** Rata-rata 0 poin (belum ada transaksi)

---

### 4. **orders** (Data Pesanan)
📂 File: `Paket Sembako - orders (1).csv`

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | String | ID pesanan (format: ORD-XXXXXX) |
| `pelanggan` | String | Nama pelanggan |
| `phone` | Number | Nomor WhatsApp pelanggan |
| `produk` | String | Nama produk & varian (qty) |
| `qty` | Integer | Jumlah unit |
| `total` | Number | Total harga (Rp) |
| `poin` | Number | Poin yang diperoleh |
| `status` | String | Status pesanan (Terima, Diproses, Dikirim) |
| `point_processed` | String | Apakah poin sudah diproses (Yes/No) |
| `tanggal` | DateTime | Waktu pemesanan |

**Data:** 3 pesanan  
**Status Pesanan:**
- Terima: 1
- Diproses: 1
- Dikirim: 1

**Contoh Order:**
- ORD-035668: Beras (1x) = Rp 405.200 → 40 poin ✓
- ORD-472154: Indomie Kari Ayam (1x) = Rp 5.920 → 0 poin ✓

---

### 5. **settings** (Pengaturan Sistem)
📂 File: `Paket Sembako - settings.csv`

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `key` | String | Nama kunci pengaturan |
| `value` | String | Nilai pengaturan |

**Data:** 2 setting konfigurasi

| Key | Value | Keterangan |
|-----|-------|-----------|
| `main_api_url` | https://sheetdb.io/api/v1/ff8zi9lbwbk77 | URL API SheetDB |
| `admin_api_url` | https://sheetdb.io/api/v1/ff8zi9lbwbk77 | URL API Admin |

**Fungsi:** Menyimpan konfigurasi dinamis API dan sistem

---

### 6. **claims** (Klaim Reward Poin)
📂 File: `Paket Sembako - claims.csv`

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | String | ID klaim (format: CLM-XXXXXX) |
| `phone` | Number | Nomor WhatsApp pengguna |
| `nama` | String | Nama pengguna |
| `hadiah` | String | Nama hadiah yang diklaim |
| `poin` | Number | Jumlah poin untuk hadiah |
| `status` | String | Status klaim (Menunggu, Diklaim, dll) |
| `tanggal` | DateTime | Waktu klaim |

**Data:** 2 klaim

| ID | Hadiah | Poin | Status |
|----|--------|------|--------|
| CLM-307103 | Kecap Bango 50ml | 10 | Menunggu |
| CLM-835519 | Kecap Bango 50ml | 5 | Menunggu |

**Catatan:** Semua klaim masih dalam status "Menunggu"

---

### 7. **referrals** (Data Program Referral)
📂 File: `Paket Sembako - referrals.csv`

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | String | ID referral |
| `referrer_phone` | Number | Nomor WhatsApp yang mereferensikan |
| `referrer_code` | String | Kode referral pemberi |
| `referred_phone` | Number | Nomor WhatsApp yang dirujuk |
| `referred_name` | String | Nama yang dirujuk |
| `status` | String | Status referral |
| `first_order_id` | String | ID pesanan pertama |
| `created_at` | DateTime | Waktu pembuatan referral |
| `completed_at` | DateTime | Waktu penyelesaian referral |

**Data:** Kosong (tidak ada data referral)

**Catatan:** Sheet ini belum memiliki data, hanya header

---

### 8. **points_history** (Riwayat Poin)
📂 File: `Paket Sembako - points_history.csv`

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | String | ID transaksi poin |
| `user_phone` | Number | Nomor WhatsApp pengguna |
| `referral_code` | String | Kode referral pengguna |
| `transaction_date` | Date | Tanggal transaksi |
| `type` | String | Tipe transaksi (earn/redeem) |
| `amount` | Number | Jumlah poin |
| `balance_before` | Number | Saldo poin sebelum |
| `balance_after` | Number | Saldo poin sesudah |
| `description` | String | Deskripsi transaksi |
| `source_id` | String | ID sumber (order ID, referral ID) |
| `created_at` | DateTime | Waktu pencatatan |

**Data:** Kosong (tidak ada riwayat poin)

**Catatan:** Header sudah disiapkan, menunggu data transaksi

---

### 9. **user_points** (Poin Pengguna - Real-time)
📂 File: `Paket Sembako - user_points.csv`

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `phone` | Number | Nomor WhatsApp pengguna |
| `points` | Number | Total poin saat ini |
| `last_updated` | DateTime | Waktu update terakhir |

**Data:** 2 pengguna dengan poin

| Phone | Poin | Update Terakhir |
|-------|------|-----------------|
| 08993370200 | 39,00 | 22/1/2026, 20:00:33 |
| 089933111111111 | 40,00 | 21/1/2026, 09:32:41 |

**Fungsi:** Tracking poin real-time per pengguna

---

### 10. **tukar_poin** (Hadiah Tukar Poin)
📂 File: `Paket Sembako - tukar_poin.csv`

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | Timestamp | ID unik hadiah |
| `nama` | String | Nama hadiah |
| `poin` | Number | Jumlah poin untuk menukar |
| `gambar` | URL String | URL gambar hadiah |
| `deskripsi` | String | Deskripsi hadiah |

**Data:** 2 hadiah tersedia

| Hadiah | Poin | Deskripsi |
|--------|------|-----------|
| Kecap Bango 50ml | 5 | Kecap Bango 50ml kemasan |
| Mama Lemon | 10 | Mama Lemon 660 Gram |

**Catatan:** Hadiah dapat ditukar dengan poin reward pelanggan

---

### 11. **vouchers** (Voucher/Kode Diskon)
📂 File: `Paket Sembako - vouchers.csv`

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `voucher_code` | String | Kode voucher unik |
| `type` | String | Tipe voucher (referral, promo, dll) |
| `discount_amount` | Number | Jumlah diskon |
| `referrer_phone` | Number | Nomor pemberi referral |
| `referred_phone` | Number | Nomor penerima referral |
| `status` | String | Status voucher (aktif, digunakan, kadaluarsa) |
| `created_at` | DateTime | Waktu pembuatan |
| `expiry_date` | Date | Tanggal kadaluarsa |
| `used_at` | DateTime | Waktu penggunaan |
| `order_id` | String | ID pesanan yang menggunakan voucher |
| `generated_by` | String | Siapa yang membuat voucher |
| `notes` | String | Catatan tambahan |

**Data:** Kosong (tidak ada voucher)

**Catatan:** Sheet siap untuk program voucher dan referral

---

## 📊 Statistik & Ringkasan

| Metrik | Jumlah |
|--------|--------|
| **Total Sheet** | 11 |
| **Total Kolom** | 106+ |
| **Produk Aktif** | 25 |
| **Kategori** | 7 |
| **Pengguna Terdaftar** | 3 |
| **Pesanan** | 3 |
| **Hadiah Tukar Poin** | 2 |
| **Klaim Menunggu** | 2 |
| **Referral Data** | 0 (kosong) |
| **Riwayat Poin** | 0 (kosong) |
| **Voucher** | 0 (kosong) |

---

## 🔗 Hubungan Data (Relasi)

```
┌─────────────────────────────────────────────┐
│         USERS (Pengguna)                     │
│  id, nama, phone, referral_code             │
└─────────┬──────────────────────────┬────────┘
          │                          │
          ├──> ORDERS               │
          │    (Pemesanan)          │
          │    └─> POINTS           │
          │        (Poin diperoleh) │
          │                         │
          └──> CLAIMS              │
               (Klaim hadiah)      │
                                  │
          ┌──────────────────────┘
          │
          ├──> REFERRALS (Program referral)
          │    ├─> User yang dirujuk
          │    └─> Bonus poin
          │
          └──> POINTS_HISTORY (Riwayat poin)

PRODUCTS (Produk)
├─> CATEGORIES (Kategori)
├─> VARIASI (Varian produk)
├─> TUKAR_POIN (Hadiah dari poin)
└─> ORDERS (Pesanan)

VOUCHERS (Voucher)
├─> REFERRALS (Dari program referral)
└─> ORDERS (Digunakan saat pesan)

SETTINGS (Konfigurasi sistem)
└─> API URLs, pengaturan global
```

---

## ⚙️ Integrasi Sistem

### API Endpoints (dari settings)
- **Main API:** `https://sheetdb.io/api/v1/ff8zi9lbwbk77`
- **Admin API:** `https://sheetdb.io/api/v1/ff8zi9lbwbk77`

### Data Flow
```
Frontend (HTML/JS)
    ↓
API Service (api-service.js)
    ↓
SheetDB API
    ↓
Google Sheets (Backend)
    ↓
11 Sheet Database
```

---

## 📝 Catatan Penting

### ✅ Siap Digunakan
- [x] Categories (Kategori produk)
- [x] Products (Data produk)
- [x] Users (Pengguna)
- [x] Orders (Pesanan)
- [x] Settings (Konfigurasi)
- [x] User Points (Tracking poin)
- [x] Tukar Poin (Hadiah)
- [x] Claims (Klaim hadiah)

### ⏳ Perlu Pengembangan
- [ ] Referrals (Kosong - perlu data)
- [ ] Points History (Kosong - tracking belum aktif)
- [ ] Vouchers (Kosong - belum ada program)

### 🔧 Field Khusus yang Perlu Perhatian
1. **variasi** (products) → JSON Format
2. **grosir** (products) → Harga bertingkat
3. **gambar** (products) → Multiple URLs
4. **points** → Format angka dengan koma (Indonesia)
5. **phone** → Format tanpa kode negara atau dengan 0/62

---

## 📌 Rekomendasi

1. **Normalisasi Phone Numbers** - Standardisasi format nomor (8993370200 vs 628993370200 vs +628993370200)
2. **Validasi JSON** - Struktur `variasi` dan `grosir` harus valid JSON
3. **Image URLs** - Pastikan semua URL gambar accessible
4. **Backup Regular** - Backup spreadsheet secara berkala
5. **Audit Trail** - Mulai catat perubahan di `points_history`
6. **Program Referral** - Aktifkan tracking referral di sheet `referrals`

---

**Generated:** 23 Januari 2026  
**Status:** ✅ Lengkap & Terstruktur
