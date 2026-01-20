# Panduan Implementasi Program Referral - Paket Sembako

**Tanggal:** 20 Januari 2026  
**Status:** ✅ Implemented  
**Versi:** 1.0 MVP

---

## 📋 Ringkasan

Program referral "Give 10, Get 10" telah berhasil diimplementasikan menggunakan SheetDB API. Program ini memungkinkan pelanggan untuk mengajak teman dan mendapatkan reward poin.

**Konsep:**
- **Teman yang diajak:** Mendapat diskon 10% untuk pesanan pertama
- **Yang mengajak:** Mendapat 10.000 poin setelah teman menyelesaikan pesanan pertama

---

## 🗂️ File-file yang Dibuat/Dimodifikasi

### File Baru:

1. **`DATABASE_SETUP_REFERRAL.md`**
   - Panduan setup database di Google Sheets
   - Struktur 3 sheet baru: `users`, `referrals`, `orders`

2. **`assets/js/referral-handler.js`**
   - Menangani tracking kode referral dari URL (?ref=CODE)
   - Menyimpan kode referral di localStorage
   - Menampilkan welcome banner untuk pengunjung dari referral link

3. **`assets/css/referral-style.css`**
   - Styling untuk welcome banner
   - Styling untuk dashboard referral
   - Responsive design untuk mobile

4. **`referral.html`**
   - Halaman dashboard referral
   - Form registrasi dan login
   - Statistik referral dan riwayat

5. **`assets/js/referral-dashboard.js`**
   - Logic untuk dashboard referral
   - Registrasi dan login user
   - Menampilkan statistik dan riwayat referral
   - Share link ke WhatsApp, Facebook, Twitter

6. **`assets/js/referral-order-integration.js`**
   - Integrasi dengan sistem order existing
   - Auto-create user saat order pertama
   - Auto-reward poin ke referrer saat teman order pertama

### File yang Dimodifikasi:

1. **`index.html`**
   - Tambah link CSS: `referral-style.css`
   - Tambah script: `referral-handler.js` dan `referral-order-integration.js`
   - Tambah button "Program Referral" di header (icon purple)

2. **`assets/js/script.js`**
   - Tambah integrasi `referralOrderIntegration.processOrder()` di fungsi checkout
   - Auto-process referral reward setelah order berhasil

---

## 🔧 Setup Database (WAJIB!)

Sebelum sistem bisa berjalan, Anda **HARUS** setup database terlebih dahulu:

### Langkah 1: Buka Google Sheets

Buka spreadsheet Anda:
```
https://docs.google.com/spreadsheets/d/174qAwA2hddfQOFUFDx7czOtpRlD9WUiiIaf6Yao8WRc/edit
```

### Langkah 2: Buat 2 Sheet Baru

#### Sheet 1: `users`

Buat sheet baru dengan nama **`users`** (huruf kecil), lalu di baris pertama isi header:

```
id | user_id | name | whatsapp_no | referral_code | referrer_code | total_points | created_at
```

#### Sheet 2: `referrals`

Buat sheet baru dengan nama **`referrals`** (huruf kecil), lalu di baris pertama isi header:

```
id | referral_id | referrer_code | referred_user_id | referred_name | status | reward_points | created_at | completed_at
```

#### Sheet 3: `orders` (Sudah Ada)

**✅ TIDAK PERLU DIBUAT BARU!**

Sheet `orders` sudah ada di spreadsheet Anda dengan struktur existing:
```
id | pelanggan | produk | qty | total | status | tanggal | phone | poin | point_processed
```

Sistem referral akan menggunakan kolom `phone` untuk identifikasi user dan validasi first order.

### Langkah 3: Test Akses SheetDB

Buka browser dan test:

```
https://sheetdb.io/api/v1/f1ioa83a268s8?sheet=users
```

Jika berhasil, akan return `[]` (array kosong) atau data yang ada.

**⚠️ PENTING:** Jika error 404, pastikan nama sheet persis `users`, `referrals`, `orders` (huruf kecil semua).

---

## 🚀 Cara Kerja Sistem

### 1. User Mengunjungi dengan Referral Link

**URL:** `https://paketsembako.com/?ref=BUDI78A1`

**Proses:**
1. `referral-handler.js` mendeteksi parameter `?ref=` di URL
2. Kode referral `BUDI78A1` disimpan di localStorage
3. Welcome banner muncul: "🎁 Selamat Datang! Dapatkan diskon 10%..."
4. URL dibersihkan (parameter `?ref=` dihapus) agar tidak terlihat

### 2. User Melakukan Order Pertama

**Proses:**
1. User mengisi form checkout dan klik "Kirim ke WhatsApp"
2. Sistem mencatat order ke sheet `orders` (existing flow)
3. **Referral Integration:**
   - `referral-order-integration.js` otomatis dipanggil
   - Cek apakah user sudah ada di sheet `users` (berdasarkan nomor WhatsApp)
   - Jika belum, buat user baru dengan kode referral unik
   - Jika user punya `referrer_code`, buat record di sheet `referrals` dengan status `pending`

### 3. Setelah Order Pertama Selesai

**Proses Otomatis:**
1. Sistem cek: Apakah ini order pertama user? (hitung jumlah order di sheet `orders`)
2. Jika YA dan user punya referrer:
   - Update status referral menjadi `completed`
   - Tambah 10.000 poin ke `total_points` si referrer di sheet `users`
   - Tampilkan notifikasi: "🎉 Selamat! Anda mendapat 10.000 poin dari referral!"

### 4. User Melihat Dashboard Referral

**URL:** `https://paketsembako.com/referral.html`

**Fitur:**
- **Registrasi/Login:** User bisa daftar dengan nama + nomor WhatsApp
- **Referral Link:** Setiap user punya link unik (contoh: `?ref=BUDI78A1`)
- **Statistik:**
  - Total teman diajak
  - Referral berhasil (yang sudah order)
  - Total poin yang dimiliki
- **Riwayat:** Tabel daftar teman yang sudah diajak dengan status
- **Share Buttons:** Tombol untuk share ke WhatsApp, Facebook, Twitter

---

## 🎯 Flow Diagram

```
┌─────────────────┐
│ User A (Rido)   │
│ Punya ref code: │
│ RIDO21A2        │
└────────┬────────┘
         │
         │ 1. Share link
         │    paketsembako.com/?ref=RIDO21A2
         ▼
┌─────────────────┐
│ User B (Budi)   │
│ Klik link       │
└────────┬────────┘
         │
         │ 2. Kode RIDO21A2 disimpan
         │    di localStorage
         ▼
┌─────────────────┐
│ Budi Order      │
│ Pertama Kali    │
└────────┬────────┘
         │
         │ 3. Sistem auto-create user Budi
         │    dengan referrer_code: RIDO21A2
         │    Status referral: pending
         ▼
┌─────────────────┐
│ Order Selesai   │
│ (Budi bayar)    │
└────────┬────────┘
         │
         │ 4. Sistem cek: first order? YES
         │    Sistem update:
         │    - Referral status: completed
         │    - Rido dapat +10.000 poin
         ▼
┌─────────────────┐
│ Rido Dapat      │
│ Notifikasi:     │
│ +10.000 Poin! 🎉│
└─────────────────┘
```

---

## 🧪 Testing Checklist

### Test 1: Referral Link Tracking

1. Buka: `https://paketsembako.com/?ref=TEST001`
2. ✅ Welcome banner muncul
3. ✅ URL berubah jadi `https://paketsembako.com/` (tanpa ?ref=)
4. ✅ Buka Console → cek localStorage → ada `sembako_referral_code: TEST001`

### Test 2: User Registration

1. Buka: `https://paketsembako.com/referral.html`
2. Klik "Daftar Sekarang"
3. Isi nama: "Test User" dan WhatsApp: "6281234567890"
4. Klik "Daftar Sekarang"
5. ✅ Dashboard muncul dengan referral link unik
6. ✅ Cek Google Sheets → sheet `users` → ada data baru

### Test 3: Referral Link Sharing

1. Di dashboard, salin referral link
2. Buka link di incognito/private window
3. ✅ Welcome banner muncul dengan nama referrer

### Test 4: First Order & Reward

1. User baru (dari referral link) melakukan order
2. Isi form checkout dengan nomor WhatsApp baru
3. Klik "Kirim ke WhatsApp"
4. ✅ Cek sheet `users` → user baru terbuat
5. ✅ Cek sheet `referrals` → ada record dengan status `pending`
6. ✅ Setelah order, status berubah `completed`
7. ✅ Referrer dapat +10.000 poin di sheet `users`

### Test 5: Dashboard Statistics

1. Login ke dashboard referral
2. ✅ Statistik menampilkan jumlah referral yang benar
3. ✅ Riwayat menampilkan daftar teman yang diajak
4. ✅ Total poin sesuai dengan yang di database

---

## ⚠️ Troubleshooting

### Problem: Welcome banner tidak muncul

**Solusi:**
- Pastikan file `referral-handler.js` sudah di-load di `index.html`
- Pastikan file `referral-style.css` sudah di-load
- Cek Console untuk error JavaScript

### Problem: Dashboard kosong / error

**Solusi:**
- Pastikan sheet `users`, `referrals`, `orders` sudah dibuat di Google Sheets
- Test akses SheetDB: `https://sheetdb.io/api/v1/f1ioa83a268s8?sheet=users`
- Cek Console untuk error API

### Problem: Reward tidak otomatis diberikan

**Solusi:**
- Pastikan `referral-order-integration.js` sudah di-load di `index.html`
- Pastikan integrasi di `script.js` sudah benar (cek line ~1307)
- Cek Console untuk error saat checkout
- Cek sheet `referrals` → apakah status berubah dari `pending` ke `completed`?

### Problem: SheetDB error 404

**Solusi:**
- Pastikan nama sheet persis: `users`, `referrals`, `orders` (huruf kecil semua)
- Refresh SheetDB cache: tambahkan `?_t=timestamp` di URL

---

## 📊 Monitoring & Maintenance

### Daily Check:

1. **Cek sheet `referrals`:**
   - Berapa referral baru hari ini?
   - Berapa yang sudah `completed`?

2. **Cek sheet `users`:**
   - Berapa user baru yang daftar?
   - Siapa yang punya poin terbanyak?

3. **Cek anomali:**
   - Ada user dengan poin sangat tinggi? (kemungkinan fraud)
   - Ada referral yang stuck di `pending` lama? (cek manual)

### Weekly Report:

- Total referral baru minggu ini: ___
- Total poin diberikan: ___
- Top 5 referrer: ___
- Conversion rate (pending → completed): ___

---

## 🔮 Future Enhancements

Fitur yang bisa ditambahkan nanti (setelah MVP terbukti berhasil):

1. **Penukaran Poin:**
   - User bisa tukar poin dengan voucher diskon
   - Sheet baru: `vouchers`

2. **Tier System:**
   - Bronze: 1-5 referral berhasil
   - Silver: 6-15 referral berhasil
   - Gold: 16+ referral berhasil
   - Benefit: Bonus poin per tier

3. **Leaderboard:**
   - Top 10 referrer bulan ini
   - Hadiah untuk juara 1-3

4. **Email Notifications:**
   - Kirim email saat dapat poin
   - Reminder untuk inactive referrers

5. **Analytics Dashboard (Admin):**
   - Chart pertumbuhan referral
   - Conversion funnel
   - ROI calculation

---

## 📞 Support

Jika ada pertanyaan atau masalah:

1. Cek file `DATABASE_SETUP_REFERRAL.md` untuk panduan database
2. Cek file `REFERRAL_ANALYSIS_GAS_VS_SHEETDB.md` untuk penjelasan teknis
3. Cek Console browser untuk error messages
4. Review kode di file `referral-*.js` untuk debugging

---

## ✅ Checklist Deployment

Sebelum go-live, pastikan:

- [ ] Database setup selesai (3 sheet baru di Google Sheets)
- [ ] Test akses SheetDB berhasil
- [ ] Test referral link tracking berhasil
- [ ] Test user registration berhasil
- [ ] Test first order & reward berhasil
- [ ] Test dashboard statistics berhasil
- [ ] Mobile responsive sudah dicek
- [ ] Commit & push ke GitHub
- [ ] Deploy ke Netlify
- [ ] Test di production URL

---

**Implementasi by Manus AI**  
**Tanggal: 20 Januari 2026**  
**Status: Ready for Testing & Deployment** ✅
