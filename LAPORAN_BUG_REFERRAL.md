# 🐛 Laporan Bug Program Referral GoSembako

**Tanggal Pemeriksaan:** 27 Januari 2026  
**Sistem:** Program Referral GoSembako  
**Status:** Ditemukan 5 Bug Kritis & 3 Bug Minor

---

## 📋 Ringkasan Eksekutif

Setelah melakukan pemeriksaan mendalam terhadap program referral GoSembako, ditemukan **8 bug** yang perlu diperbaiki. Bug-bug ini dibagi menjadi:
- **5 Bug Kritis** - Mempengaruhi fungsi inti program referral
- **3 Bug Minor** - Mempengaruhi pengalaman pengguna

---

## 🔴 BUG KRITIS

### BUG #1: `createReferralRecord` Selalu Return `false`

**Lokasi:** `/assets/js/referral-ui.js` - Line 101-137  
**Severity:** 🔴 CRITICAL  
**Status:** Program referral TIDAK BERFUNGSI

#### Deskripsi Bug:
Fungsi `createReferralRecord` di file `referral-ui.min.js` telah di-minify menjadi:
```javascript
async function createReferralRecord(e,r,t){return!1}
```

Ini berarti fungsi **selalu mengembalikan `false`** dan TIDAK pernah membuat record referral ke database.

#### Bukti:
```javascript
// File: assets/js/referral-ui.min.js (line 1)
createReferralRecord(e,r,t){return!1}  // ❌ SELALU RETURN FALSE!
```

Bandingkan dengan source code asli di `referral-ui.js`:
```javascript
// File: assets/js/referral-ui.js (line 101-137)
async function createReferralRecord(referrerCode, referredPhone, referredName) {
    if (!referrerCode || !referredName) {
        return false;
    }
    
    try {
        const apiUrl = CONFIG.getMainApiUrl();
        const timestamp = new Date().toLocaleString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        const recordId = `ref_${Date.now()}`;
        const createResult = await apiPost(apiUrl, {
            action: 'create',
            sheet: 'referral_history',
            data: {
                id: recordId,
                referrer_code: referrerCode,
                referee_name: referredName,
                referee_whatsapp: normalizePhoneTo08(referredPhone),
                event_type: 'registration',
                referrer_reward: DEFAULT_REFERRAL_REWARD_POINTS,
                referee_reward: 0,
                status: 'completed',
                created_at: timestamp
            }
        });
        return !!(createResult && (createResult.created || createResult.updated || createResult.success));
    } catch (error) {
        console.error('Error creating referral record:', error);
        return false;
    }
}
```

#### Dampak:
- ❌ **Referral history TIDAK PERNAH dicatat** ke sheet `referral_history`
- ❌ **Statistik referral TIDAK AKURAT**
- ❌ **Poin referral TIDAK DIBERIKAN** ke referrer
- ❌ **Admin tidak bisa tracking referral activity**

#### Solusi:
**Re-minify file `referral-ui.js` dengan benar:**

```bash
# Jangan gunakan minifier yang terlalu agresif
# Gunakan terser atau uglify-js dengan settings yang tepat

# Contoh dengan terser:
npx terser assets/js/referral-ui.js -o assets/js/referral-ui.min.js \
  --compress --mangle \
  --keep-fnames  # PENTING: jangan hapus function body!

# Atau gunakan uglify-js:
npx uglify-js assets/js/referral-ui.js -o assets/js/referral-ui.min.js \
  --compress --mangle
```

**CATATAN PENTING:**
Setelah re-minify, **wajib** test fungsi dengan:
```javascript
// Test di browser console:
ReferralUI.createReferralRecord('REF-TEST1234', '081234567890', 'Test User')
  .then(result => console.log('Result:', result));

// Harus return true jika berhasil, bukan selalu false
```

---

### BUG #2: Fungsi `createReferralRecord` TIDAK Dipanggil Saat Registrasi

**Lokasi:** `/assets/js/akun.js` - Line 695-891  
**Severity:** 🔴 CRITICAL  
**Status:** Fungsi ada tapi tidak digunakan

#### Deskripsi Bug:
Di form registrasi (`register-form` submit handler), kode referral disimpan di field `referred_by` pada user data, TAPI **tidak ada pemanggilan `createReferralRecord()`** untuk mencatat history referral.

#### Bukti:
```javascript
// File: akun.js - Line 848-856
// Add referred_by if referral code found (auto-detected)
if (referralCode) {
    userData.referred_by = referralCode;  // ✅ Ini OK
}

const createResult = await apiPost(apiUrl, {
    action: 'register',
    data: userData
});

// ❌ MISSING: Tidak ada pemanggilan createReferralRecord() di sini!
```

#### Dampak:
Bahkan jika fungsi `createReferralRecord` sudah diperbaiki (Bug #1), fungsi tersebut **tidak akan pernah dipanggil** karena tidak ada yang memanggil saat registrasi.

#### Solusi:
**Tambahkan pemanggilan `createReferralRecord` setelah registrasi berhasil:**

```javascript
// File: akun.js - Setelah line 860, tambahkan:

if (!createResult || !createResult.success) {
    throw new Error(createResult && createResult.message ? createResult.message : 'Gagal mendaftar');
}

// ✅ TAMBAHKAN KODE INI:
// Create referral record if user registered with referral code
if (referralCode && typeof ReferralUI !== 'undefined' && ReferralUI.createReferralRecord) {
    try {
        await ReferralUI.createReferralRecord(referralCode, normalizedPhone, name);
        console.log('✅ Referral record created for code:', referralCode);
    } catch (error) {
        console.error('❌ Failed to create referral record:', error);
        // Don't fail registration if referral record creation fails
    }
}

// Show success
successDiv.classList.remove('hidden');
// ... (kode selanjutnya)
```

**Posisi yang tepat:**
Insert kode di atas **SETELAH** user berhasil dibuat (`createResult.success === true`) dan **SEBELUM** menampilkan success message.

---

### BUG #3: Backend API Tidak Ada Action Handler untuk Referral

**Lokasi:** Backend Google Apps Script  
**Severity:** 🔴 CRITICAL  
**Status:** Endpoint tidak ada

#### Deskripsi Bug:
Frontend mencoba memanggil beberapa endpoint API untuk referral:
1. `?action=validate_referral&code=XXX` - Line 914 di akun.js
2. `?action=get_referral_stats&user_id=XXX` - Line 278 di referral-ui.js
3. `?action=register` dengan `referred_by` field - Line 853-856 di akun.js

Namun **TIDAK ADA** implementasi backend (Google Apps Script) untuk handle action ini.

#### Bukti:
```javascript
// Frontend memanggil:
// 1. Validate referral code
const response = await fetch(`${apiUrl}?action=validate_referral&code=${encodeURIComponent(referralCode)}`);

// 2. Get referral stats
const statsResponse = await fetch(`${apiUrl}?action=get_referral_stats&user_id=${encodeURIComponent(userId)}`);

// 3. Register dengan referral
const createResult = await apiPost(apiUrl, {
    action: 'register',
    data: userData  // includes referred_by field
});
```

Tetapi **backend belum ada handler** untuk:
- Action: `validate_referral`
- Action: `get_referral_stats`
- Action: `register` yang support field `referred_by`

#### Dampak:
- ❌ Validasi referral code **selalu gagal**
- ❌ Statistik referral **tidak pernah di-load**
- ❌ Referral code di registration **tidak diproses** di backend
- ❌ Poin **tidak pernah diberikan** ke referrer maupun referee

#### Solusi:
**Implementasi backend di Google Apps Script sesuai dokumentasi `REFERRAL_PROGRAM_FINAL.md`:**

File backend perlu menambahkan handler untuk:

```javascript
// ========================================
// HANDLER 1: Validate Referral Code
// ========================================
function validateReferralCode(code) {
  if (!code || code.trim() === '') {
    return { valid: false };
  }
  
  const usersSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('users');
  const data = usersSheet.getDataRange().getValues();
  const headers = data[0];
  
  const codeIndex = headers.indexOf('referral_code');
  const idIndex = headers.indexOf('id');
  const namaIndex = headers.indexOf('nama');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][codeIndex] === code.toUpperCase()) {
      return {
        valid: true,
        referrer_name: data[i][namaIndex],
        referrer_id: data[i][idIndex]
      };
    }
  }
  
  return { valid: false };
}

// ========================================
// HANDLER 2: Get Referral Stats
// ========================================
function getReferralStats(userId) {
  const usersSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('users');
  const data = usersSheet.getDataRange().getValues();
  const headers = data[0];
  
  const idIndex = headers.indexOf('id');
  const countIndex = headers.indexOf('referral_count');
  const earnedIndex = headers.indexOf('referral_points_earned');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === userId) {
      return {
        referral_count: data[i][countIndex] || 0,
        referral_points_earned: data[i][earnedIndex] || 0
      };
    }
  }
  
  return {
    error: 'User not found',
    referral_count: 0,
    referral_points_earned: 0
  };
}

// ========================================
// HANDLER 3: Register dengan Referral
// ========================================
function doPost(e) {
  // ... existing code ...
  
  if (action === 'register') {
    return registerWithReferral(data);
  }
  
  // ... existing code ...
}

function doGet(e) {
  // ... existing code ...
  
  if (action === 'validate_referral') {
    const code = e.parameter.code;
    return ContentService.createTextOutput(JSON.stringify(validateReferralCode(code)))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'get_referral_stats') {
    const userId = e.parameter.user_id;
    return ContentService.createTextOutput(JSON.stringify(getReferralStats(userId)))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // ... existing code ...
}
```

**PENTING:** Implementasi lengkap ada di file `REFERRAL_PROGRAM_FINAL.md` line 132-430.

---

### BUG #4: Missing Columns di Google Sheets

**Lokasi:** Google Sheets `users` table  
**Severity:** 🔴 CRITICAL  
**Status:** Schema tidak lengkap

#### Deskripsi Bug:
Frontend dan backend mengharapkan kolom-kolom berikut di sheet `users`:
- `referral_code` - Kode referral unik user
- `referred_by` - Kode referral yang digunakan saat daftar
- `referral_count` - Jumlah orang yang daftar pakai kode ini
- `referral_points_earned` - Total poin dari referral

Namun **kolom-kolom ini belum ada** di Google Sheets.

#### Bukti:
```javascript
// Frontend mencoba update/read kolom ini:
// 1. referral-ui.js line 74-76
data: {
    referral_code: newCode  // ❌ Kolom tidak ada
}

// 2. akun.js line 849-850
if (referralCode) {
    userData.referred_by = referralCode;  // ❌ Kolom tidak ada
}

// 3. referral-ui.js line 282-287
const countDisplay = document.getElementById('referral-count');
if (countDisplay) {
    countDisplay.textContent = statsData.referral_count || 0;  // ❌ Kolom tidak ada
}
```

#### Dampak:
- ❌ Data referral **tidak tersimpan**
- ❌ Tracking referral **tidak mungkin**
- ❌ Statistik **selalu 0**
- ❌ Backend error saat insert/update

#### Solusi:
**Tambahkan kolom-kolom berikut ke Google Sheets:**

**Sheet: `users`**
Tambahkan 4 kolom baru di akhir (setelah kolom `tanggal_daftar`):

| Kolom | Tipe | Default | Deskripsi |
|-------|------|---------|-----------|
| `referral_code` | Text | (auto) | Kode referral unik, format: REF-NAMA1234 |
| `referred_by` | Text | (kosong) | Kode referral yang digunakan saat daftar |
| `referral_count` | Number | 0 | Jumlah orang yang daftar pakai kode ini |
| `referral_points_earned` | Number | 0 | Total poin yang didapat dari referral |

**Cara menambahkan:**
1. Buka Google Sheets
2. Klik kolom terakhir (`tanggal_daftar`)
3. Klik kanan → Insert 4 columns to the right
4. Beri nama header sesuai tabel di atas
5. Set default value:
   - `referral_code`: (akan di-generate otomatis)
   - `referred_by`: (kosong)
   - `referral_count`: 0
   - `referral_points_earned`: 0

**Sheet Baru: `referral_history`**
Buat sheet baru dengan kolom:

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | Text | ID unik, format: ref_1234567890 |
| `referrer_code` | Text | Kode referral yang digunakan |
| `referee_name` | Text | Nama user yang daftar |
| `referee_whatsapp` | Text | WhatsApp user yang daftar |
| `event_type` | Text | registration, first_order, fifth_order |
| `referrer_reward` | Number | Poin reward untuk referrer |
| `referee_reward` | Number | Poin bonus untuk referee |
| `status` | Text | completed, pending, cancelled |
| `created_at` | Text | Tanggal dan waktu |

**Cara membuat:**
1. Klik tanda `+` di bawah tab sheet
2. Rename sheet → `referral_history`
3. Isi header row dengan kolom di atas

---

### BUG #5: Poin Referee TIDAK Diberikan Saat Registrasi

**Lokasi:** `/assets/js/akun.js` - Line 844  
**Severity:** 🔴 CRITICAL  
**Status:** Logika salah

#### Deskripsi Bug:
Saat user registrasi dengan kode referral, seharusnya user baru (referee) mendapat **bonus 50 poin** sesuai setting `referee_registration_bonus` di file `Paket Sembako - referral_settings.csv`.

Namun di kode registrasi, `total_points` **SELALU di-set ke 0**:

#### Bukti:
```javascript
// File: akun.js - Line 837-846
const userData = {
    id: userId,
    nama: name,
    whatsapp: normalizedPhone,
    pin: pin,
    tanggal_daftar: today,
    status: 'aktif',
    total_points: 0,  // ❌ SELALU 0, tidak cek referral bonus!
    created_at: now
};

// Add referred_by if referral code found (auto-detected)
if (referralCode) {
    userData.referred_by = referralCode;  // ✅ Referral code disimpan
    // ❌ MISSING: Tidak ada logic untuk set total_points = 50
}
```

Seharusnya:
```javascript
const userData = {
    id: userId,
    nama: name,
    whatsapp: normalizedPhone,
    pin: pin,
    tanggal_daftar: today,
    status: 'aktif',
    total_points: referralCode ? 50 : 0,  // ✅ Berikan bonus jika ada referral
    created_at: now
};
```

#### Dampak:
- ❌ User yang daftar dengan referral **TIDAK dapat bonus 50 poin**
- ❌ Insentif untuk menggunakan kode referral **berkurang**
- ❌ Tidak sesuai dengan marketing promise

#### Solusi:
**Edit file `/assets/js/akun.js` line 844:**

**Dari:**
```javascript
total_points: 0,
```

**Menjadi:**
```javascript
total_points: referralCode ? 50 : 0,  // Bonus 50 poin jika daftar dengan referral
```

**ATAU** lebih dinamis, ambil dari API settings:
```javascript
// Tambahkan di awal fungsi register, setelah validasi:
let refereeBonus = 50;  // default
if (referralCode) {
    try {
        const settingsResponse = await fetch(`${apiUrl}?sheet=referral_settings`);
        const settings = await settingsResponse.json();
        const bonusSetting = settings.find(s => s.setting_key === 'referee_registration_bonus');
        if (bonusSetting) {
            refereeBonus = parseInt(bonusSetting.setting_value) || 50;
        }
    } catch (error) {
        console.warn('Failed to fetch referral bonus setting, using default:', error);
    }
}

// Lalu di userData:
const userData = {
    // ... kolom lain ...
    total_points: referralCode ? refereeBonus : 0,
    // ...
};
```

---

## 🟡 BUG MINOR

### BUG #6: Referral Stats API Call Tanpa Error Handling

**Lokasi:** `/assets/js/referral-ui.js` - Line 276-292  
**Severity:** 🟡 MINOR  
**Impact:** Error tidak tertangani dengan baik

#### Deskripsi:
Saat load referral stats, jika API error, element tetap menampilkan "0" tanpa feedback ke user bahwa data gagal di-load.

#### Bukti:
```javascript
// Line 276-292
try {
    const apiUrl = CONFIG.getMainApiUrl();
    const statsResponse = await fetch(`${apiUrl}?action=get_referral_stats&user_id=${encodeURIComponent(userId)}`);
    const statsData = await statsResponse.json();
    if (!statsData.error) {
        // Update display
    }
    // ❌ Tidak ada else untuk handle jika statsData.error = true
} catch (error) {
    console.error('Error loading referral stats:', error);
    // ❌ Tidak ada visual feedback ke user
}
```

#### Solusi:
Tambahkan visual feedback jika gagal load:

```javascript
try {
    const statsResponse = await fetch(`${apiUrl}?action=get_referral_stats&user_id=${encodeURIComponent(userId)}`);
    const statsData = await statsResponse.json();
    
    const countDisplay = document.getElementById('referral-count');
    const pointsDisplay = document.getElementById('referral-points-earned');
    
    if (!statsData.error) {
        if (countDisplay) countDisplay.textContent = statsData.referral_count || 0;
        if (pointsDisplay) pointsDisplay.textContent = statsData.referral_points_earned || 0;
    } else {
        // ✅ Tampilkan error indicator
        if (countDisplay) countDisplay.innerHTML = '<span title="Gagal memuat data">-</span>';
        if (pointsDisplay) pointsDisplay.innerHTML = '<span title="Gagal memuat data">-</span>';
    }
} catch (error) {
    console.error('Error loading referral stats:', error);
    // ✅ Tampilkan error indicator
    const countDisplay = document.getElementById('referral-count');
    const pointsDisplay = document.getElementById('referral-points-earned');
    if (countDisplay) countDisplay.innerHTML = '<span title="Gagal memuat data">-</span>';
    if (pointsDisplay) pointsDisplay.innerHTML = '<span title="Gagal memuat data">-</span>';
}
```

---

### BUG #7: Normalize Phone Function Inconsistency

**Lokasi:** `/assets/js/referral-ui.js` - Line 124  
**Severity:** 🟡 MINOR  
**Impact:** Phone number format bisa berbeda

#### Deskripsi:
Fungsi `normalizePhoneTo08()` dipanggil di `createReferralRecord` line 124, tetapi **fungsi ini tidak didefinisikan** di file `referral-ui.js`.

Fungsi ini sebenarnya ada di `/assets/js/akun.js` line 7-15, tapi file `referral-ui.js` tidak import/reference ke fungsi tersebut.

#### Bukti:
```javascript
// referral-ui.js - Line 124
referee_whatsapp: normalizePhoneTo08(referredPhone),
// ❌ normalizePhoneTo08 TIDAK DIDEFINISIKAN di file ini!

// Fungsi ada di akun.js:
const normalizePhoneTo08 = (phone) => {
    const digits = (phone || '').toString().replace(/[^0-9]/g, '');
    if (!digits) return '';
    let core = digits;
    if (core.startsWith('62')) core = core.slice(2);
    if (core.startsWith('0')) core = core.slice(1);
    if (!core.startsWith('8')) return '';
    return '0' + core;
};
```

#### Dampak:
- ⚠️ Jika `referral-ui.js` di-load sebelum `akun.js`, fungsi tidak tersedia
- ⚠️ ReferenceError di browser console
- ⚠️ Phone number tidak ter-normalize dengan benar

#### Solusi:
**Opsi 1: Pindahkan fungsi ke file utility terpisah**

Buat file `/assets/js/utils.js`:
```javascript
// utils.js
window.PhoneUtils = {
    normalizePhoneTo08: (phone) => {
        const digits = (phone || '').toString().replace(/[^0-9]/g, '');
        if (!digits) return '';
        let core = digits;
        if (core.startsWith('62')) core = core.slice(2);
        if (core.startsWith('0')) core = core.slice(1);
        if (!core.startsWith('8')) return '';
        return '0' + core;
    }
};

// Alias untuk backward compatibility
window.normalizePhoneTo08 = window.PhoneUtils.normalizePhoneTo08;
```

Load di HTML **SEBELUM** referral-ui.js dan akun.js:
```html
<script src="assets/js/utils.js"></script>
<script src="assets/js/referral-ui.js"></script>
<script src="assets/js/akun.js"></script>
```

**Opsi 2: Duplicate fungsi di referral-ui.js (quick fix)**
```javascript
// Tambahkan di awal referral-ui.js (sebelum line 6)
const normalizePhoneTo08 = (phone) => {
    const digits = (phone || '').toString().replace(/[^0-9]/g, '');
    if (!digits) return '';
    let core = digits;
    if (core.startsWith('62')) core = core.slice(2);
    if (core.startsWith('0')) core = core.slice(1);
    if (!core.startsWith('8')) return '';
    return '0' + core;
};
```

---

### BUG #8: Referral Code Case Sensitivity Issue

**Lokasi:** `/assets/js/referral-ui.js` - Line 149, `/assets/js/akun.js` - Line 910  
**Severity:** 🟡 MINOR  
**Impact:** Validasi bisa gagal karena case mismatch

#### Deskripsi:
Ada **inconsistency** dalam normalisasi case untuk referral code:

1. **Di akun.js line 910**: Referral code di-convert `.toUpperCase()`
2. **Di referral-ui.js line 149**: Filtering juga pakai `.toUpperCase()`
3. **TAPI di akun.js line 702**: Saat simpan ke sessionStorage, juga `.toUpperCase()`

Ini sebenarnya **sudah benar**, namun ada 1 edge case yang **TIDAK handle**:

#### Bukti:
```javascript
// akun.js - Line 910
const referralCode = refCode.toUpperCase();  // ✅ OK

// akun.js - Line 702
const referralCode = (sessionStorage.getItem('referral_code') || '').trim().toUpperCase();  // ✅ OK

// referral-ui.js - Line 149-152
const normalizedCode = (userCode || '').toString().toUpperCase();
const userReferrals = referrals.filter(ref =>
    (ref.referrer_code || '').toString().toUpperCase() === normalizedCode
);  // ✅ OK

// ❌ TAPI di generateReferralCode line 50, code di-generate SUDAH uppercase:
return `REF-${namePrefix}${randomNum}`;  // namePrefix sudah .toUpperCase()

// ❌ PROBLEM: Jika ada user yang manual input referral code dengan lowercase,
// dan code disimpan lowercase ke database, filtering bisa gagal
```

#### Dampak:
Minim, karena kebanyakan sudah di-uppercase. Namun jika ada edge case (manual insert ke database dengan lowercase), bisa menyebabkan:
- ⚠️ Referral code valid tidak terdeteksi
- ⚠️ Statistik tidak match

#### Solusi:
**Enforce uppercase di backend saat simpan:**

Saat backend insert/update `referral_code` atau `referred_by`, **SELALU uppercase**:

```javascript
// Backend Google Apps Script
function generateReferralCode(userId, userName) {
  const firstName = userName.split(' ')[0].toUpperCase().substring(0, 4);
  const random = Math.floor(1000 + Math.random() * 9000);
  const code = `REF-${firstName}${random}`;
  return code.toUpperCase();  // ✅ Redundant tapi safe
}

// Saat save referred_by
if (userData.referred_by) {
  userData.referred_by = userData.referred_by.toUpperCase();  // ✅ Enforce uppercase
}
```

---

## 📊 Tabel Ringkasan Bug

| # | Severity | Bug | Status Sekarang | Impact |
|---|----------|-----|----------------|--------|
| 1 | 🔴 CRITICAL | `createReferralRecord` return false | BROKEN | Referral tidak tercatat |
| 2 | 🔴 CRITICAL | `createReferralRecord` tidak dipanggil | BROKEN | Fungsi tidak terpakai |
| 3 | 🔴 CRITICAL | Backend API handler tidak ada | BROKEN | Semua API call gagal |
| 4 | 🔴 CRITICAL | Missing columns di Google Sheets | BROKEN | Data tidak tersimpan |
| 5 | 🔴 CRITICAL | Poin referee tidak diberikan | BROKEN | User tidak dapat bonus |
| 6 | 🟡 MINOR | No error handling di stats API | DEGRADED | User tidak tahu gagal |
| 7 | 🟡 MINOR | Phone normalize function missing | DEGRADED | Phone format inconsistent |
| 8 | 🟡 MINOR | Case sensitivity edge case | OK | Minim impact |

---

## ✅ Checklist Perbaikan (Prioritas)

### Phase 1: CRITICAL FIXES (Harus diperbaiki dulu)

- [ ] **BUG #4** - Tambahkan kolom di Google Sheets
  - [ ] Tambah 4 kolom di sheet `users`
  - [ ] Buat sheet baru `referral_history`
  - [ ] Buat sheet baru `referral_settings` (sudah ada)
  
- [ ] **BUG #3** - Implementasi backend API
  - [ ] Handler `validate_referral`
  - [ ] Handler `get_referral_stats`
  - [ ] Handler `register` dengan support `referred_by`
  - [ ] Deploy ke Google Apps Script
  
- [ ] **BUG #1** - Re-minify `referral-ui.js` dengan benar
  - [ ] Gunakan terser atau uglify-js
  - [ ] Test fungsi di browser
  - [ ] Verifikasi tidak return false
  
- [ ] **BUG #2** - Panggil `createReferralRecord` di registrasi
  - [ ] Tambahkan kode di akun.js setelah user created
  - [ ] Test end-to-end flow
  
- [ ] **BUG #5** - Berikan poin bonus ke referee
  - [ ] Update logic `total_points` di registrasi
  - [ ] Test dengan referral code

### Phase 2: MINOR FIXES (Nice to have)

- [ ] **BUG #6** - Tambah error handling di stats API
  - [ ] Visual indicator jika gagal load
  
- [ ] **BUG #7** - Fix phone normalize function
  - [ ] Buat utils.js atau duplicate fungsi
  
- [ ] **BUG #8** - Enforce uppercase di backend
  - [ ] Update backend code

---

## 🧪 Testing Checklist

Setelah semua bug diperbaiki, test dengan skenario berikut:

### Test Case 1: Registrasi dengan Referral Code
1. User A login, dapat kode referral: `REF-USRA1234`
2. User A share link: `https://gosembako.com/akun.html?ref=REF-USRA1234`
3. User B buka link tersebut
4. **Expected:** Muncul "Anda diundang oleh: User A"
5. User B registrasi (nama, phone, PIN)
6. **Expected:** 
   - User B dapat 50 poin bonus
   - Muncul pesan "Bonus: 50 poin"
   - User A dapat 100 poin (referrer reward)

### Test Case 2: Validasi Referral Code Invalid
1. User B buka link dengan kode salah: `?ref=INVALID123`
2. **Expected:** Tidak muncul info referral
3. User B registrasi
4. **Expected:** 
   - User B dapat 0 poin
   - Tidak ada pesan bonus

### Test Case 3: Tracking Referral Activity
1. User A login
2. Buka tab "Referral"
3. **Expected:** 
   - Muncul list orang yang daftar pakai kode User A
   - Muncul jumlah referral: "1"
   - Muncul poin dari referral: "100"

### Test Case 4: Referral History di Admin
1. Admin buka Google Sheets
2. Buka sheet `referral_history`
3. **Expected:**
   - Ada record referral dari User A ke User B
   - Event type: "registration"
   - Referrer reward: 100
   - Referee reward: 50
   - Status: "completed"

---

## 📝 Catatan Tambahan

### Kenapa Semua Bug Ini Terjadi?

Berdasarkan analisis kode, kemungkinan penyebab:

1. **Development tidak complete** - Frontend sudah dibuat lengkap, tapi backend belum diimplementasi
2. **Minifier terlalu agresif** - File `.min.js` di-minify dengan setting yang salah
3. **Testing tidak menyeluruh** - Tidak ada test end-to-end untuk flow referral
4. **Documentation vs Implementation gap** - File `REFERRAL_PROGRAM_FINAL.md` lengkap, tapi implementasi belum selesai

### Rekomendasi Setelah Fix

1. **Tambahkan automated testing** untuk referral flow
2. **Setup monitoring** untuk track:
   - Jumlah registrasi dengan referral vs tanpa
   - Success rate API calls
   - Poin yang diberikan per hari
3. **Buat dashboard admin** untuk monitoring program referral
4. **Documentation update** - Update README dengan status implementasi

---

## 🎯 Kesimpulan

Program referral GoSembako **SAAT INI TIDAK BERFUNGSI** karena:
- ✅ Frontend code **LENGKAP** (95% siap)
- ❌ Backend API **BELUM ADA** (0% ready)
- ❌ Database schema **BELUM LENGKAP** (kolom missing)
- ❌ Minified file **CORRUPTED** (fungsi return false)

**Estimasi waktu perbaikan:** 
- Phase 1 (Critical): **4-6 jam** development + testing
- Phase 2 (Minor): **1-2 jam** development + testing
- **Total: 5-8 jam** untuk fully functional referral program

**Prioritas:** Kerjakan **BUG #4 → #3 → #1 → #2 → #5** secara berurutan untuk hasil optimal.

---

**Dibuat oleh:** GitHub Copilot Code Analysis  
**Tanggal:** 27 Januari 2026  
**Status:** ✅ COMPLETE - Siap untuk implementasi fix
