# Analisis Kode Fitur Referral - GoSembako

## 1. Ringkasan Fitur

Fitur referral GoSembako memungkinkan pengguna untuk:
- **Mendapatkan kode referral unik** setelah mendaftar
- **Membagikan link referral** ke berbagai platform (WhatsApp, Facebook, Twitter)
- **Melacak statistik referral** (jumlah referral, pembelian selesai, poin yang didapat)
- **Mendapatkan poin reward** ketika referral berhasil melakukan pembelian pertama
- **Melihat riwayat perolehan poin**
- **Mendapatkan voucher** sebagai reward

## 2. File Terkait

| File | Fungsi Utama |
|---|---|
| `referral.html` | Halaman dashboard referral untuk pengguna |
| `assets/js/referral-helper.js` | Logika utama untuk semua fungsi referral |
| `assets/js/akun.js` | Integrasi referral di halaman akun (menampilkan kode, dll) |
| `assets/js/script.js` | Inisialisasi tracking referral saat landing |
| `REFERRAL_BACKEND_GAS.gs` | Kode Google Apps Script untuk backend referral |
| `Paket Sembako - referrals.csv` | Contoh data referral |

## 3. Alur Kerja Referral

### A. User Mengunjungi dengan Link Referral

1. **URL:** `https://gosembako.com/?ref=BUDI1234`
2. **`initializeReferralTracking()`** di `referral-helper.js` dipanggil saat halaman dimuat.
3. **`trackReferralFromUrl()`** mengambil kode `ref` dari URL.
4. Kode referral disimpan di `sessionStorage` dan `localStorage`.
5. **`showReferralWelcomeBanner()`** menampilkan banner selamat datang dengan info diskon.

### B. User Mendaftar

1. User mengisi form pendaftaran di `akun.html`.
2. Saat submit, **`getReferralCode()`** mengambil kode referral dari storage.
3. Kode referral dikirim bersama data pendaftaran ke backend (Google Sheets).

### C. User yang Direferensikan Melakukan Pembelian

1. Setelah pembayaran berhasil, **`processOrderReferralViaGAS()`** dipanggil.
2. Fungsi ini memanggil backend Google Apps Script (`callGASAPI`) dengan action `processReferral`.
3. **Backend GAS** akan:
   - Memvalidasi kode referral.
   - Mencatat referral sebagai "completed".
   - Memberikan poin reward kepada referrer.
   - Membuat voucher untuk pengguna baru.
4. Notifikasi sukses ditampilkan kepada pengguna.

### D. User Melihat Dashboard Referral

1. User membuka `referral.html`.
2. Script di halaman tersebut akan:
   - Memeriksa status login.
   - Mengambil data pengguna (termasuk kode referral) dari `localStorage`.
   - Memanggil **`getReferralStatsFromGAS()`** untuk mendapatkan statistik.
   - Memanggil **`getPointsHistoryFromGAS()`** untuk riwayat poin.
   - Menampilkan semua data di UI.

## 4. Analisis Kode `referral-helper.js`

### Fungsi Utama

- **`callGASAPI(action, data)`**: Fungsi sentral untuk berkomunikasi dengan backend Google Apps Script. Menggunakan `fetch` dengan metode `POST`.
- **`processOrderReferralViaGAS(...)`**: Mengorkestrasi proses referral setelah order selesai.
- **`generateReferralCode(name)`**: Membuat kode referral unik dari nama pengguna (4 huruf nama + 4 digit acak).
- **`trackReferralFromUrl()`**: Mekanisme tracking saat user datang dari link referral.
- **`getReferralLink(referralCode)`**: Membuat URL referral yang siap dibagikan.
- **`shareReferralVia...()`**: Fungsi untuk berbagi link ke WhatsApp, Facebook, dan Twitter.
- **`initializeReferralTracking()`**: Inisialisasi otomatis saat halaman dimuat.

### Kekuatan

- **Modular**: Logika referral terpusat di satu file (`referral-helper.js`), membuatnya mudah dikelola.
- **Backend Agnostic**: Meskipun saat ini menggunakan GAS, arsitektur `callGASAPI` memungkinkan penggantian backend dengan mudah.
- **User-Friendly**: Menyediakan fungsi share yang praktis dan notifikasi yang jelas.
- **Persisten**: Menggunakan `localStorage` untuk menyimpan kode referral, memastikan tracking tetap berjalan bahkan jika user menutup browser.

### Potensi Peningkatan

- **Error Handling**: Meskipun ada `try-catch`, penanganan error bisa lebih spesifik (misalnya, membedakan error jaringan dan error server).
- **Validasi Input**: Perlu ada validasi lebih ketat pada input yang dikirim ke GAS untuk mencegah injeksi atau data korup.
- **Security**: URL GAS diekspos di sisi klien. Sebaiknya disembunyikan atau menggunakan mekanisme otentikasi yang lebih kuat jika memungkinkan.
- **Kode Duplikasi**: Fungsi `showToastNotification` ada di beberapa file. Sebaiknya dijadikan modul global.

## 5. Analisis UI `referral.html`

### Komponen Utama

- **Dashboard Statistik**: Menampilkan jumlah referral, pembelian selesai, dan total poin.
- **Kode Referral & Tombol Share**: Area utama untuk menyalin dan membagikan link.
- **Tabulasi**: 
  - **Daftar Referral**: Menampilkan daftar orang yang berhasil direferensikan.
  - **Riwayat Poin**: Log perolehan poin dari referral.
  - **Voucher Saya**: Daftar voucher yang didapat.

### Kekuatan

- **Informatif**: Menyajikan semua informasi yang dibutuhkan pengguna dalam satu halaman.
- **Interaktif**: Tombol share dan copy link memudahkan pengguna.
- **Responsif**: Menggunakan TailwindCSS, sehingga tampilan optimal di berbagai perangkat.

### Potensi Peningkatan

- **Loading State**: Saat ini hanya menampilkan teks "Memuat...". Bisa diganti dengan skeleton loading yang lebih modern untuk UX yang lebih baik.
- **Paginasi**: Jika daftar referral atau riwayat poin sangat panjang, perlu ditambahkan paginasi.
- **Filter & Sort**: Menambahkan opsi untuk memfilter atau mengurutkan daftar referral akan sangat membantu.

## 6. Kesimpulan & Rekomendasi

Fitur referral di GoSembako sudah **dirancang dengan baik dan fungsional**. Logikanya terstruktur dan alur kerjanya jelas. Backend yang menggunakan Google Apps Script adalah solusi cerdas untuk aplikasi statis tanpa server tradisional.

**Rekomendasi:**

1. **Refaktor `callGASAPI`**: Tambahkan penanganan error yang lebih detail dan logging yang lebih informatif.
2. **Amankan URL GAS**: Pertimbangkan untuk memindahkan URL GAS ke environment variable jika menggunakan platform hosting yang mendukungnya (seperti Netlify).
3. **Tingkatkan UX di `referral.html`**: Implementasikan skeleton loading dan paginasi untuk data yang besar.
4. **Sentralisasi Fungsi Utilitas**: Buat file `utils.js` untuk fungsi-fungsi umum seperti `showToastNotification` untuk menghindari duplikasi.
