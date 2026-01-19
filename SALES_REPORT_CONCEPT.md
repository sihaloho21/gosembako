# Konsep Pengembangan: Laporan Penjualan Sederhana (Admin Only)

Dokumen ini merangkum rencana implementasi fitur **Laporan Penjualan** pada Dashboard Admin untuk membantu pemantauan performa bisnis secara real-time.

---

## 1. Tujuan Fitur
Memberikan gambaran data yang jelas kepada Admin mengenai:
- Berapa total pendapatan yang masuk.
- Produk apa yang paling diminati pelanggan.
- Tren penjualan harian/mingguan.

---

## 2. Sumber Data & Alur Kerja
Karena sistem saat ini menggunakan WhatsApp untuk pemesanan, alur data laporan akan dibagi menjadi dua opsi:

### Opsi A: Berdasarkan Klik "Pesan" (Estimasi)
Sistem mencatat setiap kali pelanggan mengklik tombol "Kirim Pesanan ke WhatsApp".
- **Kelebihan:** Otomatis, tidak perlu input tambahan.
- **Kekurangan:** Belum tentu semua klik berakhir dengan pembayaran (hanya estimasi).

### Opsi B: Konfirmasi Admin (Akurat)
Admin menambahkan tombol "Konfirmasi Selesai" pada daftar pesanan di dashboard setelah uang diterima.
- **Kelebihan:** Data sangat akurat (hanya transaksi yang benar-benar lunas).
- **Kekurangan:** Admin perlu melakukan satu klik tambahan.

---

## 3. Komponen Dashboard Laporan

### A. Ringkasan Angka (Stat Cards)
Menampilkan 3 kotak utama di bagian atas halaman laporan:
1. **Total Omzet:** Penjumlahan harga dari semua transaksi sukses.
2. **Total Transaksi:** Jumlah pesanan yang masuk.
3. **Rata-rata Pesanan:** Nilai rata-rata belanja per pelanggan.

### B. Produk Terlaris (Top 5 Best Sellers)
Tabel atau grafik batang sederhana yang menunjukkan produk mana yang paling banyak dipesan.
- **Kegunaan:** Membantu Admin memutuskan produk mana yang harus ditambah stoknya (restock).

### C. Grafik Tren Penjualan
Grafik garis sederhana yang menunjukkan naik-turunnya penjualan dalam 7 hari terakhir.
- **Kegunaan:** Melihat hari apa pelanggan paling aktif berbelanja (misal: saat hari gajian).

---

## 4. Detail Teknis Implementasi

### Penambahan Sheet Baru: `transaksi`
Kita akan menambahkan satu sheet baru di Google Sheets bernama `transaksi` dengan kolom:
- `id_transaksi`
- `tanggal`
- `nama_pelanggan`
- `total_bayar`
- `metode_bayar` (Cash / Bayar Gajian)
- `status` (Pending / Selesai)

### Library Visualisasi
Menggunakan **Chart.js** (ringan dan cepat) untuk menampilkan grafik di halaman Admin.

---

## 5. Tampilan UI (Mockup Deskripsi)
- **Warna Utama:** Hijau (sesuai tema GoSembako).
- **Layout:** Sidebar menu baru bernama "Laporan Penjualan" di bawah menu "Manajemen Produk".
- **Fitur Filter:** Admin bisa memilih rentang tanggal (Misal: Laporan Bulan Januari).

---

## 6. Manfaat Strategis
Dengan fitur ini, Admin tidak lagi menebak-nebak keuntungan, melainkan memiliki data nyata untuk:
1. Menentukan strategi diskon (Harga Coret) pada produk yang kurang laku.
2. Mengatur modal untuk stok produk yang paling cepat habis.
3. Mengevaluasi efektivitas promosi di WhatsApp.

---
**Status Konsep:** Draft Pengembangan  
**Tanggal:** 12 Januari 2026
