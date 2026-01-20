# Panduan Implementasi: Program Referral Sederhana (MVP)

## 📋 Ringkasan

Dokumen ini menjelaskan cara mengimplementasikan **program referral yang sederhana dan efektif** (Minimum Viable Product) untuk **paketsembako.com**. Fokus utama adalah kemudahan implementasi dengan dampak maksimal untuk pertumbuhan organik.

**Tanggal:** 2026-01-20  
**Filosofi:** MVP, Simple, Manual, Low-Effort, High-Impact

---

## 🎯 Konsep & Alur Kerja

Sistem ini melibatkan dua pihak:

| Pihak | Deskripsi | Keuntungan |
|---|---|---|
| **Referrer (Pengajak)** | Pelanggan yang sudah ada | Mendapat **Poin Reward** |
| **Referee (Yang Diajak)** | Pelanggan baru | Mendapat **Diskon Langsung** |

### **Alur Kerja Sederhana:**

```
1. Referrer (User A) membagikan link unik
   (e.g., https://paketsembako.com/?ref=6281234567890)
   ↓
2. Referee (User B) klik link & belanja
   (Kode referral disimpan di browser)
   ↓
3. Saat checkout, User B dapat diskon otomatis
   (e.g., Potongan Rp 5.000)
   ↓
4. Saat User B kirim pesanan via WhatsApp, kode referral ikut terkirim
   (e.g., "...&ref=6281234567890")
   ↓
5. Admin verifikasi & tambah poin manual ke User A
```

---

## 🛠️ Implementasi Teknis (MVP)

### **Step 1: Membuat Link Referral (Tanpa Database)**

Kita akan menggunakan **nomor WhatsApp pengguna sebagai kode referral unik**. Ini menghilangkan kebutuhan untuk membuat sistem kode yang kompleks.

**Contoh Link:**
```
https://paketsembako.com/?ref=6281234567890
```

**Tugas:**
- Tambahkan section "Ajak Teman" di halaman profil pengguna (jika ada).
- Tampilkan link referral unik mereka.
- Sediakan tombol "Salin Link" dan "Bagikan ke WhatsApp".

**Contoh HTML:**
```html
<div id="referral-section" class="bg-white p-4 rounded-lg shadow">
    <h3 class="font-bold text-lg">Ajak Teman & Dapatkan Poin!</h3>
    <p class="text-sm text-gray-600">Bagikan link di bawah dan dapatkan 100 poin untuk setiap teman yang belanja.</p>
    <div class="mt-2 flex">
        <input type="text" id="referral-link" class="w-full p-2 border rounded-l-md bg-gray-100" readonly>
        <button onclick="copyReferralLink()" class="bg-blue-500 text-white px-4 rounded-r-md">Salin</button>
    </div>
</div>
```

**Contoh JavaScript (untuk menampilkan link):**
```javascript
// Asumsikan nomor WA user disimpan di localStorage saat login
const userPhoneNumber = localStorage.getItem("user_phone");
if (userPhoneNumber) {
    const referralLink = `https://paketsembako.com/?ref=${userPhoneNumber}`;
    document.getElementById("referral-link").value = referralLink;
}

function copyReferralLink() {
    const linkInput = document.getElementById("referral-link");
    linkInput.select();
    document.execCommand("copy");
    alert("Link berhasil disalin!");
}
```

---

### **Step 2: Tracking Kode Referral**

Saat pengguna baru datang dengan parameter `?ref=...`, kita simpan kode referral di `localStorage`.

**Tambahkan di `assets/js/script.js` (paling atas):**
```javascript
// Handle Referral Code
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get("ref");

    if (refCode) {
        // Simpan kode referral jika belum pernah ada order
        // (Ini mencegah user me-refer diri sendiri di order berikutnya)
        if (!localStorage.getItem("has_ordered")) {
            localStorage.setItem("referral_code", refCode);
            console.log(`Referral code saved: ${refCode}`);
        }
    }
});
```

---

### **Step 3: Beri Diskon ke Referee (Yang Diajak)**

Saat checkout, periksa `localStorage` dan berikan diskon jika ada kode referral.

**Modifikasi fungsi `updateCart()` di `assets/js/script.js`:**
```javascript
function updateCart() {
    // ... (kode yang sudah ada)

    let total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let referralDiscount = 0;
    const refCode = localStorage.getItem("referral_code");

    // Cek jika ini order pertama & ada kode referral
    if (refCode && !localStorage.getItem("has_ordered")) {
        referralDiscount = 5000; // Diskon Rp 5.000
        total -= referralDiscount;

        // Tampilkan pesan diskon
        document.getElementById("referral-discount-row").classList.remove("hidden");
        document.getElementById("referral-discount-amount").innerText = `-Rp ${referralDiscount.toLocaleString("id-ID")}`;
    } else {
        document.getElementById("referral-discount-row").classList.add("hidden");
    }

    // ... (update total, dll)
}
```

**Tambahkan di `index.html` (di dalam modal keranjang):**
```html
<!-- Di atas baris Total -->
<div id="referral-discount-row" class="hidden flex justify-between items-center mb-2">
    <span class="text-green-600 font-semibold">Diskon Teman</span>
    <span id="referral-discount-amount" class="text-green-600 font-semibold"></span>
</div>
```

---

### **Step 4: Kirim Kode Referral ke Admin (via WhatsApp)**

Saat tombol "Pesan via WhatsApp" diklik, tambahkan kode referral ke pesan.

**Modifikasi fungsi `sendOrderToWhatsApp()` di `assets/js/script.js`:**
```javascript
function sendOrderToWhatsApp() {
    // ... (kode yang sudah ada untuk membuat pesan)

    const refCode = localStorage.getItem("referral_code");
    if (refCode && !localStorage.getItem("has_ordered")) {
        message += `\n\nKode Referral: ${refCode}`;
    }

    // ... (buka link WhatsApp)

    // Tandai bahwa user sudah pernah order
    localStorage.setItem("has_ordered", "true");
}
```

**Alur Admin:**
1. Admin menerima pesanan WhatsApp dengan "Kode Referral: 6281234567890".
2. Admin membuka sheet `users`.
3. Admin mencari user dengan nomor `6281234567890`.
4. Admin menambahkan poin reward (misal: +100 poin) ke kolom `points` user tersebut.

---

## ✅ Keuntungan Sistem MVP Ini

- **Cepat Diimplementasikan:** Bisa selesai dalam beberapa jam.
- **Tidak Perlu Backend:** Semua logika ada di frontend (JavaScript).
- **Tidak Perlu Database Baru:** Cukup manfaatkan `localStorage` dan proses manual.
- **User Experience Baik:** Diskon otomatis untuk pengguna baru.
- **Tracking Sederhana:** Admin mudah verifikasi via WhatsApp.

## ⚠️ Keterbatasan

- **Reward Manual:** Admin perlu input poin secara manual.
- **Potensi Fraud:** User bisa me-refer diri sendiri dengan nomor berbeda (tapi effort-nya cukup besar).
- **Tracking Terbatas:** Hanya melacak konversi pertama.

---

## 🚀 Langkah Selanjutnya (Setelah MVP Sukses)

Jika program ini berhasil, pertimbangkan untuk:
1. **Otomatisasi Reward Referrer:** Gunakan API untuk update poin secara otomatis.
2. **Dashboard Referral:** Buat halaman untuk user melihat status referral mereka.
3. **Anti-Fraud Lebih Canggih:** Cek IP address atau device ID.
4. **Tiered Rewards:** Beri bonus lebih besar untuk referral yang lebih banyak.

---

**Kesimpulan:** Ini adalah cara paling efisien untuk meluncurkan program referral dan mulai mendorong pertumbuhan organik **sekarang juga**!
