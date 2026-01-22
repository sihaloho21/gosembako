# Panduan Migrasi: Merge Referral ke Sheet Users

**Tanggal:** 22 Januari 2026  
**Status:** Implementation Ready  
**Effort:** 15 menit setup + 5 menit testing

---

## 📋 Overview

Sistem referral akan di-merge ke sheet `users` yang sudah ada. Ini akan mengurangi kompleksitas database dan memudahkan query.

**Sheet Structure:**

```
users (Existing) + 4 Kolom Baru
├── id (existing)
├── nama (existing)
├── whatsapp (existing)
├── pin (existing)
├── tanggal_daftar (existing)
├── status (existing)
├── referral_code (NEW)           ← Unik per user
├── referrer_id (NEW)             ← Siapa yang mengajak (bisa kosong)
├── total_points (NEW)            ← Saldo poin mereka
└── created_at (NEW)              ← Timestamp daftar
```

---

## 🚀 STEP 1: Update Google Sheets (5 Menit)

### 1.1 Buka Google Sheets

```
https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
```

### 1.2 Tambah 4 Kolom Baru ke Sheet `users`

Buka sheet `users` yang sudah ada. Header row = Row 1.

**Struktur sekarang (Kolom A-F):**
```
A: id
B: nama
C: whatsapp
D: pin
E: tanggal_daftar
F: status
```

**Tambah kolom baru (Kolom G-J):**
```
G: referral_code
H: referrer_id
I: total_points
J: created_at
```

### 1.3 Set Format & Default Value untuk Data Existing

**Untuk semua row existing (row 2 ke bawah):**

#### Column G: `referral_code` - Auto-Generate

Klik cell G2 dan masukkan formula ini:

```google-sheets-formula
=IF(B2="", "", LEFT(UPPER(SUBSTITUTE(B2, " ", "")), 4) & TEXT(RANDBETWEEN(1000, 9999), "0000"))
```

**Penjelasan:**
- Ambil nama dari kolom B
- Uppercase dan hapus space
- Ambil 4 karakter pertama
- Tambah 4 digit random

**Contoh output:**
- "Budi Santoso" → "BUDI1234"
- "Andi Wijaya" → "ANDI5678"
- "Citra Dewi" → "CITR9012"

**Copy ke semua row:**
1. Klik cell G2
2. Copy formula (Ctrl+C)
3. Pilih range G2:G[LAST_ROW]
4. Paste (Ctrl+V)

**PENTING:** Setelah generate, **convert ke value** untuk lock hasilnya:
1. Pilih range G2:G[LAST_ROW]
2. Klik kanan → "Paste special" → "Paste values only"
3. Hapus formula, hanya tersisa value

#### Column H: `referrer_id` - Kosong untuk User Lama

User existing tidak punya referrer, jadi tinggal isi kosong atau "N/A".

Untuk H2 ke bawah, biarkan kosong saja (atau bisa isi dengan formula untuk set semua ke kosong).

#### Column I: `total_points` - Default 0

Klik cell I2 dan masukkan `0`, kemudian copy ke bawah untuk semua row existing.

Atau gunakan formula:
```google-sheets-formula
=IF(B2="", "", 0)
```

#### Column J: `created_at` - Copy dari Tanggal Daftar

Klik cell J2 dan masukkan formula:
```google-sheets-formula
=IF(E2="", "", E2 & " 00:00:00")
```

Ini akan copy tanggal dari column E dan tambah waktu default 00:00:00.

Atau jika ingin lebih presisi, gunakan:
```google-sheets-formula
=IF(B2="", "", TEXT(NOW(), "YYYY-MM-DD HH:MM:SS"))
```

Tapi ini akan jadi sekarang, bukan tanggal daftar asli.

### 1.4 Contoh Hasil Akhir

Setelah semua formula dicopy, hasil seharusnya seperti ini:

```
| A  | B    | C      | D    | E         | F     | G        | H           | I  | J                  |
|----|------|--------|------|-----------|-------|----------|-------------|----|--------------------|
| id | nama | whats  | pin  | tgl_dafta | statu | referral | referrer_id | pt | created_at         |
| 1  | Budi | 08123  | 1234 | 2026-01-2 | aktif | BUDI1234 | (kosong)    | 0  | 2026-01-20 00:00.. |
| 2  | Andi | 08156  | 5678 | 2026-01-2 | aktif | ANDI5678 | (kosong)    | 0  | 2026-01-21 00:00.. |
```

---

## ✅ STEP 2: Verifikasi di SheetDB (2 Menit)

Tunggu 1-2 menit setelah update Google Sheets.

Kemudian test API call:

```bash
curl "https://sheetdb.io/api/v1/[YOUR_SHEET_ID]?sheet=users&limit=1"
```

**Expected response:**
```json
[
  {
    "id": "1",
    "nama": "Budi",
    "whatsapp": "081234",
    "pin": "1234",
    "tanggal_daftar": "2026-01-20",
    "status": "aktif",
    "referral_code": "BUDI1234",
    "referrer_id": "",
    "total_points": "0",
    "created_at": "2026-01-20 00:00:00"
  }
]
```

✅ Jika response include kolom baru → Setup berhasil!  
❌ Jika error 404 atau kolom tidak ada → Cek nama sheet (harus lowercase `users`)

---

## 🔄 STEP 3: Update Frontend Code

Frontend sudah di-update untuk:

✅ **akun.js** - Registration form sekarang auto-generate referral code
✅ **referral-helper.js** - Utility functions untuk referral system
✅ **index.html & akun.html** - Script references sudah ditambah

### File yang Berubah:

1. **assets/js/akun.js** (Updated)
   - Registration form sekarang include: `referral_code`, `referrer_id`, `total_points`, `created_at`
   - Auto-detect jika user daftar dari referral link (`?ref=XXXX`)

2. **assets/js/referral-helper.js** (NEW)
   - Utility functions untuk referral system
   - Functions: `generateReferralCode()`, `getReferralLink()`, `shareReferralViaWhatsApp()`, dll
   - Auto-initialize referral tracking saat page load

3. **index.html** (Updated)
   - Added: `<script src="assets/js/referral-helper.js"></script>`

4. **akun.html** (Updated)
   - Added: `<script src="assets/js/api-service.js"></script>`
   - Added: `<script src="assets/js/referral-helper.js"></script>`

---

## 🧪 STEP 4: Testing (3 Menit)

### Test 1: Register User Baru

1. Buka website: `https://[your-domain]/akun.html`
2. Klik "Daftar Sekarang"
3. Isi form:
   - Nama: "Test User"
   - WhatsApp: "081234567890"
   - PIN: "123456"
   - Confirm PIN: "123456"
4. Klik "Daftar"

### Test 2: Verifikasi di Google Sheets

Buka Google Sheets → sheet `users`:

Cari row user baru. Harus ada:
- ✅ `referral_code`: e.g., "TEST1234"
- ✅ `referrer_id`: kosong (tidak ada referrer)
- ✅ `total_points`: 0
- ✅ `created_at`: tanggal-waktu saat registrasi

### Test 3: Register dengan Referral Link

1. Copy referral code dari user yang sudah ada (e.g., "BUDI1234")
2. Buka: `https://[your-domain]/?ref=BUDI1234`
3. Lakukan registrasi user baru
4. Cek Google Sheets row user baru:
   - ✅ `referrer_id`: harus isi "BUDI1234" (atau referral code dari referrer)
   - ✅ Welcome banner seharusnya muncul saat landing dengan ref link

### Test 4: Cek Referral Helper Functions

Buka browser console (F12 → Console) dan test:

```javascript
// Test 1: Generate referral code
generateReferralCode("Budi Santoso")
// Output: "BUDI1234" (atau similar)

// Test 2: Get referral link
getReferralLink("BUDI1234")
// Output: "https://[your-domain]/?ref=BUDI1234"

// Test 3: Copy to clipboard
copyReferralLinkToClipboard("BUDI1234")
// Harusnya toast notification muncul

// Test 4: Get referral stats (jika ada data di sheet referrals)
getReferralStats("BUDI1234")
// Output: { total_referred, total_completed, total_points }
```

---

## 📝 SQL Cheat Sheet (untuk query manual di SheetDB)

### Query: Get user dengan referral code tertentu

```
GET /api/v1/[SHEET_ID]?sheet=users&referral_code=BUDI1234
```

### Query: Get semua user yang direferensikan oleh BUDI1234

```
GET /api/v1/[SHEET_ID]?sheet=users&referrer_id=BUDI1234
```

### Query: Update total_points user

```
POST /api/v1/[SHEET_ID]?sheet=users
Body:
{
  "referral_code": "BUDI1234",
  "total_points": 50000
}
```

---

## ⚠️ Important Notes

### Data Integrity

1. **referral_code harus UNIQUE** → Jangan duplikat!
   - Gunakan formula RANDBETWEEN() untuk generate random
   - Jika ada duplikat, regenerate untuk salah satu user

2. **referrer_id harus valid** → Harus ada user dengan referral_code itu
   - Validation akan ditambah di backend nanti

3. **total_points harus NUMBER** → Jangan string!
   - Gunakan formula `=0` untuk number 0, bukan `"0"` string

### Performance

- SheetDB akan cache response selama beberapa detik
- Jika ada update di Google Sheets, mungkin perlu refresh manual
- Untuk query besar (>1000 rows), pertimbangkan pagination

### Backup

Sebelum melakukan perubahan besar:
1. Download sheet as CSV: File → Download → CSV
2. Simpan di local untuk backup
3. Baru mulai update

---

## 🎯 Next Steps

Setelah migration berhasil, langkah berikutnya:

### 1. Backend Google Apps Script (1-2 hari kerja)
- Handle referral code validation
- Track pembelian pertama user (dari sheet orders)
- Auto-credit poin ke referrer

### 2. Frontend Dashboard Referral (1-2 hari kerja)
- Halaman `/referral.html` untuk dashboard referrer
- Tampilkan:
  - Referral code mereka
  - Share buttons (WhatsApp, Facebook, Twitter, Copy link)
  - Statistik: total referred, total completed, total points
  - Riwayat referral

### 3. Testing & Optimization
- End-to-end testing
- Performance optimization
- Error handling

---

## 🆘 Troubleshooting

### Q: Referral code masih duplicate setelah generate?

**A:** Formula RANDBETWEEN() tidak 100% unik. Solusi:
- Manual check untuk duplikat
- Jika ada, manual update satu row dengan custom code
- Atau regenerate formula lagi sampai unik

### Q: Column tidak muncul di SheetDB response?

**A:** Kemungkinan:
1. SheetDB belum sync → tunggu 2 menit
2. Nama sheet wrong → harus lowercase `users`
3. Header row salah → harus di row 1
4. Clear cache SheetDB → refresh page

### Q: Referrer_id user baru tidak terisi saat register dari referral link?

**A:** Kemungkinan:
1. URL parameter `?ref=XXXX` typo atau salah
2. sessionStorage tidak disimpan → clear browser cache
3. Registrasi form tidak ada di halaman yang benar

---

## 📚 Files Modified

```
✏️ Modified:
- assets/js/akun.js               (Registration form updated)
- index.html                      (Added script reference)
- akun.html                       (Added script references)

✨ New:
- assets/js/referral-helper.js    (Referral utility functions)
- REFERRAL_MIGRATION_GUIDE.md     (This file)

No changes needed:
- Google Sheets structure remains simple
- SheetDB API calls still the same
- Existing user data preserved
```

---

## ✅ Checklist Completion

- [ ] Buka Google Sheets
- [ ] Tambah 4 kolom: referral_code, referrer_id, total_points, created_at
- [ ] Generate referral code dengan formula untuk user existing
- [ ] Set default values (0 untuk points, kosong untuk referrer_id)
- [ ] Convert formula to values untuk lock data
- [ ] Wait 1-2 menit untuk SheetDB sync
- [ ] Test SheetDB API response
- [ ] Test registrasi user baru
- [ ] Verifikasi data di Google Sheets
- [ ] Test registrasi dengan referral link
- [ ] Test referral helper functions di console
- [ ] Commit & push code changes ke GitHub

---

**Status:** ✅ Migration Ready untuk Execution

Siap untuk proceed ke STEP BERIKUTNYA? 🚀
