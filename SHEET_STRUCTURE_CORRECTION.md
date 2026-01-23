# ⚠️ SHEET STRUKTUR - RECONCILIATION

**Status:** 🔴 DITEMUKAN MISMATCH antara rekomendasi saya vs GAS script actual

---

## 🔍 PERBANDINGAN: REKOMENDASI vs ACTUAL GAS CODE

### SHEET: `referrals`

#### ❌ REKOMENDASI SAYA (SALAH):
```
Tambah kolom: reward_points
Rename: first_order_id → order_id
Hapus: referrer_phone, referred_phone
```

**Struktur yang saya rekomendasikan:**
```
id, referrer_code, referred_id, referred_name, status, 
reward_points, order_id, created_at, completed_at
```

#### ✅ ACTUAL GAS CODE (BENAR):
```javascript
addRowToSheet(SHEETS.REFERRALS, {
  id: referralId,
  referrer_phone: referrer.whatsapp,      // ✅ KEEP
  referrer_code: buyer.referrer_id,
  referred_phone: buyer.whatsapp,         // ✅ KEEP
  referred_name: buyer.nama,
  status: 'completed',
  first_order_id: orderId,                // ✅ KEEP (tidak direname!)
  created_at: getNowTimestamp(),
  completed_at: getNowTimestamp()
});
```

**Struktur yang benar (dari GAS):**
```
id, referrer_phone, referrer_code, referred_phone, referred_name, 
status, first_order_id, created_at, completed_at
```

**Kesalahan saya:** Saya rekomendasikan hapus `referrer_phone` dan `referred_phone`, tapi GAS code PERLU field ini!

---

### SHEET: `points_history`

#### ❌ REKOMENDASI SAYA (PARTIAL SALAH):
```
Tambah kolom: user_id
Rename: type → transaction_type
Rename: amount → points_change
Rename: balance_before → points_before
Rename: balance_after → points_after
Rename: source_id → reference_id
```

#### ✅ ACTUAL GAS CODE (BENAR):
```javascript
addRowToSheet(SHEETS.POINTS_HISTORY, {
  id: 'PH-' + Date.now(),
  user_phone: referrer.whatsapp,          // ✅ KEEP (tidak rename)
  referral_code: referrer.referral_code,
  transaction_date: new Date().toLocaleDateString('id-ID'),
  type: 'referral_reward',                // ✅ KEEP (tidak rename)
  amount: REFERRAL_CONFIG.REFERRER_REWARD, // ✅ KEEP (tidak rename)
  balance_before: parseInt(referrer.total_points || 0),
  balance_after: newPoints,
  description: 'Reward dari referral ' + buyer.nama,
  source_id: referralId,                  // ✅ KEEP (tidak rename)
  created_at: getNowTimestamp()
});
```

**Struktur yang benar (dari GAS):**
```
id, user_phone, referral_code, transaction_date, type, 
amount, balance_before, balance_after, description, source_id, created_at
```

**Kesalahan saya:** Saya recommend rename kolom, tapi GAS code TIDAK rename!

---

### SHEET: `vouchers`

#### ❌ REKOMENDASI SAYA (SALAH):
```
Tambah kolom: voucher_id, value, max_discount, user_id, is_used
Rename: expiry_date → expires_at
Rename: discount_amount → max_discount
Hapus: referrer_phone, referred_phone, generated_by, status
```

#### ✅ ACTUAL GAS CODE (BENAR):
```javascript
addRowToSheet(SHEETS.VOUCHERS, {
  voucher_code: voucherCode,
  type: 'percentage',
  discount_amount: REFERRAL_CONFIG.REFERRED_DISCOUNT, // ✅ KEEP
  referrer_phone: referrer.whatsapp,      // ✅ KEEP (tidak hapus!)
  referred_phone: buyer.whatsapp,         // ✅ KEEP (tidak hapus!)
  status: 'active',                       // ✅ KEEP (tidak hapus!)
  created_at: getNowTimestamp(),
  expiry_date: expiryDate.toLocaleDateString('id-ID'), // ✅ KEEP
  used_at: '',
  order_id: '',
  generated_by: 'system',                 // ✅ KEEP (tidak hapus!)
  notes: 'Voucher dari program referral'
});
```

**Struktur yang benar (dari GAS):**
```
voucher_code, type, discount_amount, referrer_phone, referred_phone, 
status, created_at, expiry_date, used_at, order_id, generated_by, notes
```

**Kesalahan saya:** Saya recommend hapus & rename banyak kolom, tapi GAS code PERLU semuanya!

---

### SHEET: `users`

#### ❌ REKOMENDASI SAYA (SALAH):
```
Rename: referrer_id → referrer_code (untuk clarity)
Tambah kolom: updated_at
Hapus: tanggal_daftar (duplikat)
```

#### ✅ ACTUAL GAS CODE (BENAR):
```javascript
// Di GAS, cari referrer berdasarkan:
const referrer = findUserByReferralCode(buyer.referrer_id);
// Ini berarti GAS expect field 'referrer_id' berisi KODE REFERRAL

// Update points:
updateCell(SHEETS.USERS, referrerRowIndex, 'total_points', newPoints);
```

**Struktur yang benar (dari GAS):**
```
id, nama, whatsapp, pin, referral_code, referrer_id, 
total_points, status, created_at, tanggal_daftar
```

**Kesalahan saya:** GAS TIDAK rename `referrer_id` ke `referrer_code`, dan TIDAK tambah `updated_at`

---

## ✅ STRUKTUR YANG SEBENARNYA BENAR (dari GAS Script)

### Schema Definition dari GAS:
```javascript
const REFERRAL_SHEET_DEFS = {
  users: ['id','nama','whatsapp','pin','referral_code','referrer_id',
          'total_points','status','created_at','tanggal_daftar'],
  
  referrals: ['id','referrer_phone','referrer_code','referred_phone',
              'referred_name','status','first_order_id','created_at','completed_at'],
  
  points_history: ['id','user_phone','referral_code','transaction_date','type',
                   'amount','balance_before','balance_after','description','source_id','created_at'],
  
  vouchers: ['voucher_code','type','discount_amount','referrer_phone','referred_phone',
             'status','created_at','expiry_date','used_at','order_id','generated_by','notes'],
  
  orders: ['id','pelanggan','phone','produk','qty','total','poin','status',
           'point_processed','tanggal'],
  
  settings: ['key','value']
};
```

---

## 📋 TABEL: STRUKTUR YANG SEBENARNYA HARUS ANDA PAKAI

### Sheet `users` - JANGAN UBAH
```
id | nama | whatsapp | pin | referral_code | referrer_id | total_points | status | created_at | tanggal_daftar
```

**Catatan:**
- ✅ `referrer_id` = tetap nama ini (isinya adalah referral code dari referrer)
- ✅ Keep `tanggal_daftar`
- ❌ Jangan tambah `updated_at`

---

### Sheet `referrals` - STRUKTUR YANG BENAR
```
id | referrer_phone | referrer_code | referred_phone | referred_name | status | first_order_id | created_at | completed_at
```

**Catatan:**
- ✅ KEEP `referrer_phone` (phone dari yang refer)
- ✅ KEEP `referred_phone` (phone dari yang direferensikan)
- ✅ `referrer_code` = kode referral dari referrer
- ✅ `first_order_id` = ID pesanan pertama (tetap nama ini, jangan rename!)
- ❌ Jangan tambah `reward_points`

---

### Sheet `points_history` - STRUKTUR YANG BENAR
```
id | user_phone | referral_code | transaction_date | type | amount | balance_before | balance_after | description | source_id | created_at
```

**Catatan:**
- ✅ `user_phone` = tetap nama ini
- ✅ `referral_code` = kode referral user
- ✅ `type` = tetap nama ini (jangan rename ke transaction_type)
- ✅ `amount` = tetap nama ini (jangan rename ke points_change)
- ✅ `balance_before` / `balance_after` = tetap nama ini
- ✅ `source_id` = tetap nama ini (jangan rename!)
- ❌ Jangan tambah `user_id`

---

### Sheet `vouchers` - STRUKTUR YANG BENAR
```
voucher_code | type | discount_amount | referrer_phone | referred_phone | status | created_at | expiry_date | used_at | order_id | generated_by | notes
```

**Catatan:**
- ✅ KEEP semua kolom (jangan hapus apapun!)
- ✅ `discount_amount` = tetap nama ini (jangan rename)
- ✅ `expiry_date` = tetap nama ini (jangan rename ke expires_at)
- ✅ KEEP `referrer_phone`, `referred_phone`, `generated_by`, `status`
- ❌ Jangan tambah `voucher_id`, `value`, `max_discount`, `user_id`, `is_used`

---

## 🎯 KESIMPULAN

### Struktur Spreadsheet Anda SUDAH BENAR! ✅

**Apa yang Anda miliki sekarang:**
- referrals: Header sudah OK
- points_history: Header sudah OK
- vouchers: Header sudah OK
- users: Header sudah OK

### Rekomendasi Saya SALAH! ❌

Saya membuat rekomendasi perubahan yang tidak sesuai dengan GAS code. **Maaf!**

### Apa yang Perlu Anda Lakukan?

**JANGAN UBAH APAPUN DI SPREADSHEET** - Struktur sudah benar sesuai GAS code!

---

## 🚀 STATUS

**Current Sheet Structure:** ✅ **CORRECT & READY**

Backend GAS sudah di-update untuk match dengan spreadsheet Anda yang ada sekarang. Tidak perlu perubahan sheet!

**Siap untuk:** Test referral flow secara langsung tanpa perubahan sheet!

---

**Apologies untuk confusion ini!** 😅  
**Now we're aligned:** GAS code ↔️ Spreadsheet structure ✅
