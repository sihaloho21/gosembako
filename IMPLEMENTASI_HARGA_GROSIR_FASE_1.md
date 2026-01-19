# Implementasi Harga Grosir Bertingkat - Fase 1

**Status:** Selesai (Analisis, Google Sheets Preparation, Admin UI Development)

**Tanggal:** 12 Januari 2026

---

## 1. Ringkasan Fase 1

Fase 1 telah berhasil menyelesaikan tiga langkah implementasi:

1. ✅ **Analisis & Persiapan**: Memahami struktur kode yang ada
2. ✅ **Modifikasi Google Sheets**: Persiapan untuk menambahkan kolom `grosir`
3. ✅ **Pengembangan UI Admin**: Membuat komponen admin untuk mengelola harga grosir

---

## 2. Persiapan Google Sheets

### 2.1 Kolom yang Perlu Ditambahkan

Anda perlu menambahkan satu kolom baru ke Google Sheet Anda (Sheet1):

| Nama Kolom | Tipe Data | Deskripsi | Contoh |
|-----------|-----------|-----------|---------|
| `grosir` | Text/String | Data harga grosir dalam format JSON | `[{"min_qty": 5, "price": 3400}, {"min_qty": 10, "price": 3300}]` |

### 2.2 Langkah-Langkah Menambahkan Kolom

1. Buka Google Sheet Anda: https://docs.google.com/spreadsheets/d/174qAwA2hddfQOFUFDx7czOtpRlD9WUiiIaf6Yao8WRc/edit?usp=sharing
2. Klik pada Sheet1 (sheet produk)
3. Tambahkan kolom baru setelah kolom terakhir
4. Beri nama kolom: `grosir`
5. Biarkan kosong untuk sekarang (akan diisi melalui Admin UI)
6. Simpan spreadsheet

### 2.3 Struktur Data JSON untuk Grosir

Setiap produk dapat memiliki data grosir dalam format JSON array:

```json
[
  {"min_qty": 5, "price": 3400},
  {"min_qty": 10, "price": 3300},
  {"min_qty": 15, "price": 3200}
]
```

**Penjelasan:**
- `min_qty`: Kuantitas minimum untuk mendapatkan harga tersebut
- `price`: Harga per unit untuk tingkatan tersebut

**Aturan:**
- Jika produk tidak memiliki harga grosir, kolom bisa kosong atau berisi `[]`
- Harga harus menurun seiring dengan peningkatan kuantitas
- Sistem akan otomatis mengurutkan berdasarkan `min_qty` descending

---

## 3. Admin UI untuk Harga Grosir

### 3.1 Lokasi dan Akses

- **File:** `/admin/index.html` dan `/admin/js/tiered-pricing.js`
- **Menu:** Sidebar admin → "Harga Grosir" (ikon label dengan harga)
- **Akses:** Hanya untuk admin yang sudah login

### 3.2 Fitur-Fitur

#### 3.2.1 Daftar Produk dengan Toggle

Setiap produk ditampilkan dengan:
- Gambar produk (thumbnail)
- Nama produk
- Harga satuan normal
- **Toggle switch** untuk mengaktifkan/menonaktifkan harga grosir

#### 3.2.2 Form Dinamis untuk Tingkatan Harga

Ketika toggle diaktifkan, form akan muncul dengan:
- **Input Min. Qty**: Kuantitas minimum
- **Input Harga per Unit**: Harga yang berlaku
- **Tombol Tambah Tingkatan**: Untuk menambah tingkatan baru
- **Tombol Hapus**: Untuk menghapus tingkatan (minimal 1 tingkatan)

#### 3.2.3 Validasi Input

Sistem akan memvalidasi:
- ✓ Minimal ada satu tingkatan harga
- ✓ Min. Qty harus lebih besar dari 0
- ✓ Harga harus lebih besar dari atau sama dengan 0
- ✓ Harga harus menurun seiring peningkatan min_qty
- ✓ Min. Qty harus unik (tidak ada duplikat)

#### 3.2.4 Tombol Aksi

- **Simpan**: Menyimpan perubahan ke Google Sheets via SheetDB API
- **Batal**: Membatalkan perubahan dan kembali ke tampilan awal

### 3.3 Cara Menggunakan Admin UI

#### Langkah 1: Buka Halaman Harga Grosir
1. Login ke admin dashboard
2. Klik "Harga Grosir" di sidebar

#### Langkah 2: Aktifkan Harga Grosir untuk Produk
1. Cari produk yang ingin diatur harga grosirnya
2. Klik toggle switch untuk mengaktifkan
3. Form tingkatan harga akan muncul

#### Langkah 3: Tambahkan Tingkatan Harga
1. Isi "Min. Qty" (contoh: 5)
2. Isi "Harga per Unit" (contoh: 3400)
3. Klik "+ Tambah Tingkatan" untuk menambah tingkatan berikutnya
4. Ulangi untuk semua tingkatan yang diinginkan

#### Langkah 4: Simpan
1. Klik tombol "Simpan"
2. Sistem akan memvalidasi data
3. Jika valid, data akan disimpan ke Google Sheets
4. Tampilkan notifikasi sukses

#### Langkah 5: Nonaktifkan (Opsional)
1. Klik toggle untuk menonaktifkan harga grosir
2. Semua tingkatan harga akan dihapus
3. Produk kembali menggunakan harga satuan normal

---

## 4. Struktur File yang Ditambahkan

### 4.1 File Baru

```
admin/js/tiered-pricing.js
├── fetchTieredPricingProducts()      - Ambil data produk
├── renderTieredPricingList()         - Tampilkan daftar produk
├── renderTierInput()                 - Render input tier
├── parseGrosirData()                 - Parse JSON grosir
├── toggleTieredPricing()             - Toggle aktif/nonaktif
├── addTierInput()                    - Tambah tier baru
├── removeTierInput()                 - Hapus tier
├── saveTieredPricing()               - Simpan ke API
├── validateTiers()                   - Validasi struktur tier
├── cancelTieredPricing()             - Batal edit
├── updateProductGrosir()             - Update via SheetDB
├── calculateTieredPrice()            - Hitung harga berdasarkan qty
└── showAdminToast()                  - Tampilkan notifikasi
```

### 4.2 File yang Dimodifikasi

```
admin/index.html
├── Tambah navigation button "Harga Grosir" di sidebar
├── Tambah section "section-tiered-pricing"
└── Tambah script tag untuk tiered-pricing.js

admin/js/admin-script.js
├── Tambah 'tiered-pricing' ke titles object
├── Tambah kondisi untuk fetchTieredPricingProducts()
└── Tambah nav-tiered-pricing ke showSection()
```

---

## 5. API Integration

### 5.1 SheetDB API Endpoints

Semua operasi menggunakan SheetDB API yang sudah dikonfigurasi:

```
Base URL: https://sheetdb.io/api/v1/wq8gi00si6w8u
Sheet: Sheet1 (PRODUCTS_SHEET)
```

### 5.2 Operasi PATCH untuk Update

```javascript
// Update kolom grosir untuk produk tertentu
PATCH /id/{productId}?sheet=Sheet1
{
  "data": {
    "grosir": "[{\"min_qty\": 5, \"price\": 3400}]"
  }
}
```

### 5.3 Error Handling

Sistem menangani error dengan:
- ✓ Try-catch untuk setiap operasi API
- ✓ Notifikasi error kepada user
- ✓ Console logging untuk debugging
- ✓ Fallback ke data lokal jika API gagal

---

## 6. Fungsi Utility: calculateTieredPrice()

Fungsi ini digunakan untuk menghitung harga berdasarkan kuantitas:

```javascript
function calculateTieredPrice(basePrice, quantity, tieredPrices) {
  // basePrice: harga satuan normal
  // quantity: jumlah yang dibeli
  // tieredPrices: array tier [{min_qty, price}, ...]
  
  // Return: harga per unit yang berlaku
}
```

**Contoh Penggunaan:**
```javascript
const basePrice = 3500;
const quantity = 15;
const tieredPrices = [
  { min_qty: 5, price: 3400 },
  { min_qty: 10, price: 3300 },
  { min_qty: 15, price: 3200 }
];

const effectivePrice = calculateTieredPrice(basePrice, quantity, tieredPrices);
// Result: 3200 (karena qty 15 >= min_qty 15)
```

---

## 7. Fase Selanjutnya (Fase 2)

Fase 2 akan mencakup:

1. **Pengembangan Logika Harga:**
   - Integrasi `calculateTieredPrice()` ke keranjang belanja
   - Update harga real-time saat quantity berubah
   - Visualisasi harga dengan strikethrough

2. **UI untuk Pelanggan:**
   - Tampilkan tabel tingkatan harga di halaman detail produk
   - Progress bar untuk menunjukkan sisa qty untuk tier berikutnya
   - Highlight diskon grosir

3. **Integrasi WhatsApp:**
   - Update format pesan pesanan dengan harga grosir
   - Tampilkan harga per unit yang berlaku di pesan

4. **Testing Menyeluruh:**
   - Test semua skenario pembelian
   - Test validasi input
   - Test integrasi API

---

## 8. Testing Checklist

### Admin UI Testing

- [ ] Toggle harga grosir berfungsi
- [ ] Tambah tingkatan harga berfungsi
- [ ] Hapus tingkatan harga berfungsi
- [ ] Validasi input bekerja dengan baik
- [ ] Simpan data ke Google Sheets berhasil
- [ ] Notifikasi sukses/error muncul
- [ ] Data ter-reload setelah simpan
- [ ] Nonaktifkan harga grosir berfungsi

### Data Integrity Testing

- [ ] Data JSON valid disimpan
- [ ] Data dapat dibaca kembali dari API
- [ ] Struktur tier konsisten
- [ ] Tidak ada duplikat min_qty

---

## 9. Troubleshooting

### Masalah: Toggle tidak berfungsi

**Solusi:**
1. Buka browser console (F12)
2. Cek error message
3. Pastikan API URL sudah benar di settings
4. Refresh halaman

### Masalah: Data tidak tersimpan

**Solusi:**
1. Cek koneksi internet
2. Cek SheetDB API status
3. Pastikan kolom `grosir` sudah ada di Google Sheets
4. Cek permission Google Sheets

### Masalah: Validasi error saat simpan

**Solusi:**
1. Pastikan min_qty unik dan naik
2. Pastikan harga turun seiring min_qty naik
3. Minimal ada 1 tingkatan harga
4. Tidak ada input kosong

---

## 10. Catatan Penting

### Keamanan

- ⚠️ Admin UI hanya bisa diakses setelah login
- ⚠️ Pastikan SheetDB API dikonfigurasi dengan benar
- ⚠️ Jangan share credentials API secara publik

### Performance

- ✓ Data produk di-cache di memory
- ✓ Validasi dilakukan di client-side
- ✓ API calls diminimalkan

### Kompatibilitas

- ✓ Kompatibel dengan semua browser modern
- ✓ Responsive design untuk mobile
- ✓ Tidak memerlukan library eksternal (vanilla JS)

---

## 11. Kontak & Support

Untuk pertanyaan atau masalah, silakan:

1. Cek dokumentasi di `/Panduan Implementasi Fitur Harga Grosir Bertingkat (Tiered Pricing).md`
2. Review code di `/admin/js/tiered-pricing.js`
3. Buka issue di GitHub repository

---

**Dokumentasi dibuat oleh:** Manus AI Assistant  
**Versi:** 1.0  
**Last Updated:** 12 Januari 2026
