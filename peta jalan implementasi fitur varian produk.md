# Peta Jalan Implementasi Fitur Varian Produk

Dokumen ini menyediakan rincian lebih lanjut mengenai setiap fase dalam peta jalan implementasi fitur Varian Produk untuk proyek Paket Sembako. Setiap fase dirancang untuk membangun fungsionalitas secara bertahap, memastikan pengembangan yang terstruktur dan mudah dikelola.

## 1. Fase 1: Model Data & Tampilan Frontend (Hanya Baca)

**Tujuan:** Memodifikasi frontend untuk secara benar mengurai dan menampilkan produk dengan varian, tanpa mengaktifkan fungsionalitas pemilihan varian. Fase ini berfokus pada adaptasi data dan tampilan awal.

**Detail Teknis:**

*   **Perubahan pada Google Sheet:**
    *   Tambahkan kolom baru bernama `variasi` ke `Sheet1` (lembar produk utama).
    *   Isi kolom ini dengan string JSON yang berisi array objek varian untuk produk yang memiliki varian. Contoh:
        ```json
        [
          {"sku": "MG-1L", "nama": "1 Liter", "harga": 15000, "stok": 10, "gambar": "https://example.com/oil-1l.webp"},
          {"sku": "MG-2L", "nama": "2 Liter", "harga": 29000, "stok": 5, "gambar": "https://example.com/oil-2l.webp"}
        ]
        ```
    *   Untuk produk tanpa varian, kolom `variasi` dapat dibiarkan kosong atau `null`.

*   **Perubahan pada `assets/js/script.js`:**
    *   **Fungsi `fetchProducts()`:**
        *   Setelah mengambil data produk dari SheetDB, dalam loop `products.map()`, tambahkan logika untuk memeriksa keberadaan `p.variasi`.
        *   Jika `p.variasi` ada dan merupakan string JSON yang valid, parse string tersebut menjadi array objek JavaScript. Simpan ini sebagai properti baru (misalnya, `product.variations`).
        *   Jika parsing gagal, tangani kesalahan dan pastikan produk tetap ditampilkan tanpa varian.
        *   Jika produk memiliki varian, harga awal yang ditampilkan pada kartu produk harus diambil dari varian pertama dalam array `variations` atau harga produk induk jika tidak ada varian yang valid.
    *   **Fungsi `renderProducts(products)`:**
        *   Modifikasi logika rendering kartu produk.
        *   Untuk produk yang memiliki `product.variations` (array varian tidak kosong):
            *   Ganti tombol "Tambah ke Keranjang" dengan tombol "Pilih Variasi" atau "Lihat Opsi".
            *   Tombol ini harus memiliki atribut `onclick` yang memanggil fungsi baru (misalnya, `showVariationSelector(product)`) yang akan diimplementasikan di Fase 2.
            *   Tampilkan harga dari varian default (varian pertama) atau harga produk utama jika tidak ada varian yang dipilih.
        *   Untuk produk tanpa varian, pertahankan tombol "Tambah ke Keranjang" yang ada.

**Hasil yang Diharapkan:**
*   Produk dengan varian akan muncul di halaman utama dengan indikator yang jelas bahwa ada opsi varian (misalnya, tombol "Pilih Variasi").
*   Harga awal yang ditampilkan untuk produk bervarian akan sesuai dengan varian default (varian pertama).
*   Tidak ada fungsionalitas pemilihan varian yang aktif pada fase ini; tujuannya hanya untuk menampilkan data varian dengan benar.

## 2. Fase 2: Pemilihan Varian & Harga Dinamis

**Tujuan:** Mengimplementasikan antarmuka pengguna (UI) untuk memilih varian dan memperbarui informasi produk (harga, gambar, stok) secara dinamis berdasarkan varian yang dipilih.

**Detail Teknis:**

*   **Perubahan pada `assets/js/script.js`:**
    *   **Fungsi `showVariationSelector(product)`:**
        *   Buat fungsi ini untuk menampilkan modal atau bagian khusus di halaman yang berisi daftar varian produk.
        *   Modal ini harus menampilkan nama varian (`nama`), harga (`harga`), dan informasi stok (`stok`) untuk setiap varian.
        *   Setiap varian harus dapat diklik atau dipilih (misalnya, menggunakan tombol radio atau tombol biasa).
        *   Saat varian dipilih, fungsi ini harus memperbarui tampilan harga (tunai, Bayar Gajian, grosir) pada modal atau detail produk.
        *   Jika varian memiliki `gambar` sendiri, perbarui gambar produk yang ditampilkan di modal.
    *   **Integrasi Harga Gajian dan Grosir:**
        *   Pastikan `calculateGajianPrice` dan `calculateTieredPrice` (dari `tiered-pricing-logic.js`) dapat menerima harga dari varian yang dipilih.
        *   Logika untuk menampilkan harga grosir juga harus diperbarui untuk mencerminkan harga grosir spesifik varian jika ada.
    *   **Tombol "Tambah ke Keranjang":**
        *   Setelah varian dipilih, tombol "Tambah ke Keranjang" di modal atau detail produk harus menjadi aktif.
        *   Fungsi `addToCart` harus dimodifikasi untuk menerima objek varian yang dipilih sebagai parameter tambahan.

*   **Perubahan pada `index.html` (atau file HTML terkait):**
    *   Tambahkan struktur HTML untuk modal atau bagian pemilihan varian. Ini bisa berupa `div` tersembunyi yang akan ditampilkan oleh JavaScript.
    *   Sertakan elemen untuk menampilkan nama varian, harga, stok, dan gambar (jika ada).

**Hasil yang Diharapkan:**
*   Pengguna dapat mengklik produk bervarian dan melihat daftar opsi varian.
*   Saat varian dipilih, harga dan informasi terkait lainnya akan diperbarui secara real-time.
*   Pengguna dapat menambahkan varian spesifik ke keranjang.

## 3. Fase 3: Integrasi Keranjang & Pesanan

**Tujuan:** Memastikan keranjang secara akurat mencerminkan varian yang dipilih dan pesan pesanan WhatsApp diformat dengan benar dengan detail varian.

**Detail Teknis:**

*   **Perubahan pada `assets/js/script.js`:**
    *   **Fungsi `addToCart(product, selectedVariation)`:**
        *   Modifikasi fungsi ini untuk menyimpan objek `selectedVariation` (jika ada) bersama dengan detail produk lainnya di `localStorage` (variabel `sembako_cart`).
        *   Struktur item keranjang harus mencakup `selectedVariation` dengan `sku`, `nama`, `harga`, dan `stok` varian yang dipilih.
        *   Perhitungan `finalPrice` dalam item keranjang harus didasarkan pada harga varian yang dipilih, setelah memperhitungkan harga grosir jika berlaku.
    *   **Fungsi `updateCartUI()`:**
        *   Modifikasi tampilan item di keranjang agar menampilkan nama varian (misalnya, "Minyak Goreng (2 Liter)") jika varian telah dipilih.
        *   Pastikan harga yang ditampilkan di keranjang adalah harga varian yang dipilih.
    *   **Fungsi `sendWhatsAppOrder()`:**
        *   Modifikasi logika pembuatan pesan WhatsApp.
        *   Untuk setiap item di keranjang, periksa apakah ada `selectedVariation`.
        *   Jika ada, sertakan nama varian dalam deskripsi produk (misalnya, "Minyak Goreng (2 Liter)").
        *   Pastikan harga yang dikirim dalam pesan adalah harga varian yang dipilih.

**Hasil yang Diharapkan:**
*   Keranjang belanja akan secara akurat menyimpan dan menampilkan produk beserta varian yang dipilih.
*   Pesan pesanan WhatsApp akan mencantumkan varian produk secara jelas, memastikan pesanan yang tepat.

## 4. Fase 4: Integrasi Panel Admin

**Tujuan:** Menyediakan antarmuka di panel admin bagi administrator untuk dengan mudah mengelola varian produk, termasuk menambah, mengedit, dan menghapus varian, serta mengelola stok per varian.

**Detail Teknis:**

*   **Perubahan pada `admin/index.html`:**
    *   Dalam formulir pengeditan/penambahan produk, tambahkan bagian baru (misalnya, `div` atau `fieldset`) untuk "Manajemen Varian".
    *   Bagian ini harus berisi tombol "Tambah Varian Baru" dan area dinamis untuk menampilkan dan mengedit setiap varian (bidang input untuk SKU, nama, harga, harga coret, stok, gambar, grosir).

*   **Perubahan pada `admin/js/admin-script.js`:**
    *   **Fungsi `fetchAdminProducts()` dan `renderAdminProducts()`:**
        *   Pastikan data `variasi` diambil dan ditampilkan di panel admin, mungkin sebagai indikator bahwa produk memiliki varian.
    *   **Fungsi `editProduct(productId)` atau `saveProduct()`:**
        *   Modifikasi fungsi ini untuk menangani data varian.
        *   Saat mengedit produk, uraikan string JSON `variasi` dan isi formulir manajemen varian.
        *   Saat menyimpan produk, kumpulkan data dari formulir manajemen varian, validasi, dan serialisasikan kembali menjadi string JSON untuk disimpan di kolom `variasi` Google Sheet.
    *   **Logika Manajemen Varian (JavaScript):**
        *   Implementasikan fungsi JavaScript untuk secara dinamis menambah, menghapus, dan mengedit bidang input untuk setiap varian dalam antarmuka admin.
        *   Pastikan validasi input untuk setiap bidang varian (misalnya, `harga` dan `stok` harus berupa angka).
        *   Sediakan fungsionalitas untuk mengelola `stok` per varian, yang akan menjadi sumber kebenaran untuk ketersediaan produk.

**Hasil yang Diharapkan:**
*   Administrator dapat dengan mudah menambahkan, mengedit, dan menghapus varian untuk setiap produk melalui panel admin.
*   Manajemen stok akan dilakukan pada tingkat varian, memberikan kontrol yang lebih granular.
*   Data varian akan disimpan dengan benar di Google Sheet dalam format JSON yang ditentukan.

---
