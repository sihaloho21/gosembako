# Konsep Pengembangan: Harga Coret & Manajemen Diskon Manual

Dokumen ini merangkum rencana implementasi fitur **Harga Coret** dan **Badge Diskon** yang terintegrasi dengan sistem **Admin CRUD** pada proyek Paket Sembako.

---

## 1. Ringkasan Fitur
Fitur ini bertujuan untuk meningkatkan daya tarik visual produk dengan menampilkan harga asli yang dicoret (Harga Coret) di samping harga jual (Harga Cash), serta menampilkan persentase diskon secara otomatis.

| Komponen | Deskripsi |
| :--- | :--- |
| **Harga Coret** | Harga referensi yang lebih tinggi dengan efek coret (strikethrough). |
| **Harga Cash** | Harga jual aktual yang tetap menonjol (warna hijau). |
| **Badge Diskon** | Label persentase (misal: `-15%`) yang dihitung otomatis dari selisih harga. |
| **Admin CRUD** | Input manual field `harga_coret` pada form tambah/edit produk. |

---

## 2. Perubahan Struktur Data (Database/SheetDB)
Menambahkan satu kolom baru pada Google Sheets/SheetDB:
- **Nama Kolom:** `harga_coret`
- **Tipe Data:** Angka (Integer)
- **Sifat:** Opsional (Jika kosong, fitur diskon tidak muncul).

---

## 3. Implementasi Admin Panel (CRUD)
Admin dapat mengelola harga diskon secara manual melalui antarmuka berikut:

### A. Form Tambah/Edit Produk
Menambahkan input field baru:
```html
<div class="form-group">
    <label>Harga Coret (Opsional)</label>
    <input type="number" name="harga_coret" placeholder="Contoh: 100000">
    <small>Kosongkan jika tidak ada diskon.</small>
</div>
```

### B. Logika Validasi
- Sistem akan membandingkan `harga_coret` dengan `harga_cash`.
- Fitur diskon hanya akan aktif jika `harga_coret > harga_cash`.

---

## 4. Desain Antarmuka Pengguna (UI/UX)

### A. Katalog Produk (Product Card)
Pada bagian **HARGA CASH**, tampilan akan berubah menjadi:
- **Atas:** Harga Coret (Abu-abu, kecil, dicoret) + Badge Diskon (Merah/Orange).
- **Bawah:** Harga Cash (Hijau, besar, tebal).

**Contoh Visual:**
> ~~Rp 45.000~~ <span style="color:red; font-weight:bold;">-11%</span>  
> **Rp 40.000**

### B. Rincian Produk (Detail Modal)
Menampilkan informasi yang sama dengan tata letak yang lebih luas agar terlihat lebih eksklusif.

---

## 5. Logika Perhitungan Persentase
Persentase diskon akan dihitung secara otomatis menggunakan JavaScript:
```javascript
const diskon = Math.round(((hargaCoret - hargaCash) / hargaCoret) * 100);
// Output: -15%
```

---

## 6. Langkah Implementasi Selanjutnya
1. **Update SheetDB:** Tambahkan kolom `harga_coret` di Google Sheets.
2. **Update Admin Script:** Modifikasi `admin-script.js` untuk menangani field baru.
3. **Update Admin HTML:** Tambahkan input field pada `admin/index.html`.
4. **Update Main Script:** Modifikasi `renderProducts` di `script.js` untuk menampilkan UI harga coret dan badge.

---
**Status Konsep:** Disetujui (Manual Entry)  
**Tanggal:** 12 Januari 2026
