# Image Slider Integration Guide

## Pengenalan

Image Slider adalah modul JavaScript yang mengelola tampilan gambar produk dengan fitur navigasi, dots indicator, keyboard support, dan touch/swipe support. Modul ini sudah terintegrasi di `index.html` dan dapat dengan mudah diintegrasikan ke halaman lain.

## Struktur Image Slider

### File Utama
- **File:** `/assets/js/image-slider.js`
- **Ukuran:** ~6KB
- **Dependencies:** Tidak ada (vanilla JavaScript)
- **Browser Support:** Modern browsers (ES6+)

### Fungsi-Fungsi Utama

```javascript
// Initialize slider dengan array gambar
initializeSlider(images)

// Navigasi ke slide berikutnya
nextSlide()

// Navigasi ke slide sebelumnya
prevSlide()

// Navigasi ke slide tertentu
goToSlide(index)

// Update counter display
updateSliderCounter()

// Setup keyboard navigation
setupKeyboardNavigation()

// Setup touch/swipe navigation
setupTouchNavigation()

// Fallback jika tidak ada gambar
initializeSliderFallback()
```

### Global Variables
```javascript
let currentSlideIndex = 0;    // Index slide saat ini
let totalSlides = 0;          // Total jumlah slide
let sliderImages = [];        // Array URL gambar
```

---

## Langkah-Langkah Integrasi

### Langkah 1: Tambahkan Script Reference

**Untuk halaman yang sudah memiliki modal produk (seperti `akun.html`):**

Tambahkan script `image-slider.js` sebelum script utama halaman:

```html
<!-- Sebelum: -->
<script src="assets/js/config.js"></script>
<script src="assets/js/api-service.js"></script>
<script src="assets/js/referral-helper.js"></script>
<script src="assets/js/script.js"></script>

<!-- Sesudah: -->
<script src="assets/js/config.js"></script>
<script src="assets/js/api-service.js"></script>
<script src="assets/js/image-slider.js"></script>  <!-- TAMBAH INI -->
<script src="assets/js/referral-helper.js"></script>
<script src="assets/js/script.js"></script>
```

**Untuk halaman di folder `admin/` (path relatif berbeda):**

```html
<!-- Untuk admin/index.html: -->
<script src="../assets/js/image-slider.js"></script>  <!-- Path relatif ke parent -->
```

### Langkah 2: Siapkan HTML Structure

Modal produk memerlukan struktur HTML khusus untuk image slider. Berikut adalah template lengkap:

```html
<!-- Modal Container -->
<div id="product-detail-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-[60]">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[95vh] overflow-y-auto relative">
        <!-- Close Button -->
        <button onclick="closeDetailModal()" class="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-600 hover:text-gray-900 shadow-sm transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>

        <!-- Image Slider Section -->
        <div class="slider-container relative h-64 w-full overflow-hidden rounded-t-2xl bg-gray-100">
            <!-- Skeleton Loader (optional) -->
            <div id="slider-skeleton" class="skeleton-loader absolute inset-0 z-10 bg-gray-200 animate-pulse"></div>
            
            <!-- Slider Container -->
            <div id="modal-slider" class="relative h-full w-full">
                <!-- Images are dynamically loaded here by JavaScript -->
            </div>
            
            <!-- Slide Counter -->
            <div class="slider-counter absolute top-4 left-4 z-20 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg" id="slider-counter">
                1 / 1
            </div>
            
            <!-- Dots Indicator -->
            <div id="slider-dots" class="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <!-- Dots are dynamically loaded here by JavaScript -->
            </div>
            
            <!-- Previous Button -->
            <button onclick="prevSlide()" class="slider-arrow prev absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-800 shadow-sm hover:bg-white transition" title="Gambar sebelumnya">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
            </button>
            
            <!-- Next Button -->
            <button onclick="nextSlide()" class="slider-arrow next absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-800 shadow-sm hover:bg-white transition" title="Gambar berikutnya">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
            </button>
        </div>

        <!-- Product Content -->
        <div class="p-6">
            <!-- Product details here -->
        </div>
    </div>
</div>
```

### Langkah 3: Implementasi Fungsi Pemanggil

Di file JavaScript halaman Anda, buat fungsi untuk membuka modal produk dan initialize slider:

```javascript
/**
 * Buka modal produk dengan image slider
 * @param {Object} product - Data produk
 * @param {number} index - Index produk (opsional)
 */
function openProductDetailModal(product, index = 0) {
    const modal = document.getElementById('product-detail-modal');
    
    if (!modal) {
        console.error('❌ Modal tidak ditemukan');
        return;
    }

    // Populate product data
    document.getElementById('modal-product-name').textContent = product.nama || 'Produk';
    
    // Initialize slider dengan gambar produk
    const images = product.gambar ? product.gambar.split(',') : [];
    
    if (typeof initializeSlider === 'function') {
        initializeSlider(images);
    } else {
        console.error('❌ initializeSlider function not found');
        initializeSliderFallback();
    }
    
    // Show modal
    modal.classList.remove('hidden');
    document.body.classList.add('modal-active');
}

/**
 * Tutup modal produk
 */
function closeDetailModal() {
    const modal = document.getElementById('product-detail-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('modal-active');
    }
}
```

### Langkah 4: Panggil Fungsi Saat Diperlukan

Panggil `openProductDetailModal()` dari event handler atau button click:

```javascript
// Dari button click
<button onclick="openProductDetailModal(productData)">
    Lihat Detail
</button>

// Dari JavaScript
function handleProductClick(product) {
    openProductDetailModal(product);
}

// Dari event listener
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('product-card')) {
        const product = JSON.parse(e.target.dataset.product);
        openProductDetailModal(product);
    }
});
```

---

## Contoh Implementasi Lengkap

### Contoh 1: Integrasi ke akun.html

**File:** `/akun.html`

**Step 1: Tambah Script**
```html
<!-- Line 680-683 -->
<script src="assets/js/config.js"></script>
<script src="assets/js/api-service.js"></script>
<script src="assets/js/image-slider.js"></script>  <!-- TAMBAH INI -->
<script src="assets/js/referral-helper.js"></script>
<script src="assets/js/script.js"></script>
<script src="assets/js/akun.js"></script>
```

**Step 2: Tambah Modal HTML**
```html
<!-- Tambahkan sebelum closing </body> -->
<div id="product-detail-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-[60]">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[95vh] overflow-y-auto relative">
        <!-- Close Button -->
        <button onclick="closeDetailModal()" class="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>

        <!-- Image Slider -->
        <div class="slider-container relative h-64 w-full overflow-hidden rounded-t-2xl bg-gray-100">
            <div id="slider-skeleton" class="skeleton-loader absolute inset-0 z-10 bg-gray-200 animate-pulse"></div>
            <div id="modal-slider" class="relative h-full w-full"></div>
            <div class="slider-counter absolute top-4 left-4 z-20 bg-black/50 text-white text-[10px] font-bold px-2 py-1 rounded-lg" id="slider-counter">1 / 1</div>
            <div id="slider-dots" class="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-black/20 px-3 py-1.5 rounded-full"></div>
            <button onclick="prevSlide()" class="slider-arrow prev absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
            </button>
            <button onclick="nextSlide()" class="slider-arrow next absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
            </button>
        </div>

        <!-- Product Content -->
        <div class="p-6">
            <h3 id="modal-product-name" class="text-2xl font-bold text-gray-800">Produk</h3>
            <!-- Tambah konten produk lainnya di sini -->
        </div>
    </div>
</div>
```

**Step 3: Tambah Fungsi JavaScript**
```javascript
// Tambahkan di akun.js atau dalam <script> tag
function openProductDetailModal(product) {
    const modal = document.getElementById('product-detail-modal');
    if (!modal) return;

    document.getElementById('modal-product-name').textContent = product.nama || 'Produk';
    
    const images = product.gambar ? product.gambar.split(',') : [];
    if (typeof initializeSlider === 'function') {
        initializeSlider(images);
    }
    
    modal.classList.remove('hidden');
    document.body.classList.add('modal-active');
}

function closeDetailModal() {
    const modal = document.getElementById('product-detail-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('modal-active');
    }
}
```

### Contoh 2: Integrasi ke admin/index.html

**File:** `/admin/index.html`

**Step 1: Tambah Script dengan Path Relatif**
```html
<!-- Line 792-796 -->
<script src="../assets/js/config.js"></script>
<script src="../assets/js/api-service.js"></script>
<script src="../assets/js/image-slider.js"></script>  <!-- TAMBAH INI (path relatif) -->
<script src="js/tiered-pricing.js"></script>
<script src="js/banner-management.js"></script>
<script src="js/admin-script.js"></script>
```

**Step 2-3: Sama seperti contoh 1**

---

## Fitur-Fitur Image Slider

### 1. Navigation Buttons
- **Previous Button:** Tombol panah kiri untuk slide sebelumnya
- **Next Button:** Tombol panah kanan untuk slide berikutnya
- **Auto-wrap:** Slide pertama setelah slide terakhir, dan sebaliknya

### 2. Dots Indicator
- Menunjukkan jumlah slide
- Dot aktif lebih lebar dan lebih terang
- Click dot untuk navigasi cepat

### 3. Keyboard Navigation
- **Arrow Left:** Slide sebelumnya
- **Arrow Right:** Slide berikutnya
- Hanya aktif saat modal terbuka

### 4. Touch/Swipe Support
- **Swipe Left:** Slide berikutnya
- **Swipe Right:** Slide sebelumnya
- Minimum swipe distance: 50px

### 5. Slide Counter
- Menampilkan posisi slide (contoh: "2 / 5")
- Update otomatis saat navigasi

### 6. Image Loading
- Skeleton loader saat gambar dimuat
- Fallback placeholder jika gambar error
- Smooth opacity transition antar slide

---

## Troubleshooting

### Problem 1: "initializeSlider is not defined"
**Penyebab:** Script `image-slider.js` belum dimuat
**Solusi:**
1. Pastikan `<script src="assets/js/image-slider.js"></script>` ada di HTML
2. Pastikan path relatif benar (gunakan `../` jika di subfolder)
3. Check browser console untuk error loading

### Problem 2: Slider tidak muncul
**Penyebab:** HTML structure tidak lengkap
**Solusi:**
1. Pastikan element dengan ID `modal-slider` ada
2. Pastikan element dengan ID `slider-dots` ada
3. Pastikan element dengan ID `slider-counter` ada
4. Check console untuk error messages

### Problem 3: Gambar tidak tampil
**Penyebab:** URL gambar tidak valid atau CORS issue
**Solusi:**
1. Verify URL gambar di browser console
2. Check CORS headers dari server gambar
3. Gunakan placeholder image sebagai fallback

### Problem 4: Keyboard/Touch tidak bekerja
**Penyebab:** Event listener tidak terdaftar
**Solusi:**
1. Pastikan `setupKeyboardNavigation()` dipanggil
2. Pastikan `setupTouchNavigation()` dipanggil
3. Check console untuk error messages

### Problem 5: Modal tidak menutup
**Penyebab:** Close button tidak terhubung dengan fungsi
**Solusi:**
1. Pastikan `closeDetailModal()` function ada
2. Pastikan button onclick="closeDetailModal()" benar
3. Check console untuk error messages

---

## Best Practices

### 1. Error Handling
```javascript
// Selalu check apakah function ada sebelum memanggil
if (typeof initializeSlider === 'function') {
    initializeSlider(images);
} else {
    console.error('Image slider module not loaded');
    // Fallback ke placeholder
}
```

### 2. Image Optimization
```javascript
// Gunakan gambar yang sudah dioptimasi
const images = product.gambar 
    ? product.gambar.split(',').filter(img => img.trim() !== '')
    : [];

if (images.length === 0) {
    images.push('https://placehold.co/300x200?text=Produk');
}
```

### 3. Performance
```javascript
// Lazy load modal content
function openProductDetailModal(product) {
    // Load modal hanya saat diperlukan
    if (!document.getElementById('product-detail-modal')) {
        createProductModal(); // Create modal dynamically
    }
    // ... rest of code
}
```

### 4. Accessibility
```html
<!-- Tambah alt text untuk images -->
<img src="..." alt="Slide 1 dari produk XYZ" />

<!-- Tambah title untuk buttons -->
<button title="Gambar sebelumnya" onclick="prevSlide()">...</button>
<button title="Gambar berikutnya" onclick="nextSlide()">...</button>
```

---

## API Reference

### initializeSlider(images)
Initialize slider dengan array gambar

**Parameters:**
- `images` (Array<string>): Array URL gambar

**Returns:** void

**Example:**
```javascript
const images = ['url1.jpg', 'url2.jpg', 'url3.jpg'];
initializeSlider(images);
```

### nextSlide()
Navigasi ke slide berikutnya

**Parameters:** None

**Returns:** void

**Example:**
```javascript
nextSlide();
```

### prevSlide()
Navigasi ke slide sebelumnya

**Parameters:** None

**Returns:** void

**Example:**
```javascript
prevSlide();
```

### goToSlide(index)
Navigasi ke slide tertentu

**Parameters:**
- `index` (number): Index slide (0-based)

**Returns:** void

**Example:**
```javascript
goToSlide(2); // Go to 3rd slide
```

---

## Resources

- **Image Slider Source:** `/assets/js/image-slider.js`
- **Implementation Example:** `/index.html`
- **Vite Setup Guide:** `/VITE_SETUP_GUIDE.md`

---

**Last Updated:** January 24, 2026
**Version:** 1.0.0
