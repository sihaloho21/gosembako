# 🧪 REFERRAL SYSTEM TESTING GUIDE

**Test Date:** 23 Januari 2026  
**Test URL:** https://dancing-pudding-dc26b3.netlify.app/?ref=RIDO7247  
**Referrer:** RIDO7247 (RIDO ALPREDO SIHALOHO)

---

## 📋 TESTING CHECKLIST

### Phase 1: Referral Link Tracking ✅

**Step 1.1: Open Referral Link**
- URL: `https://dancing-pudding-dc26b3.netlify.app/?ref=RIDO7247`
- Expected: Halaman index.html terbuka
- Check Console: Lihat pesan ✅

**Check di Console (F12 → Console tab):**
```
Expected output:
✅ Referral code tracked: RIDO7247
```

**What to verify:**
- [ ] Referral code RIDO7247 berhasil di-track
- [ ] Terlihat di localStorage
- [ ] Halaman load normal

---

### Phase 2: Registration ✅

**Step 2.1: Klik "Masuk/Daftar" Button**
- Expected: Modal login/register muncul

**Step 2.2: Switch ke Tab Daftar**
- Expected: Form registrasi terbuka

**Step 2.3: Isi Form Registrasi**
Gunakan data ini:
```
Nama        : Test User 001
WhatsApp    : 089876543210 (atau 8876543210)
PIN         : 121212
Konfirmasi  : 121212
```

**What to verify:**
- [ ] Form bisa diisi tanpa error
- [ ] Phone validation bekerja
- [ ] PIN validation bekerja

**Step 2.4: Submit Registrasi**
- Klik "Daftar" button
- Expected: Account created successfully

**Check di Console:**
```
Expected logs:
✅ Referral code tracked: RIDO7247
✅ Registration successful
User saved to database
```

**What to verify:**
- [ ] User berhasil terdaftar
- [ ] Referral code RIDO7247 tersimpan di field `referrer_id`
- [ ] No error di console

---

### Phase 3: Add to Cart & Checkout ✅

**Step 3.1: Add Product to Cart**
- Pilih salah satu produk
- Klik "Tambah ke Keranjang"
- Expected: Product ditambah ke cart

**Step 3.2: Open Cart**
- Klik cart icon
- Expected: Cart modal muncul dengan product

**Step 3.3: Checkout**
- Klik "Checkout" button
- Expected: Checkout form muncul

**Step 3.4: Isi Data Checkout**
```
Nama        : Test User 001
WhatsApp    : 089876543210
Alamat      : Jl. Test 123
Kota/Provinsi: Jakarta
```

**Step 3.5: Pilih Payment Method**
- Pilih: **"Tunai"** (untuk simplicity)
- Click "Proses Pesanan"

**What to verify:**
- [ ] Order berhasil dibuat
- [ ] Tidak ada error di process

**Check di Console - Order Success:**
```
Expected logs:
✅ Order created successfully
Order ID: ORD-XXXX...
Amount: Rp XXXXX

🔗 Processing referral via GAS for order: ORD-XXXX...
```

---

### Phase 4: Referral Processing ⭐ CRITICAL

**Check di Console PENTING:**
```
PENTING - Lihat log seperti ini:

Option A - SUCCESS:
✅ GAS Response (processReferral):
{
  success: true,
  referralProcessed: true,
  referrer_name: "RIDO ALPREDO SIHALOHO",
  referrer_reward: 10000,
  voucher_code: "DISC10K-XXXXX"
}

Option B - WARNING (No GAS URL):
⚠️ GAS URL tidak dikonfigurasi di CONFIG

Option C - ERROR:
❌ GAS API Error (processReferral):
HTTP Error atau message
```

**What to verify:**
- [ ] GAS URL sudah di-set di admin panel (jika tidak, akan warning)
- [ ] Referral processing dipanggil
- [ ] Response dari GAS diterima dengan baik

---

## 🔍 HOW TO DEBUG

### Open Browser Console
1. **Press F12** atau klik kanan → Inspect
2. **Tab → Console**
3. Search keyword: `Referral`, `processReferral`, `GAS`, `Error`

### Check localStorage
Di Console, paste:
```javascript
console.log('=== REFERRAL DATA ===');
console.log('Referral Code:', localStorage.getItem('referral_code'));
console.log('User ID:', localStorage.getItem('user_id'));
console.log('GAS URL:', localStorage.getItem('gas_url'));
console.log('User Data:', JSON.parse(localStorage.getItem('user_data')));
```

### Expected Output:
```
=== REFERRAL DATA ===
Referral Code: RIDO7247
User ID: USR-XXXXXX
GAS URL: https://script.google.com/macros/s/.../exec (atau empty jika belum set)
User Data: {
  id: "USR-...",
  nama: "Test User 001",
  whatsapp: "089876543210",
  referral_code: "USER0001" (kode baru untuk user ini),
  referrer_id: "RIDO7247",
  ...
}
```

---

## 📊 VERIFY IN BACKEND

### Check Spreadsheet (setelah order)

**1. Sheet `users` - Cek user baru:**
- Buka: https://docs.google.com/spreadsheets/d/your_sheet_id/edit
- Sheet: `users`
- Cari: Nama "Test User 001" atau WhatsApp 089876543210
- Verify:
  - ✅ `referrer_id` = RIDO7247
  - ✅ `referral_code` = Unique code (e.g., TEST0001)
  - ✅ `status` = aktif

**2. Sheet `referrals` - Cek referral record:**
- Sheet: `referrals`
- Cari: `referrer_code` = RIDO7247
- Verify:
  - ✅ `referred_name` = Test User 001
  - ✅ `referred_phone` = 089876543210
  - ✅ `status` = completed
  - ✅ `first_order_id` = ORD-XXXX...
  - ✅ `completed_at` = timestamp

**3. Sheet `points_history` - Cek poin untuk RIDO:**
- Sheet: `points_history`
- Cari: `referral_code` = RIDO7247 dan `type` = referral_reward
- Verify:
  - ✅ `amount` = 10000
  - ✅ `balance_before` = (poin sebelumnya)
  - ✅ `balance_after` = balance_before + 10000
  - ✅ `description` = Reward dari referral Test User 001

**4. Sheet `vouchers` - Cek voucher untuk buyer:**
- Sheet: `vouchers`
- Cari: `referred_phone` = 089876543210
- Verify:
  - ✅ `voucher_code` = DISC10K-XXXXX
  - ✅ `referrer_phone` = 8993370200 (RIDO)
  - ✅ `status` = active
  - ✅ `expiry_date` = 30 hari dari hari ini

**5. Sheet `users` - Update RIDO's points:**
- Sheet: `users`
- Cari: RIDO ALPREDO SIHALOHO
- Verify:
  - ✅ `total_points` = 39 → 49 (ditambah 10000, tapi format bisa "39,00" → "49,00")

---

## 🎯 EXPECTED FINAL RESULT

### For Referrer (RIDO ALPREDO SIHALOHO):
```
Before:
- Total Points: 39.00
- Referrals: 0 completed

After:
- Total Points: 49.00 (+ 10000 but displayed as 49.00)
- Referrals: 1 completed
- New referral entry in referrals sheet
- New points_history entry
```

### For Referred User (Test User 001):
```
After Registration & First Order:
- Referral Code: TEST0001 (generated)
- Referrer ID: RIDO7247
- Voucher: DISC10K-XXXXX (30 days valid)
- Status: Registered & order complete
```

---

## ⚠️ POTENTIAL ISSUES & SOLUTIONS

### Issue 1: "GAS URL tidak dikonfigurasi"
**Symptom:** Console shows ⚠️ warning about GAS URL  
**Solution:**
1. Go to Admin Panel: `/admin/index.html`
2. Login with admin credentials
3. Go to "Pengaturan"
4. Scroll to "Konfigurasi API"
5. Paste GAS Web App URL
6. Click "💾 Simpan GAS URL"
7. Refresh website and retry

### Issue 2: "GAS HTTP Error" atau "Connection refused"
**Symptom:** GAS API call fails  
**Solution:**
1. Verify GAS Web App URL is correct
2. Check GAS deployment is active
3. Check GAS has proper authorization
4. Test GAS endpoint directly in browser:
   ```
   https://script.google.com/macros/s/.../exec?action=test
   ```
   Should return: `{"success":true,"message":"Test successful",...}`

### Issue 3: Phone normalization issue
**Symptom:** User not found / phone mismatch  
**Solution:**
- Test normalizePhoneNumber function:
  ```javascript
  normalizePhoneNumber('089876543210') // Should return: 089876543210
  normalizePhoneNumber('8876543210')   // Should return: 089876543210
  normalizePhoneNumber('628876543210') // Should return: 089876543210
  ```

### Issue 4: Referral code not showing in referrals sheet
**Symptom:** No entry in referrals sheet after order  
**Solution:**
1. Check if this is actually first order (not second+)
2. Check console for error messages
3. Check GAS logs: https://script.google.com/home/projects
4. Check if referrer_id was properly saved during registration

---

## 🚀 FULL TEST EXECUTION STEPS

Copy-paste this sequence:

```
1. ✅ Open: https://dancing-pudding-dc26b3.netlify.app/?ref=RIDO7247
2. ✅ Press F12 to open Console
3. ✅ Look for: "✅ Referral code tracked: RIDO7247"
4. ✅ Click "Masuk/Daftar"
5. ✅ Tab to "Daftar"
6. ✅ Fill form:
   - Nama: Test User 001
   - WA: 089876543210
   - PIN: 121212
   - Confirm: 121212
7. ✅ Click "Daftar"
8. ✅ Wait for success message
9. ✅ Check console for registration logs
10. ✅ Add any product to cart
11. ✅ Click Checkout
12. ✅ Fill checkout data (same phone: 089876543210)
13. ✅ Select "Tunai" payment
14. ✅ Click "Proses Pesanan"
15. ✅ WATCH CONSOLE for referral processing
16. ✅ Wait 3-5 seconds for GAS response
17. ✅ Check for success message or error
18. ✅ Check spreadsheet sheets for new data
```

---

## 📝 REPORT TEMPLATE

After testing, fill this:

```
REFERRAL SYSTEM TEST REPORT
Date: [date]
Test URL: https://dancing-pudding-dc26b3.netlify.app/?ref=RIDO7247
Referrer: RIDO7247

PHASE 1 - Referral Tracking:
- [ ] PASS: Referral code detected
- [ ] PASS: Stored in localStorage
- Logs: [paste console logs]

PHASE 2 - Registration:
- [ ] PASS: User registered
- [ ] PASS: Referrer ID saved as RIDO7247
- New User Phone: 089876543210
- New User Referral Code: [note it]

PHASE 3 - Order:
- [ ] PASS: Order created
- Order ID: [note it]
- Amount: Rp [note it]

PHASE 4 - Referral Processing:
- [ ] PASS: GAS called successfully
- [ ] PASS: Referrer received 10000 poin
- [ ] PASS: Voucher generated
- Voucher Code: DISC10K-XXXXX
- GAS Response: [paste response]

BACKEND VERIFICATION:
- [ ] PASS: User in referrals sheet
- [ ] PASS: Points history recorded
- [ ] PASS: Voucher created
- [ ] PASS: RIDO's points updated

STATUS: ✅ PASS / ❌ FAIL
Notes: [any issues found]
```

---

**Next Step:** Execute the testing steps above and report findings!
