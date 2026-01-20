# Spesifikasi Fitur Varian Produk

## 1. Pendahuluan
Dokumen ini menguraikan spesifikasi teknis untuk mengimplementasikan fitur **Varian Produk** dalam proyek **Paket Sembako**. Tujuannya adalah untuk meningkatkan katalog produk dengan memungkinkan satu entri produk (misalnya, "Minyak Goreng") memiliki beberapa varian (misalnya, "1 Liter", "2 Liter"), masing-masing dengan potensi harga dan tingkat stok yang berbeda. Ini akan meningkatkan pengalaman pengguna dengan mengurangi kekacauan tampilan produk dan menyediakan proses pemilihan yang lebih intuitif.

## 2. Masalah Saat Ini
Saat ini, setiap produk yang berbeda, terlepas dari apakah itu varian dari produk lain, terdaftar sebagai entri terpisah dalam katalog produk. Misalnya, "Minyak Goreng 1 Liter" dan "Minyak Goreng 2 Liter" akan muncul sebagai dua produk independen. Pendekatan ini menyebabkan:
*   **Grid Produk yang Berantakan:** Nama produk yang berulang untuk item serupa.
*   **Navigasi yang Sulit:** Pengguna harus mencari ukuran/jenis yang berbeda dari produk yang sama.
*   **Manajemen yang Tidak Efisien:** Entri data yang berlebihan untuk informasi produk inti.

## 3. Solusi yang Diusulkan: Varian Berbasis JSON
Untuk mengatasi keterbatasan tersebut, kami akan mengimplementasikan sistem varian berbasis JSON. Pendekatan ini memanfaatkan sumber data Google Sheet yang ada dengan memperkenalkan kolom baru untuk menyimpan detail varian dalam format JSON terstruktur. Metode ini menawarkan fleksibilitas, kemudahan pemeliharaan, dan meminimalkan perubahan pada mekanisme pengambilan data inti.

### 3.1. Struktur Data (Google Sheets)
Kolom baru, `variasi`, akan ditambahkan ke lembar produk utama (misalnya, `Sheet1`). Kolom ini akan menyimpan array objek JSON, di mana setiap objek mewakili varian produk yang berbeda. Produk tanpa varian akan memiliki kolom ini kosong atau null.

**Contoh Baris Google Sheet:**

| id | nama | harga | harga_coret | gambar | stok | kategori | deskripsi | grosir | **variasi** |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1767357373755 | Minyak Goreng | 15000 | 16000 | `https://example.com/oil.webp` | 15 | Bahan Pokok | Minyak Goreng Berkualitas | `[{"min_qty":5,"price":14000}]` | `[{"sku": "MG-1L", "nama": "1 Liter", "harga": 15000, "stok": 10, "gambar": "https://example.com/oil-1l.webp"}, {"sku": "MG-2L", "nama": "2 Liter", "harga": 29000, "stok": 5, "gambar": "https://example.com/oil-2l.webp"}]` |
| 1767436687218 | Indomie Goreng Aceh | 3500 | | `https://example.com/indomie.webp` | 40 | Bahan Pokok | 1 Bungkus Indomie Goreng Aceh | | |

### 3.2. Definisi Skema JSON untuk Kolom `variasi`
Kolom `variasi` akan berisi array objek JSON, masing-masing sesuai dengan struktur berikut:

```json
[
  {
    "sku": "string",       // Pengidentifikasi unik untuk varian (misalnya, MG-1L)
    "nama": "string",      // Nama tampilan varian (misalnya, "1 Liter")
    "harga": "number",     // Harga tunai dasar untuk varian ini
    "harga_coret": "number", // Opsional: Harga coret untuk varian ini
    "stok": "number",      // Tingkat stok untuk varian spesifik ini
    "gambar": "string",    // Opsional: URL gambar khusus varian
    "grosir": "string"     // Opsional: String JSON untuk harga bertingkat khusus varian
  }
]
```

**Catatan pada Skema:**
*   `sku` sangat penting untuk mengidentifikasi varian yang dipilih secara unik di keranjang dan pesanan.
*   Bidang `harga`, `harga_coret`, `stok`, `gambar`, dan `grosir` dalam objek varian akan **menggantikan** bidang yang sesuai dari produk induk saat varian tersebut dipilih. Jika suatu bidang tidak ada dalam objek varian, nilai produk induk akan digunakan sebagai cadangan.
*   Bidang `grosir` dalam varian juga akan berupa string JSON, mirip dengan bidang `grosir` produk utama, memungkinkan harga bertingkat khusus varian.

### 3.3. Alasan untuk Varian Berbasis JSON
*   **Katalog Bersih:** Satu kartu produk mewakili keluarga produk, mengurangi kekacauan visual.
*   **Panggilan API yang Disederhanakan:** Tidak ada perubahan yang diperlukan pada fungsi `fetchProducts` yang ada; data `variasi` diambil bersama dengan data produk utama.
*   **Fleksibilitas:** Mudah diperluas untuk mendukung berbagai jenis varian (misalnya, ukuran, warna, bahan) dengan menambahkan lebih banyak atribut ke objek varian.
*   **Kemudahan Pemeliharaan:** Manajemen varian terpusat dalam baris data produk itu sendiri.
*   **Manajemen Stok Individual:** Setiap varian dapat memiliki stoknya sendiri, mencegah penjualan berlebihan.

## 4. Perubahan Antarmuka Pengguna (Frontend)

### 4.1. Tampilan Kartu Produk
*   Untuk produk dengan varian, tombol "Tambah ke Keranjang" akan diganti dengan tombol "Pilih Variasi".
*   Harga awal yang ditampilkan pada kartu produk akan menjadi harga **varian pertama** dalam array `variasi`, atau harga produk induk jika tidak ada varian yang dipilih.

### 4.2. UI Pemilihan Varian
*   Mengklik "Pilih Variasi" atau kartu produk akan membuka **modal atau bagian khusus** (misalnya, di bagian bawah tampilan detail produk).
*   UI ini akan menampilkan semua varian yang tersedia (misalnya, "1 Liter", "2 Liter") sebagai tombol yang dapat diklik atau opsi radio.
*   Setiap opsi varian akan dengan jelas menunjukkan nama dan perbedaan harganya (misalnya, "1 Liter - Rp 15.000", "2 Liter - Rp 29.000").

### 4.3. Pembaruan Dinamis
*   Setelah memilih varian, **harga tunai**, **harga Bayar Gajian**, dan informasi **Harga Grosir** yang ditampilkan pada tampilan detail produk akan diperbarui secara dinamis untuk mencerminkan harga varian yang dipilih.
*   Gambar produk juga dapat diperbarui jika URL `gambar` disediakan dalam objek varian yang dipilih.
*   Tombol "Tambah ke Keranjang" akan menjadi aktif, menambahkan *varian yang dipilih* ke keranjang.

### 4.4. Penanganan Gambar
*   Jika objek varian menyertakan bidang `gambar`, gambar tersebut akan ditampilkan saat varian dipilih.
*   Jika tidak ada `gambar` yang ditentukan untuk varian, `gambar` produk utama akan digunakan sebagai cadangan.

## 5. Keranjang dan Pemrosesan Pesanan

### 5.1. Struktur Item Keranjang
Ketika pengguna menambahkan produk dengan varian yang dipilih ke keranjang, objek item keranjang akan diperbarui untuk menyertakan detail varian. Ini memastikan bahwa varian spesifik, harga, dan stoknya dilacak secara akurat.

**Contoh Item Keranjang:**

```json
{
  "id": "1767357373755",
  "nama": "Minyak Goreng",
  "quantity": 1,
  "selectedVariation": {
    "sku": "MG-2L",
    "nama": "2 Liter",
    "harga": 29000,
    "stok": 5
  },
  "finalPrice": 29000 // Harga setelah menerapkan harga bertingkat untuk varian
}
```

### 5.2. Integrasi Pesan WhatsApp
Pesan pesanan WhatsApp akan dimodifikasi untuk secara jelas menunjukkan varian yang dipilih untuk setiap produk. Ini memastikan bahwa detail pesanan yang dikirim ke vendor akurat.

**Contoh Cuplikan Pesan WhatsApp:**

```
- Minyak Goreng (2 Liter) x 1 = Rp 29.000
- Indomie Goreng Aceh x 2 = Rp 7.000
```

## 6. Perubahan Panel Admin

### 6.1. Antarmuka Pengeditan Produk
*   Formulir pengeditan produk di panel admin akan diperbarui untuk menyertakan bagian untuk mengelola varian.
*   Bagian ini akan memungkinkan administrator untuk:
    *   Menambahkan varian baru ke produk.
    *   Mengedit detail varian yang ada (SKU, nama, harga, harga coret, stok, URL gambar, harga bertingkat khusus varian).
    *   Menghapus varian.
*   Antarmuka yang ramah pengguna (misalnya, bidang input dinamis atau editor JSON) akan disediakan untuk mengelola data JSON `variasi`.

### 6.2. Manajemen Stok
*   Bidang stok untuk produk utama akan menjadi opsional atau mewakili stok 'virtual' jika varian ada.
*   Manajemen stok utama akan beralih ke bidang `stok` individual dalam setiap objek varian.
*   Panel admin akan menampilkan dan memungkinkan pengeditan stok untuk setiap varian secara terpisah.

## 7. Peta Jalan Implementasi
Implementasi akan dibagi menjadi beberapa fase untuk memastikan proses pengembangan yang terstruktur dan mudah dikelola.

### Fase 1: Model Data & Tampilan Frontend (Hanya Baca)
*   **Tujuan:** Memodifikasi frontend untuk mengurai dan menampilkan produk dengan varian dengan benar, tanpa mengaktifkan pemilihan.
*   **Tugas:**
    *   Perbarui `script.js` untuk memeriksa kolom `variasi` di produk yang diambil.
    *   Jika `variasi` ada, uraikan string JSON menjadi array objek varian.
    *   Modifikasi `renderProducts` untuk menampilkan tombol "Pilih Variasi" atau indikator serupa untuk produk dengan varian.
    *   Pastikan kartu produk awalnya menampilkan harga varian pertama atau placeholder yang sesuai.

### Fase 2: Pemilihan Varian & Harga Dinamis
*   **Tujuan:** Mengimplementasikan UI untuk memilih varian dan memperbarui informasi produk secara dinamis.
*   **Tugas:**
    *   Kembangkan modal atau komponen UI khusus untuk pemilihan varian.
    *   Implementasikan logika untuk memperbarui harga yang ditampilkan (tunai, Bayar Gajian, grosir) berdasarkan varian yang dipilih.
    *   Perbarui gambar produk jika `gambar` khusus varian disediakan.
    *   Modifikasi `addToCart` untuk menerima dan menyimpan objek varian yang dipilih.

### Fase 3: Integrasi Keranjang & Pesanan
*   **Tujuan:** Memastikan keranjang secara akurat mencerminkan varian yang dipilih dan pesan pesanan WhatsApp diformat dengan benar.
*   **Tugas:**
    *   Perbarui penyimpanan keranjang (`localStorage`) untuk menyertakan detail `selectedVariation`.
    *   Modifikasi UI keranjang untuk menampilkan nama varian (misalnya, "Minyak Goreng (2 Liter)").
    *   Sesuaikan logika pembuatan pesan WhatsApp untuk menyertakan nama varian dan harga masing-masing.

### Fase 4: Integrasi Panel Admin
*   **Tujuan:** Memberikan administrator alat untuk mengelola varian produk dengan mudah.
*   **Tugas:**
    *   Modifikasi formulir pengeditan produk (`admin/index.html`, `admin/js/admin-script.js`) untuk menambahkan bagian varian.
    *   Implementasikan logika JavaScript untuk menambah, mengedit, dan menghapus objek varian dalam bidang JSON `variasi`.
    *   Pastikan tingkat stok dikelola per varian.

## 8. Pertimbangan dan Peningkatan di Masa Depan
*   **Beberapa Jenis Varian:** Meskipun skema saat ini mendukung varian satu tingkat, skema ini dapat diperluas untuk menangani beberapa jenis varian (misalnya, ukuran dan warna) dengan menumpuk objek JSON atau menambahkan lebih banyak atribut.
*   **Pencarian dan Pemfilteran:** Implementasikan kemampuan pencarian dan pemfilteran yang dapat mempertimbangkan atribut varian.
*   **Pelaporan:** Tingkatkan laporan penjualan untuk menguraikan penjualan berdasarkan varian individual.
*   **Kinerja:** Pantau kinerja dengan sejumlah besar varian dan optimalkan penguraian data jika perlu.

Spesifikasi terperinci ini akan memandu proses pengembangan fitur Varian Produk. Kita sekarang dapat melanjutkan dengan implementasi, dimulai dengan Fase 1.
