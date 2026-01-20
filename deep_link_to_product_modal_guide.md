# Panduan Implementasi: Deep Link untuk Membuka Modal Produk

**Tanggal:** 20 Januari 2026
**Status:** 📝 Panduan Implementasi

## 1. Latar Belakang

Dokumen ini menjelaskan langkah-langkah teknis untuk mengimplementasikan fitur **Deep Link ke Produk Spesifik**. Fitur ini memungkinkan banner promosi (atau link eksternal lainnya) untuk membuka modal detail produk secara langsung saat halaman dimuat, menggunakan URL hash (contoh: `https://paketsembako.com/#produk-paket-hemat`).

### Keuntungan:
- **Pengalaman Pengguna yang Mulus:** Pengguna langsung diarahkan ke produk yang relevan dengan promosi, mengurangi langkah yang diperlukan untuk melakukan pembelian.
- **Peningkatan Konversi:** Mengurangi friksi dalam alur pembelian dapat secara signifikan meningkatkan tingkat konversi dari kampanye promosi.
- **Fleksibilitas Pemasaran:** Memungkinkan pembuatan kampanye yang sangat tertarget yang mengarah ke produk spesifik.

## 2. Analisis Sistem Saat Ini

Berdasarkan analisis kode, fungsionalitas untuk menampilkan modal detail produk sudah ada dan ditangani oleh fungsi `showDetail(p)` di dalam file `assets/js/script.js`. Fungsi ini menerima objek produk `p` sebagai argumen dan mengisi modal dengan detail produk tersebut.

Namun, saat ini belum ada mekanisme untuk memicu fungsi ini dari URL atau untuk mencari produk berdasarkan ID atau slug dari URL.

## 3. Strategi Implementasi

Implementasi akan dibagi menjadi tiga bagian utama:

1.  **Membuat Slug Produk:** Membuat ID yang URL-friendly (slug) untuk setiap produk agar mudah direferensikan di URL.
2.  **Fungsi Pencarian Produk:** Membuat fungsi baru, `findProductBySlug(slug)`, yang akan mencari produk dari array `allProducts` berdasarkan slug-nya.
3.  **Logika Pemuatan Halaman:** Menambahkan logika pada saat halaman dimuat (`DOMContentLoaded`) untuk memeriksa keberadaan URL hash, mengekstrak slug produk, dan memanggil fungsi `showDetail` jika produk ditemukan.

--- 

## 4. Panduan Implementasi Teknis

Berikut adalah langkah-langkah dan perubahan kode yang diperlukan.

### Langkah 1: Membuat Fungsi Pembuat Slug

Pertama, kita perlu fungsi untuk mengubah nama produk menjadi format `slug` yang konsisten (huruf kecil, tanpa spasi, menggunakan tanda hubung).

**File:** `assets/js/script.js`

Tambahkan fungsi helper ini di bagian atas file, setelah deklarasi variabel global:

```javascript
/**
 * Creates a URL-friendly slug from a string.
 * e.g., "Paket Hemat Beras 5kg" -> "paket-hemat-beras-5kg"
 */
function createSlug(text) {
    if (!text) return 
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, 
        .trim()
        .replace(/[-\s]+/g, 
}
```

### Langkah 2: Menambahkan Slug ke Objek Produk

Selanjutnya, modifikasi fungsi `fetchProducts` untuk menambahkan properti `slug` ke setiap objek produk saat data diambil dari API.

**File:** `assets/js/script.js`

Di dalam fungsi `fetchProducts`, perbarui bagian `return` di dalam `allProducts.map(p => { ... })`:

```javascript
// ... di dalam fetchProducts, di dalam allProducts.map

return {
    ...p,
    harga: cashPrice,
    hargaCoret: parseInt(p.harga_coret) || 0,
    hargaGajian: gajianInfo.price,
    stok: parseInt(p.stok) || 0,
    category: category,
    deskripsi: (p.deskripsi && p.deskripsi.trim() !== "") ? p.deskripsi : defaultDesc,
    variations: variations,
    slug: createSlug(p.nama) // <-- TAMBAHKAN BARIS INI
};

// ... sisa fungsi
```

### Langkah 3: Membuat Fungsi Pencarian Produk

Buat fungsi baru yang akan mencari produk di dalam array `allProducts` menggunakan `slug`.

**File:** `assets/js/script.js`

Tambahkan fungsi ini setelah fungsi `fetchProducts`:

```javascript
/**
 * Finds a product in the allProducts array by its slug.
 */
function findProductBySlug(slug) {
    if (!slug || !allProducts || allProducts.length === 0) {
        return null;
    }
    return allProducts.find(p => p.slug === slug);
}
```

### Langkah 4: Menangani URL Hash Saat Halaman Dimuat

Ini adalah bagian inti dari fitur ini. Kita akan menambahkan event listener `DOMContentLoaded` untuk memeriksa URL hash.

**File:** `assets/js/script.js`

Tambahkan blok kode berikut di akhir file. Pastikan ini berada setelah semua fungsi didefinisikan.

```javascript
/**
 * Handles deep linking to a product modal via URL hash.
 * e.g., #produk-paket-hemat
 */
async function handleDeepLink() {
    // Tunggu hingga produk selesai dimuat
    if (allProducts.length === 0) {
        await fetchProducts();
    }

    if (window.location.hash) {
        const hash = window.location.hash.substring(1); // Hapus tanda #
        console.log("[DeepLink] Hash found:", hash);

        if (hash.startsWith("produk-")) {
            const productSlug = hash.substring(7); // Hapus "produk-"
            console.log("[DeepLink] Looking for product with slug:", productSlug);

            const product = findProductBySlug(productSlug);

            if (product) {
                console.log("[DeepLink] Product found:", product.nama);
                // Beri sedikit jeda agar UI siap
                setTimeout(() => {
                    showDetail(product);
                }, 500); // Jeda 500ms
            } else {
                console.warn("[DeepLink] Product with slug not found:", productSlug);
            }
        }
    }
}

// Event listener untuk memuat halaman dan menangani deep link
document.addEventListener("DOMContentLoaded", () => {
    fetchProducts(); // Panggilan fetchProducts yang sudah ada bisa dipindahkan ke sini jika belum ada
    handleDeepLink();
});

// Juga tangani saat hash berubah setelah halaman dimuat
window.addEventListener("hashchange", handleDeepLink, false);

```

**Catatan Penting:** Jika Anda sudah memiliki `DOMContentLoaded` event listener, cukup tambahkan panggilan `handleDeepLink()` di dalamnya, jangan membuat listener baru.

### Langkah 5: Memperbarui `promo-banner-carousel.js`

Terakhir, pastikan banner carousel menghasilkan URL yang benar. Logika saat ini sudah benar, karena hanya meneruskan `cta_url` ke `href` dari link. Namun, kita bisa menambahkan validasi untuk memastikan formatnya benar.

**File:** `assets/js/promo-banner-carousel.js`

Di dalam fungsi `renderBanners`, saat membuat `bannerLink`, tidak ada perubahan yang diperlukan jika `cta_url` sudah benar. Namun, kita bisa menambahkan logging untuk debugging.

```javascript
// ... di dalam renderBanners, di dalam banners.map

const ctaUrl = banner.cta_url || 

// Log untuk debugging
if (ctaUrl.startsWith("#produk-")) {
    console.log(`[Banner] Creating deep link for: ${banner.title} -> ${ctaUrl}`);
}

const bannerLink = document.createElement("a");
bannerLink.href = ctaUrl;
// ... sisa kode
```

## 5. Cara Penggunaan di Admin Panel

Setelah implementasi ini diterapkan, penggunaan di admin panel menjadi sangat mudah:

1.  **Dapatkan Slug Produk:**
    - Buka halaman utama dan temukan produk yang ingin dipromosikan.
    - Nama produk seperti **"Paket Sembako Ceria"** akan memiliki slug **`paket-sembako-ceria`**.

2.  **Atur `cta_url` di Banner:**
    - Buka Admin Panel -> Banner Promosi -> Tambah/Edit Banner.
    - Di field **"URL Tujuan CTA"**, masukkan hash dengan format `#produk-[slug-produk]`.
    - **Contoh:** Untuk produk "Paket Sembako Ceria", isikan `cta_url` dengan:
      ```
      #produk-paket-sembako-ceria
      ```

3.  **Simpan Banner.**

Sekarang, ketika pengguna mengklik banner tersebut, mereka akan diarahkan ke halaman utama (jika belum ada di sana), dan modal detail untuk "Paket Sembako Ceria" akan otomatis terbuka.

## 6. Rangkuman Perubahan Kode

| File | Perubahan |
| :--- | :--- |
| `assets/js/script.js` | - Menambahkan fungsi `createSlug`.
| | - Menambahkan properti `slug` ke objek produk di `fetchProducts`.
| | - Menambahkan fungsi `findProductBySlug`.
| | - Menambahkan fungsi `handleDeepLink` dan event listener `DOMContentLoaded` & `hashchange`. |
| `assets/js/promo-banner-carousel.js` | - (Opsional) Menambahkan logging untuk debugging `cta_url`. |

## 7. Kesimpulan

Dengan mengikuti panduan ini, fitur **Deep Link ke Produk Spesifik** akan terimplementasi dengan baik. Ini akan menjadi alat pemasaran yang kuat untuk mengarahkan lalu lintas dari kampanye promosi langsung ke titik konversi, sehingga meningkatkan efektivitas penjualan secara keseluruhan.
