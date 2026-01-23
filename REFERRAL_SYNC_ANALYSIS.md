# 🔍 Analisis Sinkronisasi Sistem Referral

**Tanggal Analisis:** 23 Januari 2026  
**Status:** ⚠️ DITEMUKAN GAP & KETIDAKSINKRONAN

---

## 📊 Executive Summary

Sistem referral memiliki **beberapa ketidaksinkronan** antara:
- Backend GAS (Google Apps Script)
- Frontend (HTML/JS)
- Struktur Spreadsheet

### Status Komponen:
- ✅ **Backend GAS:** Sudah lengkap & siap
- ✅ **Frontend:** Sudah lengkap & siap
- ⚠️ **Spreadsheet:** Ada gap struktur kolom
- ❌ **Data:** Kosong, belum ada referral aktif

---

## 🚨 GAP & KETIDAKSINKRONAN YANG DITEMUKAN

### 1. ❌ MISMATCH NAMA KOLOM (Critical)

#### Sheet: **referrals**

| Backend GAS Expect | Spreadsheet Actual | Status |
|-------------------|-------------------|---------|
| `referral_id` | `id` | ❌ Berbeda |
| `referrer_id` | `referrer_code` | ❌ Berbeda |
| `referred_id` | `referred_phone` | ❌ Berbeda |
| `order_id` | `first_order_id` | ❌ Berbeda |
| `reward_points` | - | ❌ Kolom tidak ada |

**Dampak:** Backend GAS akan gagal menulis/membaca data dari sheet `referrals`

---

#### Sheet: **points_history**

| Backend GAS Expect | Spreadsheet Actual | Status |
|-------------------|-------------------|---------|
| `history_id` | `id` | ❌ Berbeda |
| `user_id` | `user_phone` | ❌ Berbeda |
| `transaction_type` | `type` | ❌ Berbeda |
| `points_change` | `amount` | ❌ Berbeda |
| `points_before` | `balance_before` | ❌ Berbeda |
| `points_after` | `balance_after` | ❌ Berbeda |
| `reference_id` | `source_id` | ❌ Berbeda |

**Dampak:** Riwayat poin tidak akan tercatat dengan benar

---

#### Sheet: **vouchers**

| Backend GAS Expect | Spreadsheet Actual | Status |
|-------------------|-------------------|---------|
| `voucher_id` | - | ❌ Kolom tidak ada |
| `user_id` | `referred_phone` | ❌ Berbeda |
| `is_used` | - | ❌ Kolom tidak ada |
| `expires_at` | `expiry_date` | ❌ Berbeda |
| `value` | - | ❌ Kolom tidak ada |
| `max_discount` | - | ❌ Kolom tidak ada |

**Dampak:** Voucher tidak akan bisa dibuat/dikelola

---

#### Sheet: **users**

| Backend GAS Expect | Spreadsheet Actual | Status |
|-------------------|-------------------|---------|
| `updated_at` | - | ❌ Kolom tidak ada |
| - | `tanggal_daftar` | ⚠️ Kolom ekstra |

**Dampak:** Tidak bisa track update terakhir user

---

### 2. ⚠️ MISSING COLUMNS (High Priority)

Kolom-kolom yang **harus ditambahkan** ke spreadsheet:

#### referrals sheet:
- `reward_points` (integer) - Jumlah poin yang didapat referrer

#### vouchers sheet:
- `voucher_id` (string) - ID unik voucher
- `value` (integer) - Nilai diskon dalam persentase
- `max_discount` (integer) - Maksimal diskon dalam Rupiah
- `is_used` (boolean/string) - Status voucher sudah digunakan atau belum

#### users sheet:
- `updated_at` (datetime) - Timestamp update terakhir

---

### 3. 🔄 LOGIC MISMATCH

#### A. Pencarian User di GAS
**Problem:** Backend mencari user berdasarkan `whatsapp` tapi ada inkonsistensi format nomor

**Di Spreadsheet:**
```
08993370200    (dengan 0)
8993370200     (tanpa 0)
628993370200   (dengan +62)
```

**Solusi:** Implementasi `normalizePhone()` sudah ada di GAS, tapi perlu validasi di frontend saat registrasi

---

#### B. Referral Tracking Flow
**Backend GAS Logic:**
1. Cari user berdasarkan `customerPhone`
2. Cek `referrer_id` di user
3. Cari referrer berdasarkan `referral_code` = `referrer_id`
4. Cek apakah sudah ada `completed` referral
5. Credit poin ke referrer
6. Buat record di `referrals`
7. Buat record di `points_history`
8. Generate & create voucher

**Problem:**
- Field `referrer_id` di sheet users terisi dengan **kode referral**, bukan **user ID**
- Backend expect `referrer_id` = referral code (BUDI1234)
- Ini **benar** tapi naming membingungkan

**Rekomendasi:** Rename `referrer_id` → `referrer_code` untuk clarity

---

### 4. 📝 DATA VALIDATION ISSUES

#### A. Status Field di Sheet `referrals`
**Backend GAS mengunakan:**
- `pending` - Menunggu pembelian pertama
- `completed` - Sudah beli

**Spreadsheet tidak ada:**
- Validation untuk status values
- Default value

---

#### B. Phone Number Format
**Tidak ada standardisasi:**
- Users bisa input: 08xxx, 8xxx, 628xxx, +628xxx
- Backend normalize semua, tapi frontend tidak enforce

---

### 5. 🔗 INTEGRATION ISSUES

#### A. Order → Referral Processing
**Di script.js (line 1393-1405):**
```javascript
if (window.referralOrderIntegration) {
    referralOrderIntegration.processOrder(...)
}
```

**Problem:** 
- Variable `referralOrderIntegration` tidak ditemukan didefinisikan
- Ini conditional check yang tidak akan pernah true
- Referral processing tidak akan pernah jalan

**Fix Required:** Import/define `referralOrderIntegration` dari `referral-helper.js`

---

#### B. GAS URL Configuration
**di config.js:**
```javascript
getGASUrl() {
    return localStorage.getItem('gas_url') || 'DEFAULT_URL';
}
```

**Problem:**
- Default GAS URL tidak ada
- Admin belum set GAS URL
- Referral processing akan gagal karena GAS URL undefined

---

### 6. ⚠️ FRONTEND DISPLAY ISSUES

#### referral.html Expect Data Structure:
```javascript
{
    total_referred: 10,
    total_completed: 5,
    total_pending: 5,
    total_points: 50000,
    referrals: [ ... ],
    points_history: [ ... ],
    vouchers: [ ... ]
}
```

**Problem:**
- GAS Backend belum implement endpoint `getReferralStats` dengan struktur ini
- Frontend akan show "0" untuk semua stats

---

## ✅ REKOMENDASI PERBAIKAN

### FASE 1: SYNC STRUKTUR SPREADSHEET (Critical - Harus Segera)

#### 1.1 Update Sheet: **referrals**
```
Kolom saat ini:
id, referrer_phone, referrer_code, referred_phone, referred_name, 
status, first_order_id, created_at, completed_at

Ubah menjadi:
id, referrer_code, referred_id, referred_name, status, 
reward_points, order_id, created_at, completed_at

Perubahan:
- Hapus: referrer_phone, referred_phone
- Rename: first_order_id → order_id
- Tambah: reward_points (default: 10000)
```

#### 1.2 Update Sheet: **points_history**
```
Kolom saat ini:
id, user_phone, referral_code, transaction_date, type, 
amount, balance_before, balance_after, description, source_id, created_at

Ubah menjadi:
id, user_id, referral_code, transaction_date, transaction_type, 
points_change, points_before, points_after, description, reference_id, created_at

Perubahan:
- Tambah: user_id (tambahan dari user_phone, untuk relasi)
- Rename: type → transaction_type
- Rename: amount → points_change
- Rename: balance_before → points_before
- Rename: balance_after → points_after
- Rename: source_id → reference_id
```

#### 1.3 Update Sheet: **vouchers**
```
Kolom saat ini:
voucher_code, type, discount_amount, referrer_phone, referred_phone, 
status, created_at, expiry_date, used_at, order_id, generated_by, notes

Ubah menjadi:
voucher_id, voucher_code, type, value, max_discount, user_id, 
is_used, created_at, expires_at, used_at, order_id, notes

Perubahan:
- Tambah: voucher_id (format: VCH-timestamp)
- Tambah: value (persentase diskon, misal: 10)
- Rename: discount_amount → max_discount
- Hapus: referrer_phone, referred_phone, generated_by
- Tambah: user_id (ID user pemilik voucher)
- Rename: expiry_date → expires_at
- Tambah: is_used (Yes/No atau true/false)
- Hapus: status (diganti is_used)
```

#### 1.4 Update Sheet: **users**
```
Kolom saat ini:
id, nama, whatsapp, pin, referral_code, referrer_id, 
total_points, status, created_at, tanggal_daftar

Ubah menjadi:
id, nama, whatsapp, pin, referral_code, referrer_code, 
total_points, status, created_at, updated_at

Perubahan:
- Rename: referrer_id → referrer_code (untuk clarity)
- Hapus: tanggal_daftar (duplikat dari created_at)
- Tambah: updated_at (timestamp update terakhir)
```

---

### FASE 2: UPDATE BACKEND GAS (Medium Priority)

#### 2.1 Update Function: `addRowToSheet()`
Pastikan field mapping sesuai dengan struktur baru:

```javascript
// referrals record
addRowToSheet(SHEETS.REFERRALS, {
  id: referralId,                    // ✅ Sesuai
  referrer_code: buyer.referrer_code, // ✅ Update
  referred_id: buyer.id,              // ✅ Update
  referred_name: buyer.nama,          // ✅ Sesuai
  status: 'completed',                // ✅ Sesuai
  reward_points: REFERRAL_CONFIG.REFERRER_REWARD, // ✅ Tambah
  order_id: orderId,                  // ✅ Update
  created_at: new Date().toISOString(),
  completed_at: getNowTimestamp()
});
```

#### 2.2 Update Function: `getReferralStats()`
Return struktur yang sesuai dengan frontend:

```javascript
function getReferralStats(referralCode) {
  const referrals = getSheetData(SHEETS.REFERRALS);
  const userReferrals = referrals.filter(r => r.referrer_code === referralCode);
  
  const completed = userReferrals.filter(r => r.status === 'completed');
  const pending = userReferrals.filter(r => r.status === 'pending');
  
  const totalPoints = completed.reduce((sum, r) => 
    sum + parseInt(r.reward_points || 0), 0
  );
  
  return {
    success: true,
    total_referred: userReferrals.length,
    total_completed: completed.length,
    total_pending: pending.length,
    total_points: totalPoints,
    referrals: userReferrals.map(r => ({
      name: r.referred_name,
      status: r.status,
      date: r.created_at,
      reward: r.reward_points
    }))
  };
}
```

#### 2.3 Implement Missing Endpoint: `getUserPointsHistory()`
```javascript
function getUserPointsHistory(referralCode) {
  const history = getSheetData(SHEETS.POINTS_HISTORY);
  const userHistory = history.filter(h => h.referral_code === referralCode);
  
  return {
    success: true,
    points_history: userHistory.map(h => ({
      date: h.transaction_date,
      type: h.transaction_type,
      points: h.points_change,
      description: h.description,
      balance: h.points_after
    }))
  };
}
```

---

### FASE 3: UPDATE FRONTEND (High Priority)

#### 3.1 Fix: referralOrderIntegration undefined
**File:** `assets/js/script.js` (line 1395)

```javascript
// BEFORE (Broken)
if (window.referralOrderIntegration) {
    referralOrderIntegration.processOrder(...)
}

// AFTER (Fixed)
if (typeof processOrderReferralViaGAS === 'function') {
    processOrderReferralViaGAS(orderId, customerPhone, customerName)
        .then(result => {
            if (result.referralProcessed) {
                console.log('✅ Referral reward processed');
            }
        })
        .catch(err => console.error('Error processing referral:', err));
}
```

#### 3.2 Add: GAS URL Configuration UI
**File:** `admin/index.html`

Tambahkan section untuk admin set GAS URL:

```html
<div class="setting-item">
    <label>Google Apps Script URL (Referral Backend)</label>
    <input type="url" id="gas-url-input" placeholder="https://script.google.com/...">
    <button onclick="saveGASUrl()">Simpan GAS URL</button>
</div>
```

```javascript
function saveGASUrl() {
    const url = document.getElementById('gas-url-input').value;
    localStorage.setItem('gas_url', url);
    alert('✅ GAS URL berhasil disimpan');
}
```

#### 3.3 Add: Phone Number Validation
**File:** `assets/js/script.js`

Tambahkan fungsi untuk normalize phone saat registrasi:

```javascript
function normalizePhoneNumber(phone) {
    // Remove all non-digits
    let cleaned = phone.replace(/[^0-9]/g, '');
    
    // Handle 628xxx → 08xxx
    if (cleaned.startsWith('62')) {
        cleaned = '0' + cleaned.substring(2);
    }
    
    // Ensure starts with 08
    if (!cleaned.startsWith('08')) {
        return null; // Invalid
    }
    
    return cleaned;
}

// Use saat registrasi/login
const normalizedPhone = normalizePhoneNumber(inputPhone);
if (!normalizedPhone) {
    alert('❌ Format nomor WhatsApp tidak valid. Gunakan format: 08xxxxxxxxxx');
    return;
}
```

---

### FASE 4: TESTING & VALIDATION

#### 4.1 Test Scenario: Complete Referral Flow
```
1. User A daftar dengan kode referral User B
   ✓ referrer_code tersimpan di users sheet
   
2. User A buat order pertama
   ✓ Order tercatat di orders sheet
   ✓ Backend GAS detect first order
   ✓ Credit poin ke User B
   ✓ Record dibuat di referrals sheet
   ✓ Record dibuat di points_history sheet
   ✓ Voucher dibuat untuk User A
   
3. User B check dashboard referral
   ✓ Stats muncul: 1 referred, 1 completed, 10000 poin
   ✓ List referral muncul dengan nama User A
   ✓ Points history muncul dengan detail reward
   
4. User A gunakan voucher di order kedua
   ✓ Voucher applied dan discount diberikan
   ✓ Voucher marked as used
```

#### 4.2 Test Data Validation
- Phone number format consistency
- Status field values (completed/pending)
- Timestamp format consistency
- Points calculation accuracy

---

## 📋 CHECKLIST IMPLEMENTASI

### Sheet Structure Updates:
- [ ] Backup spreadsheet sebelum perubahan
- [ ] Update kolom sheet `referrals`
- [ ] Update kolom sheet `points_history`
- [ ] Update kolom sheet `vouchers`
- [ ] Update kolom sheet `users`
- [ ] Validate data types untuk semua kolom
- [ ] Add data validation rules (dropdown untuk status, etc)

### Backend GAS Updates:
- [ ] Update `REFERRAL_SHEET_DEFS` dengan struktur baru
- [ ] Update `processReferral()` function
- [ ] Update `addRowToSheet()` calls
- [ ] Implement `getReferralStats()` endpoint
- [ ] Implement `getUserPointsHistory()` endpoint
- [ ] Test semua endpoints via Postman/curl
- [ ] Deploy GAS sebagai Web App
- [ ] Copy Web App URL

### Frontend Updates:
- [ ] Fix `referralOrderIntegration` undefined issue
- [ ] Add GAS URL configuration UI di admin panel
- [ ] Implement phone number normalization
- [ ] Test referral dashboard display
- [ ] Test share buttons functionality
- [ ] Add error handling untuk GAS API calls
- [ ] Add loading states untuk async operations

### Configuration:
- [ ] Set GAS URL di localStorage via admin panel
- [ ] Test API connectivity dari frontend ke GAS
- [ ] Verify all API endpoints working

### Testing:
- [ ] Test complete referral flow end-to-end
- [ ] Test edge cases (duplicate referrals, invalid phone, etc)
- [ ] Test voucher creation & usage
- [ ] Test points calculation
- [ ] Test dashboard stats display
- [ ] Load testing dengan multiple concurrent users

---

## 🎯 PRIORITAS

### P0 (Critical - Harus segera):
1. ✅ Update struktur sheet (referrals, points_history, vouchers, users)
2. ✅ Update Backend GAS field mapping
3. ✅ Fix `referralOrderIntegration` undefined
4. ✅ Set GAS URL configuration

### P1 (High - Minggu ini):
5. ✅ Implement missing GAS endpoints
6. ✅ Add phone number validation
7. ✅ Test complete flow end-to-end

### P2 (Medium - Bulan ini):
8. ⚠️ Add comprehensive error handling
9. ⚠️ Add admin monitoring dashboard
10. ⚠️ Add analytics tracking

---

## 📝 CATATAN PENTING

### Backward Compatibility:
⚠️ **PERINGATAN:** Perubahan struktur sheet akan break existing code sampai semua komponen di-update.

**Rekomendasi:**
1. Buat backup spreadsheet
2. Update semua komponen dalam 1 session
3. Test immediately setelah deployment
4. Siapkan rollback plan jika ada masalah

### Data Migration:
Jika sudah ada data di production:
1. Export data lama
2. Transform sesuai struktur baru
3. Import ke sheet baru
4. Validate data integrity
5. Switch ke sheet baru

---

**Status:** 📋 Ready for Implementation  
**Next Step:** Update struktur spreadsheet sesuai rekomendasi di atas  
**ETA:** 2-3 jam (tergantung jumlah data existing)
