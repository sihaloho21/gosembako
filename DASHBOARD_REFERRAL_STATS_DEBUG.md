# Dashboard Referral Stats Not Displaying - Debug Guide

## Issue
Data di sheet SUDAH ADA (referral records + points + vouchers), tapi di dashboard pengguna menampilkan 0 untuk semua stats:
- Orang Direferensikan: **0**
- Pembelian Selesai: **0**
- Menunggu Pembelian: **0**
- Total Poin: **0**

## Root Cause Analysis

Ada **mismatch antara referral code yang di-query** dan **data yang ada di sheet**:

### Example Scenario:
1. Admin membuat referral dengan code: **ADMI1542**
2. Di `referrals` sheet, data disimpan dengan: `referrer_code: "ADMI1542"`
3. Di dashboard, user login dan query dengan `referral_code: "ADMI1542"`
4. Tapi **sheet mungkin punya format berbeda**, contoh:
   - Kode disimpan: `"ADMI1542"` (tanpa leading zeros atau format berbeda)
   - Query menggunakan: `"admin"` atau `"08794613258"`
   - Atau column header tidak match (case-sensitive)

## Debug Steps

### Step 1: Check What Data is Actually in Sheets

**Di Google Apps Script Console, jalankan:**

```javascript
// Check what data is in each sheet
function debugSheetData() {
  // Check referrals sheet
  const referrals = getSheetData('referrals');
  Logger.log('REFERRALS SHEET:');
  Logger.log(`Total rows: ${referrals.length}`);
  referrals.forEach((r, i) => {
    Logger.log(`Row ${i}: referrer_code="${r.referrer_code}" | referred_phone="${r.referred_phone}" | status="${r.status}"`);
  });
  
  // Check users sheet
  const users = getSheetData('users');
  Logger.log('\nUSERS SHEET:');
  Logger.log(`Total rows: ${users.length}`);
  users.forEach((u, i) => {
    Logger.log(`Row ${i}: referral_code="${u.referral_code}" | total_points="${u.total_points}" | nama="${u.nama}"`);
  });
  
  // Check points_history sheet
  const history = getSheetData('points_history');
  Logger.log('\nPOINTS_HISTORY SHEET:');
  Logger.log(`Total rows: ${history.length}`);
  history.forEach((h, i) => {
    Logger.log(`Row ${i}: referral_code="${h.referral_code}" | amount="${h.amount}"`);
  });
}

debugSheetData();
```

### Step 2: Test Dashboard Query Function

**Di Google Apps Script Console, jalankan:**

```javascript
// Test getReferralStats dengan kode yang sedang ditesting
const testCode = 'ADMI1542';  // Ganti dengan kode sebenarnya
const stats = getReferralStats(testCode);
Logger.log('Stats for ' + testCode + ':');
Logger.log(JSON.stringify(stats));
```

Lihat hasilnya:
- Jika `total_referred: 0` → Data di sheet tidak match dengan kode yang di-query
- Jika `total_referred: > 0` → Data ada, masalahnya di frontend

### Step 3: Check Frontend Console

Buka browser dan tekan **F12** → **Console**, lalu login ke dashboard:

```
Carilah log yang seperti ini:
✅ User logged in, referral code: ADMI1542
📊 Getting referral stats from GAS: ADMI1542
```

Pastikan `referral_code` yang di-query **sama persis** dengan yang di sheet.

### Step 4: Check Column Headers

**Pastikan column headers di sheet EXACT match dengan yang dicari di code:**

**referrals sheet headers (harus persis begini):**
```
id
referrer_phone
referrer_code
referred_phone
referred_name
status
first_order_id
created_at
completed_at
```

**users sheet headers (harus persis begini):**
```
id
nama
whatsapp
pin
referral_code
referrer_id
total_points
status
created_at
tanggal_daftar
```

**points_history sheet headers (harus persis begini):**
```
id
user_phone
referral_code
transaction_date
type
amount
balance_before
balance_after
description
source_id
created_at
```

### Step 5: Test Specific Referral Code

Di Google Apps Script Console:

```javascript
// Replace dengan kode admin sebenarnya
const adminCode = localStorage.getItem('admin_referral_code') || 'ADMI1542';

// Cek user dengan kode tersebut
const users = getSheetData('users');
const adminUser = users.find(u => u.referral_code === adminCode);
Logger.log('Admin user:', JSON.stringify(adminUser));

// Cek referrals yang di-refer oleh admin
const referrals = getSheetData('referrals');
const adminReferrals = referrals.filter(r => r.referrer_code === adminCode);
Logger.log('Admin referrals:', adminReferrals.length);
adminReferrals.forEach(r => {
  Logger.log(`  - ${r.referred_name} (${r.referred_phone}) - ${r.status}`);
});

// Cek points history untuk admin
const history = getSheetData('points_history');
const adminHistory = history.filter(h => h.referral_code === adminCode);
Logger.log('Admin points history:', adminHistory.length);
```

## Common Issues & Solutions

### Issue 1: Column Names Don't Match
**Gejala:** Stats selalu 0, tapi data ada di sheet
**Solusi:**
- Check column headers (case-sensitive!)
- Buat header baru dengan nama yang benar jika perlu
- Update code untuk match column names

### Issue 2: Referral Code Format Berbeda
**Gejala:** Ada data tapi query dengan kode berbeda
**Solusi:**
- Normalize referral codes (uppercase, remove spaces, dll)
- Add formatting function sebelum query

```javascript
function normalizeReferralCode(code) {
  return (code || '').trim().toUpperCase();
}
```

### Issue 3: Data Belum Tersimpan ke Sheet
**Gejala:** processReferral return success tapi data tidak ada di sheet
**Solusi:** Check logs dari `processReferral` dengan enhanced logging

### Issue 4: User Tidak Login Dengan Referral Code
**Gejala:** Dashboard load tapi query pakai whatsapp bukan referral_code
**Solusi:** Pastikan `user.referral_code` di-set saat login/register

## Enhanced Diagnostic Function

**Di Google Apps Script, jalankan ini:**

```javascript
function diagnosticDashboardIssue(referralCodeToTest) {
  Logger.log(`\n🔍 DIAGNOSTIC: Testing referral code: "${referralCodeToTest}"`);
  Logger.log('='.repeat(60));
  
  // 1. Check if user exists
  const users = getSheetData('users');
  const user = users.find(u => u.referral_code === referralCodeToTest);
  
  if (!user) {
    Logger.log(`❌ USER NOT FOUND with referral_code="${referralCodeToTest}"`);
    Logger.log('   Available referral codes:');
    users.forEach(u => Logger.log(`   - ${u.referral_code} (${u.nama})`));
    return;
  }
  
  Logger.log(`✅ User found: ${user.nama}`);
  Logger.log(`   - ID: ${user.id}`);
  Logger.log(`   - Whatsapp: ${user.whatsapp}`);
  Logger.log(`   - Referral Code: ${user.referral_code}`);
  Logger.log(`   - Total Points: ${user.total_points}`);
  
  // 2. Check referrals
  const referrals = getSheetData('referrals');
  const userReferrals = referrals.filter(r => r.referrer_code === referralCodeToTest);
  
  Logger.log(`\n📋 REFERRALS: ${userReferrals.length} found`);
  if (userReferrals.length === 0) {
    Logger.log('   ❌ No referrals found for this code');
  } else {
    userReferrals.forEach((r, i) => {
      Logger.log(`   ${i+1}. ${r.referred_name} (${r.referred_phone}) - ${r.status}`);
    });
  }
  
  // 3. Check points history
  const history = getSheetData('points_history');
  const userHistory = history.filter(h => h.referral_code === referralCodeToTest);
  
  Logger.log(`\n💰 POINTS HISTORY: ${userHistory.length} records`);
  if (userHistory.length === 0) {
    Logger.log('   ❌ No points history found');
  } else {
    userHistory.forEach((h, i) => {
      Logger.log(`   ${i+1}. ${h.type} - ${h.amount} poin (${h.transaction_date})`);
    });
  }
  
  // 4. Check vouchers
  const vouchers = getSheetData('vouchers');
  const userVouchers = vouchers.filter(v => v.referrer_phone === user.whatsapp);
  
  Logger.log(`\n🎟️ VOUCHERS: ${userVouchers.length} found`);
  if (userVouchers.length === 0) {
    Logger.log('   ❌ No vouchers found');
  } else {
    userVouchers.forEach((v, i) => {
      Logger.log(`   ${i+1}. ${v.voucher_code} (${v.status})`);
    });
  }
  
  // 5. Summary
  Logger.log('\n' + '='.repeat(60));
  Logger.log('📊 SUMMARY:');
  Logger.log(`   Total Referred: ${userReferrals.length}`);
  Logger.log(`   Completed: ${userReferrals.filter(r => r.status === 'completed').length}`);
  Logger.log(`   Pending: ${userReferrals.filter(r => r.status === 'pending').length}`);
  Logger.log(`   Total Points: ${user.total_points}`);
  Logger.log(`   Vouchers: ${userVouchers.length}`);
}

// Gunakan:
diagnosticDashboardIssue('ADMI1542');
```

## Files to Check

1. **Backend:** `/workspaces/gosembako/REFERRAL_BACKEND_GAS.gs`
   - `getReferralStats()` function (now with enhanced logging)
   - `getUserPointsHistory()` function (now with enhanced logging)

2. **Frontend:** `/workspaces/gosembako/referral.html`
   - `loadReferralData()` function (lines ~360-410)
   - `getReferralStatsFromGAS()` call (referral-helper.js line 112)

3. **Frontend Helper:** `/workspaces/gosembako/assets/js/referral-helper.js`
   - `getReferralStatsFromGAS()` function
   - `getPointsHistoryFromGAS()` function

## Next Steps

1. [ ] Run `debugSheetData()` untuk lihat apa yang di sheet
2. [ ] Run `getReferralStats('ADMIN_CODE')` untuk test query
3. [ ] Check browser console saat dashboard load
4. [ ] Compare referral_code query dengan data yang ada
5. [ ] Run `diagnosticDashboardIssue('ADMIN_CODE')` untuk full diagnosis
6. [ ] Fix column headers atau data format kalau diperlukan
7. [ ] Re-deploy GAS dan refresh dashboard

---

**Generated:** 2026-01-23
**Issue:** Dashboard showing 0 for all stats even though data exists in sheets
