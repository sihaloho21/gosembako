# Quick Reference - Dashboard Debug Commands

Gunakan commands ini di **Google Apps Script Console** untuk cepat debug dashboard stats issue.

## 1. See All Referral Codes in System

```javascript
const users = getSheetData('users');
Logger.log('ALL REFERRAL CODES:');
users.forEach(u => {
  Logger.log(`  ${u.referral_code} → ${u.nama} (${u.whatsapp})`);
});
```

**Gunakan output untuk tahu referral code mana yang mau di-test.**

---

## 2. Check Specific User's Referral Data

```javascript
// Replace dengan referral code yang mau di-test
const CODE = 'ADMI1542';

// Get user
const users = getSheetData('users');
const user = users.find(u => u.referral_code === CODE);

if (!user) {
  Logger.log(`❌ User dengan code ${CODE} tidak ada`);
} else {
  Logger.log(`✅ User: ${user.nama}`);
  Logger.log(`   Points: ${user.total_points}`);
  
  // Get referrals
  const referrals = getSheetData('referrals');
  const refs = referrals.filter(r => r.referrer_code === CODE);
  Logger.log(`   Referrals: ${refs.length}`);
  refs.forEach(r => {
    Logger.log(`     - ${r.referred_name} (${r.status})`);
  });
}
```

---

## 3. Test getReferralStats() Function

```javascript
const CODE = 'ADMI1542';  // Ganti dengan kode yang mau di-test
const stats = getReferralStats(CODE);
Logger.log('Stats for ' + CODE + ':');
Logger.log(JSON.stringify(stats, null, 2));
```

**Expected output:**
```json
{
  "success": true,
  "total_referred": 1,
  "total_completed": 1,
  "total_pending": 0,
  "total_points": 10000,
  "referrals": [...]
}
```

If `total_referred` = 0 → data tidak match dengan kode

---

## 4. Full Diagnostic for One User

```javascript
diagnosticDashboardIssue('ADMI1542');  // Ganti dengan kode
```

**Shows complete picture:**
- ✅ User exists?
- ✅ How many referrals?
- ✅ Points recorded?
- ✅ Vouchers created?

---

## 5. Compare Sheet Data With Query

```javascript
const CODE = 'ADMI1542';

// What's in the sheet
const referrals = getSheetData('referrals');
Logger.log('All referrer_codes in sheet:');
referrals.forEach(r => {
  Logger.log(`  "${r.referrer_code}"`);
});

// What we're querying for
Logger.log(`\nQuerying for: "${CODE}"`);
Logger.log(`Matches: ${referrals.filter(r => r.referrer_code === CODE).length}`);
```

**If no matches → code doesn't exist exactly as in sheet**

---

## 6. Check Points History

```javascript
const CODE = 'ADMI1542';

const history = getSheetData('points_history');
const userHistory = history.filter(h => h.referral_code === CODE);

Logger.log(`Points history for ${CODE}: ${userHistory.length} records`);
userHistory.forEach(h => {
  Logger.log(`  ${h.type}: ${h.amount} poin (${h.transaction_date})`);
});
```

---

## 7. List All Data in Sheet (Warning: Large Output)

```javascript
const sheetName = 'referrals';  // or 'users', 'points_history'
const data = getSheetData(sheetName);
Logger.log(`${sheetName}: ${data.length} rows`);
data.forEach((row, i) => {
  Logger.log(`${i+1}: ${JSON.stringify(row)}`);
});
```

**⚠️ Jangan gunakan jika data sangat banyak (akan timeout)**

---

## 8. Find User by WhatsApp Number

```javascript
const phone = '08794613258';  // Ganti dengan nomor
const normalized = normalizePhone(phone);

const user = findUserByWhatsapp(phone);
if (user) {
  Logger.log(`Found: ${user.nama} (code: ${user.referral_code})`);
} else {
  Logger.log(`User dengan nomor ${phone} tidak ada`);
}
```

---

## 9. Check What Dashboard Query Receives

Saat user login ke dashboard, check browser console:

```javascript
// Di browser console (F12 → Console tab)
// Cari log yang menunjukkan referral code yang di-query
console.log(localStorage.getItem('gosembako_user'));  // Lihat user data
```

---

## 10. Simulate Dashboard Load

```javascript
// Simulate what dashboard does
function simulateDashboardLoad() {
  // Ambil user dari localStorage (misal: "gosembako_user")
  // Di test, kita buat manual:
  
  const testUser = {
    referral_code: 'ADMI1542',
    nama: 'Admin'
  };
  
  // Panggil function yang dashboard panggil
  const stats = getReferralStats(testUser.referral_code);
  Logger.log('Dashboard would show:');
  Logger.log(`  Orang Direferensikan: ${stats.total_referred}`);
  Logger.log(`  Pembelian Selesai: ${stats.total_completed}`);
  Logger.log(`  Menunggu Pembelian: ${stats.total_pending}`);
  Logger.log(`  Total Poin: ${stats.total_points}`);
}

simulateDashboardLoad();
```

---

## Tips

1. **Copy-paste commands one at a time** ke GAS console
2. **Replace sample values** (CODE, phone numbers, etc)
3. **Check execution logs** setelah run command
4. **Look for patterns** - kalau semua menunjukkan 0, ada format mismatch

## If Dashboard Still Shows 0 After Testing

1. Check browser console (F12) untuk JavaScript errors
2. Verify column headers in sheets (case-sensitive!)
3. Check if data was actually saved by looking at sheet directly
4. Run `verifyReferralRecorded()` untuk confirm data was saved

---

**Generated:** 2026-01-23
**Use Case:** Quick debugging of dashboard stats showing 0
