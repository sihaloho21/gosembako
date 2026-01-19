# Panduan Implementasi Modal Konfirmasi untuk Fitur TUKAR POIN

## 📋 Ringkasan
Dokumen ini menjelaskan cara mengimplementasikan modal konfirmasi yang muncul ketika pengguna mengklik tombol **"TUKAR"** pada fitur penukaran poin reward. Modal ini akan memastikan pengguna benar-benar ingin menukar poin mereka sebelum transaksi diproses.

---

## 🎯 Tujuan
Mengganti dialog `confirm()` dan `prompt()` bawaan browser dengan modal custom yang lebih user-friendly dan sesuai dengan desain aplikasi Paket Sembako.

---

## 📊 Alur Kerja Saat Ini vs Baru

### Alur Saat Ini (Menggunakan Browser Dialog)
```
User Klik TUKAR
    ↓
confirm() dialog → "Tukar X poin dengan Y?"
    ↓
prompt() dialog → "Masukkan nama Anda"
    ↓
Proses Transaksi
```

### Alur Baru (Menggunakan Modal Custom)
```
User Klik TUKAR
    ↓
Modal Konfirmasi Muncul (dengan detail reward)
    ↓
User Pilih: Lanjutkan / Batal
    ↓
Jika Lanjutkan → Modal Input Nama Muncul
    ↓
User Masukkan Nama & Konfirmasi
    ↓
Proses Transaksi
```

---

## 🛠️ Implementasi

### 1. Tambahkan Modal HTML di `index.html`

Tambahkan kode berikut sebelum closing tag `</body>` (sebelum `<script>` tags):

```html
<!-- Modal Konfirmasi Tukar Poin -->
<div id="confirm-tukar-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-[70]">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 animate-in fade-in zoom-in-95 duration-200">
        <!-- Header dengan Icon -->
        <div class="flex justify-center mb-6">
            <div class="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
                <svg class="w-8 h-8 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
            </div>
        </div>

        <!-- Judul -->
        <h3 class="text-2xl font-bold text-center text-gray-800 mb-2">Konfirmasi Penukaran</h3>
        <p class="text-center text-sm text-gray-500 mb-6">Pastikan detail penukaran Anda sudah benar</p>

        <!-- Detail Reward -->
        <div class="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border-2 border-amber-200 mb-6 space-y-3">
            <div class="flex justify-between items-start">
                <span class="text-sm font-semibold text-gray-700">Hadiah:</span>
                <span id="confirm-reward-name" class="text-sm font-bold text-gray-900 text-right flex-1 ml-2">-</span>
            </div>
            <div class="border-t border-amber-200 pt-3 flex justify-between items-start">
                <span class="text-sm font-semibold text-gray-700">Poin Ditukar:</span>
                <div class="flex items-center gap-1">
                    <span id="confirm-reward-points" class="text-lg font-black text-amber-600">0</span>
                    <span class="text-xs font-bold text-amber-600">Poin</span>
                </div>
            </div>
            <div class="border-t border-amber-200 pt-3 flex justify-between items-start">
                <span class="text-sm font-semibold text-gray-700">Sisa Poin:</span>
                <div class="flex items-center gap-1">
                    <span id="confirm-remaining-points" class="text-lg font-black text-green-600">0</span>
                    <span class="text-xs font-bold text-green-600">Poin</span>
                </div>
            </div>
        </div>

        <!-- Peringatan -->
        <div class="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mb-6">
            <p class="text-xs text-blue-800">
                <span class="font-bold">⚠️ Perhatian:</span> Penukaran poin tidak dapat dibatalkan setelah dikonfirmasi. Pastikan Anda sudah yakin sebelum melanjutkan.
            </p>
        </div>

        <!-- Tombol Aksi -->
        <div class="flex gap-3">
            <button onclick="cancelTukarModal()" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition active:scale-95">
                Batal
            </button>
            <button onclick="proceedToNameInput()" class="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 rounded-xl transition shadow-lg active:scale-95">
                Lanjutkan
            </button>
        </div>
    </div>
</div>

<!-- Modal Input Nama untuk Klaim -->
<div id="name-input-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-[70]">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="flex justify-center mb-6">
            <div class="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
            </div>
        </div>

        <!-- Judul -->
        <h3 class="text-2xl font-bold text-center text-gray-800 mb-2">Data Penerima</h3>
        <p class="text-center text-sm text-gray-500 mb-6">Masukkan nama Anda untuk melengkapi klaim reward</p>

        <!-- Form Input -->
        <div class="mb-6">
            <label class="block text-sm font-semibold text-gray-700 mb-2">Nama Lengkap</label>
            <input 
                type="text" 
                id="claim-name-input" 
                placeholder="Masukkan nama Anda" 
                class="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition text-sm font-medium"
                onkeypress="if(event.key === 'Enter') submitNameAndClaim()"
            >
            <p class="text-xs text-gray-500 mt-2">Nama ini akan digunakan untuk verifikasi klaim reward Anda.</p>
        </div>

        <!-- Tombol Aksi -->
        <div class="flex gap-3">
            <button onclick="backToConfirmModal()" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition active:scale-95">
                Kembali
            </button>
            <button onclick="submitNameAndClaim()" class="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 rounded-xl transition shadow-lg active:scale-95">
                Konfirmasi
            </button>
        </div>
    </div>
</div>
```

---

### 2. Modifikasi File `assets/js/script.js`

Tambahkan fungsi-fungsi baru sebelum closing brace terakhir:

```javascript
/**
 * Variabel global untuk menyimpan data reward sementara
 */
let pendingRewardData = {
    id: null,
    nama: null,
    poin: null,
    gambar: null,
    deskripsi: null
};

/**
 * Tampilkan modal konfirmasi penukaran poin
 * @param {string} rewardId - ID reward dari database
 */
async function showConfirmTukarModal(rewardId) {
    const userPoints = parseFloat(sessionStorage.getItem('user_points')) || 0;
    
    if (!sessionStorage.getItem('reward_phone')) {
        showToast('Mohon cek poin Anda terlebih dahulu.');
        return;
    }

    try {
        // Fetch reward details
        const rewardRes = await fetch(`${API_URL}/search?sheet=tukar_poin&id=${rewardId}`);
        const rewardData = await rewardRes.json();
        
        if (!rewardData || rewardData.length === 0) {
            showToast('Data hadiah tidak ditemukan.');
            return;
        }

        const reward = rewardData[0];
        const requiredPoints = parseFloat(reward.poin) || 0;
        const rewardName = reward.nama || reward.judul || 'Hadiah';

        // Validasi poin cukup
        if (userPoints < requiredPoints) {
            showToast(`Poin Anda tidak cukup. Dibutuhkan ${requiredPoints} poin, saldo Anda ${userPoints.toFixed(1)} poin.`);
            return;
        }

        // Simpan data reward ke variabel global
        pendingRewardData = {
            id: rewardId,
            nama: rewardName,
            poin: requiredPoints,
            gambar: reward.gambar || '',
            deskripsi: reward.deskripsi || ''
        };

        // Update modal dengan data
        document.getElementById('confirm-reward-name').textContent = rewardName;
        document.getElementById('confirm-reward-points').textContent = requiredPoints;
        document.getElementById('confirm-remaining-points').textContent = (userPoints - requiredPoints).toFixed(1);

        // Tampilkan modal
        const modal = document.getElementById('confirm-tukar-modal');
        modal.classList.remove('hidden');
        document.body.classList.add('modal-active');

    } catch (error) {
        console.error('Error showing confirm modal:', error);
        showToast('Terjadi kesalahan saat memproses permintaan Anda.');
    }
}

/**
 * Tutup modal konfirmasi
 */
function cancelTukarModal() {
    const modal = document.getElementById('confirm-tukar-modal');
    modal.classList.add('hidden');
    document.body.classList.remove('modal-active');
    pendingRewardData = { id: null, nama: null, poin: null, gambar: null, deskripsi: null };
}

/**
 * Lanjutkan ke modal input nama
 */
function proceedToNameInput() {
    // Tutup modal konfirmasi
    document.getElementById('confirm-tukar-modal').classList.add('hidden');
    
    // Buka modal input nama
    const nameModal = document.getElementById('name-input-modal');
    nameModal.classList.remove('hidden');
    
    // Focus ke input field
    setTimeout(() => {
        document.getElementById('claim-name-input').focus();
    }, 100);
}

/**
 * Kembali ke modal konfirmasi
 */
function backToConfirmModal() {
    document.getElementById('name-input-modal').classList.add('hidden');
    document.getElementById('confirm-tukar-modal').classList.remove('hidden');
    document.getElementById('claim-name-input').value = '';
}

/**
 * Submit nama dan lanjutkan proses klaim
 */
async function submitNameAndClaim() {
    const customerName = document.getElementById('claim-name-input').value.trim();
    
    if (!customerName) {
        showToast('Mohon masukkan nama Anda terlebih dahulu.');
        return;
    }

    if (customerName.length < 3) {
        showToast('Nama harus minimal 3 karakter.');
        return;
    }

    // Tutup modal
    document.getElementById('name-input-modal').classList.add('hidden');
    document.body.classList.remove('modal-active');

    // Proses klaim dengan data yang sudah dikumpulkan
    await processClaimReward(pendingRewardData.id, customerName);
}

/**
 * Proses klaim reward (logika utama)
 * @param {string} rewardId - ID reward
 * @param {string} customerName - Nama pelanggan
 */
async function processClaimReward(rewardId, customerName) {
    const phone = sessionStorage.getItem('reward_phone');
    const userPoints = parseFloat(sessionStorage.getItem('user_points')) || 0;
    
    try {
        // 1. Get reward details
        const rewardRes = await fetch(`${API_URL}/search?sheet=tukar_poin&id=${rewardId}`);
        const rewardData = await rewardRes.json();
        
        if (!rewardData || rewardData.length === 0) {
            showToast('Data hadiah tidak ditemukan.');
            return;
        }

        const reward = rewardData[0];
        const requiredPoints = parseFloat(reward.poin) || 0;
        const rewardName = reward.nama || reward.judul || 'Hadiah';

        // Validasi final
        if (userPoints < requiredPoints) {
            showToast(`Poin Anda tidak cukup.`);
            return;
        }

        // Show loading state
        showToast('Sedang memproses penukaran...');

        // 2. Deduct points from user_points sheet
        const newPoints = userPoints - requiredPoints;
        const updatePointsRes = await fetch(`${API_URL}/phone/${phone}?sheet=user_points`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: {
                    points: newPoints,
                    last_updated: new Date().toLocaleString('id-ID')
                }
            })
        });

        if (!updatePointsRes.ok) throw new Error('Gagal memotong poin pengguna.');

        // 3. Record claim in claims sheet
        const claimId = 'CLM-' + Date.now().toString().slice(-6);
        const recordClaimRes = await fetch(`${API_URL}?sheet=claims`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: {
                    id: claimId,
                    phone: phone,
                    nama: customerName,
                    hadiah: rewardName,
                    poin: requiredPoints,
                    status: 'Menunggu',
                    tanggal: new Date().toLocaleString('id-ID')
                }
            })
        });

        if (!recordClaimRes.ok) throw new Error('Gagal mencatat data klaim.');

        // 4. Update local state and UI
        sessionStorage.setItem('user_points', newPoints);
        const pointsDisplay = document.querySelector('#points-display h4');
        if (pointsDisplay) {
            pointsDisplay.innerHTML = `${newPoints.toFixed(1)} <span class="text-sm font-bold">Poin</span>`;
        }

        // 5. Send to WhatsApp for notification
        const waMessage = `*KLAIM REWARD POIN BERHASIL*\n\nID Klaim: ${claimId}\nPelanggan: ${customerName}\nNomor WhatsApp: ${phone}\nReward: ${rewardName}\nPoin Ditukar: ${requiredPoints}\nSisa Poin: ${newPoints.toFixed(1)}\n\nMohon segera diproses. Terima kasih!`;
        const waUrl = `https://wa.me/628993370200?text=${encodeURIComponent(waMessage)}`;
        
        showToast('Penukaran poin berhasil! Membuka WhatsApp...');
        
        // Clear pending data
        pendingRewardData = { id: null, nama: null, poin: null, gambar: null, deskripsi: null };
        
        // Small delay before opening WhatsApp
        setTimeout(() => {
            window.open(waUrl, '_blank');
        }, 1500);

    } catch (error) {
        console.error('Error processing claim:', error);
        showToast('Gagal memproses penukaran. Silakan coba lagi.');
    }
}

/**
 * Modifikasi fungsi claimReward yang sudah ada untuk menggunakan modal
 */
async function claimReward(rewardId) {
    showConfirmTukarModal(rewardId);
}
```

---

### 3. Modifikasi Tombol TUKAR di `renderRewardItems()`

Ubah bagian ini di dalam fungsi `renderRewardItems()` (sekitar baris 1283):

**Sebelum:**
```javascript
<button onclick="claimReward('${id}')" class="bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition active:scale-95">
    Tukar
</button>
```

**Sesudah:**
```javascript
<button onclick="showConfirmTukarModal('${id}')" class="bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition active:scale-95">
    Tukar
</button>
```

---

## 🎨 Styling (Optional CSS Enhancement)

Jika ingin menambahkan animasi yang lebih smooth, tambahkan ke `assets/css/style.css`:

```css
/* Modal Animations */
@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@keyframes zoomIn {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

.animate-in {
    animation: fadeIn 0.2s ease-out;
}

.fade-in {
    animation: fadeIn 0.2s ease-out;
}

.zoom-in-95 {
    animation: zoomIn 0.2s ease-out;
}

.duration-200 {
    animation-duration: 0.2s;
}

/* Modal Active State */
body.modal-active {
    overflow: hidden;
}
```

---

## 🧪 Testing Checklist

- [ ] Klik tombol "TUKAR" pada reward item
- [ ] Modal konfirmasi muncul dengan detail yang benar
- [ ] Tombol "Batal" menutup modal tanpa melakukan apa-apa
- [ ] Tombol "Lanjutkan" membuka modal input nama
- [ ] Modal input nama menampilkan nama default (jika ada)
- [ ] Tombol "Kembali" di modal nama kembali ke modal konfirmasi
- [ ] Tombol "Konfirmasi" memproses transaksi dan membuka WhatsApp
- [ ] Poin berkurang setelah transaksi berhasil
- [ ] Validasi: Tidak bisa menukar jika poin tidak cukup
- [ ] Validasi: Tidak bisa submit nama kosong
- [ ] Toast notifications muncul di waktu yang tepat

---

## 📝 Penjelasan Detail

### Modal Konfirmasi
Modal ini menampilkan:
- **Hadiah**: Nama reward yang akan ditukar
- **Poin Ditukar**: Jumlah poin yang akan dikurangi
- **Sisa Poin**: Jumlah poin setelah transaksi
- **Peringatan**: Reminder bahwa transaksi tidak bisa dibatalkan

### Modal Input Nama
Modal ini meminta:
- **Nama Lengkap**: Nama penerima reward untuk verifikasi
- Validasi minimal 3 karakter
- Support Enter key untuk submit

### Alur Proses
1. User klik "TUKAR" → `showConfirmTukarModal()` dipanggil
2. Fetch data reward dari API
3. Tampilkan modal konfirmasi dengan detail
4. User klik "Lanjutkan" → Buka modal input nama
5. User masukkan nama → Klik "Konfirmasi"
6. Jalankan `processClaimReward()` untuk:
   - Potong poin dari database
   - Catat klaim di sheet claims
   - Update UI lokal
   - Buka WhatsApp dengan pesan notifikasi

---

## 🔧 Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Modal tidak muncul | Pastikan ID modal (`confirm-tukar-modal`, `name-input-modal`) sudah benar di HTML |
| Data reward tidak muncul | Cek console untuk error API, pastikan `API_URL` sudah dikonfigurasi |
| Tombol tidak responsif | Pastikan fungsi JavaScript sudah di-load sebelum DOM ready |
| Poin tidak berkurang | Cek respons PATCH ke SheetDB, pastikan format data sesuai |
| WhatsApp tidak terbuka | Gunakan `window.open()` dengan target `_blank` |

---

## 📚 Referensi
- Dokumentasi SheetDB: https://sheetdb.io/docs
- WhatsApp Web API: https://www.whatsapp.com/business/downloads/links/guide_for_obtaining_a_whatsapp_business_account_id.pdf

---

**Dibuat:** 15 Januari 2026  
**Versi:** 1.0  
**Status:** Ready for Implementation
