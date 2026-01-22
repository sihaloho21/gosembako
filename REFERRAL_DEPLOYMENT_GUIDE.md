# Panduan Deployment: Google Apps Script Backend untuk Referral System

**Tanggal:** 22 Januari 2026  
**Durasi Setup:** 15-20 menit  
**Kompleksitas:** Medium

---

## 📋 Overview

Google Apps Script (GAS) ini akan menangani:
- ✅ Process order baru dan track first-time purchases
- ✅ Auto-credit poin ke referrer
- ✅ Manage referral data (create/update referral records)
- ✅ Generate voucher untuk referred users
- ✅ Track points history untuk audit trail

**File yang diperlukan:**
- `REFERRAL_BACKEND_GAS.gs` - Google Apps Script code

---

## 🚀 STEP 1: Setup Google Apps Script Project (5 Menit)

### 1.1 Buka Google Apps Script

Ada 2 cara:

**Opsi A: Dari Google Sheets (Recommended)**
1. Buka Google Sheets Anda: https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID
2. Menu → **Tools** → **Script Editor**
3. Akan membuka `script.google.com` dengan project baru

**Opsi B: Direct**
1. Buka https://script.google.com
2. Klik **New project** di kiri

### 1.2 Rename Project

Di tab "Untitled project" di atas, klik dan rename menjadi:
```
GoSembako Referral Backend
```

### 1.3 Buat file baru

1. Klik **+ (New file)** icon
2. Pilih **Script**
3. Rename file ke: `Referral` (opsional, untuk organisasi)
4. Hapus template code yang ada

---

## 📝 STEP 2: Copy & Paste Script Code (5 Menit)

### 2.1 Copy dari File Lokal

Buka file `REFERRAL_BACKEND_GAS.gs` (file yang baru dibuat):
```
/workspaces/gosembako/REFERRAL_BACKEND_GAS.gs
```

**Copy semua kode** (Ctrl+A → Ctrl+C)

### 2.2 Paste ke Google Apps Script Editor

1. Di Google Apps Script editor, klik di area code (editor pane)
2. **Delete semua existing code** (dari template)
3. **Paste code** dari `REFERRAL_BACKEND_GAS.gs` (Ctrl+V)
4. Tekan **Ctrl+S** untuk save

**Expected result:** Code seharusnya tidak ada error (GAS akan validate saat save)

---

## 🔧 STEP 3: Authorize Script (2 Menit)

### 3.1 Set Up Authorization

1. Di Google Apps Script editor, klik **Run** button (ikon ▶)
2. Atau klik dropdown di sebelah Run → pilih function `testGetAllData`
3. Klik **Run**

### 3.2 Grant Permissions

Browser akan popup "Authorization required":
1. Klik **Review Permissions**
2. Pilih akun Google Anda
3. Klik **Allow** di "GoSembako Referral Backend wants to access your Google Drive"

**Tunggu** sampai popup hilang (mungkin 5-10 detik).

### 3.3 Check Execution Log

Di bawah editor, tab **Execution log** akan show:
```
[22-01-24 10:30:00] Started
[22-01-24 10:30:02] Completed successfully
```

Jika ada error, lihat di **Logs** tab.

---

## 🌐 STEP 4: Deploy as Web App (5 Menit)

### 4.1 Create Deployment

1. Klik **Deploy** button (ikon 🔗)
2. Klik **New deployment**

### 4.2 Select Type

Di dialog "Create a new deployment":
1. Klik dropdown **Select type**
2. Pilih **Web app**

### 4.3 Configure Deployment

Isi fields berikut:

| Field | Value | Notes |
|---|---|---|
| **Execute as** | Me (your email) | Script akan run dengan permission Anda |
| **Who has access** | Anyone | Frontend perlu akses tanpa login |

**PENTING:** Jangan ubah "Who has access" ke "Anyone" sebelum deploy! Harus "Anyone" biar frontend bisa call API.

### 4.4 Deploy

1. Klik tombol **Deploy** (biru)
2. Tunggu 5-10 detik

### 4.5 Copy URL

Setelah selesai, akan ada dialog:
```
Deployment successful!

New web app URL:
https://script.google.com/macros/d/[DEPLOYMENT_ID]/userweb
```

**Copy URL ini!** (atau klik icon copy)

---

## 📌 STEP 5: Add URL ke Frontend Config (2 Menit)

### 5.1 Update assets/js/config.js

Buka file: `/workspaces/gosembako/assets/js/config.js`

Cari section CONFIG object, tambah:

```javascript
// Google Apps Script URLs untuk backend processing
const GAS_URLS = {
    MAIN: 'https://script.google.com/macros/d/[YOUR_DEPLOYMENT_ID]/userweb',
    // ... atau dari localStorage jika ingin dynamic
};

function getGASUrl() {
    // Check localStorage untuk custom GAS URL (set via admin panel)
    const customGASUrl = localStorage.getItem('gas_url');
    return customGASUrl || GAS_URLS.MAIN;
}
```

**Replace `[YOUR_DEPLOYMENT_ID]`** dengan actual ID dari URL di step 4.5

**Contoh URL:**
```
https://script.google.com/macros/d/1R3-pqF4jK2L5mN8oP9qRsT0uVwXyZaBcDeFgHiJkLmNoPqRsT/userweb
```

### 5.2 Verify di Browser Console

1. Buka website Anda
2. Buka Browser Console (F12)
3. Type dan enter:

```javascript
CONFIG.getGASUrl()
// Harusnya output URL dari step 4.5
```

---

## 🧪 STEP 6: Testing (5 Menit)

### Test 1: Check GAS API Status

Buka browser, copy-paste URL deployment:

```
https://script.google.com/macros/d/[YOUR_DEPLOYMENT_ID]/userweb?action=getStats
```

**Expected response:**
```json
{
  "success": true,
  "message": "API is working",
  "referral_config": {
    "REFERRER_REWARD": 10000,
    "REFERRED_DISCOUNT": 25000,
    "REFERRED_DISCOUNT_PERCENT": 10,
    "VOUCHER_EXPIRY_DAYS": 30
  },
  "sheets_available": ["users", "orders", "referrals", "points_history", "vouchers"]
}
```

✅ Jika response ini muncul → API working!

### Test 2: Test dari Apps Script Logger

1. Kembali ke Google Apps Script editor
2. Klik dropdown di sebelah **Run** button
3. Pilih function: `testListUsers`
4. Klik **Run**
5. Buka **Logs** tab (Ctrl+Enter untuk shortcut)

**Expected output:**
```
[22-01-24 10:45:00] 🧪 Listing all users...
[22-01-24 10:45:01] Budi (081234567890) - Ref: BUDI1234, Points: 0
[22-01-24 10:45:01] Andi (081567890123) - Ref: ANDI5678, Points: 0
```

### Test 3: Manual Referral Processing Test

1. Pastikan ada data di Google Sheets:
   - Sheet `users`: Minimal 2 users (1 referrer, 1 referred dengan referrer_id terisi)
   - Sheet `orders`: Sudah ada 1 order (untuk test)

2. Di Apps Script editor, klik dropdown di sebelah **Run**
3. Pilih: `testProcessReferral`
4. **Klik Run**
5. Buka **Logs** tab

**Expected output:**
```
[22-01-24 10:50:00] 🔄 Processing referral for order: ORD-001
[22-01-24 10:50:02] ✅ Buyer found: Test User
[22-01-24 10:50:02] ✅ Buyer adalah referred user, referrer_id: BUDI1234
[22-01-24 10:50:02] ✅ Referrer found: Budi
[22-01-24 10:50:02] 💰 Crediting referrer with 10000 points
[22-01-24 10:50:03] ✅ Referrer points updated: 10000
[22-01-24 10:50:03] ✅ Referral record created: REF-1705985402123
[22-01-24 10:50:03] ✅ Points history recorded
[22-01-24 10:50:03] ✅ Voucher created: DISC10K-A7X9Q
```

✅ Jika semua ini muncul → referral processing working!

---

## 🔗 STEP 7: Integrate dengan Frontend (3 Menit)

### 7.1 Update referral-helper.js

File: `/workspaces/gosembako/assets/js/referral-helper.js`

Tambah function baru untuk call GAS API:

```javascript
/**
 * Call Google Apps Script untuk process referral
 */
async function callGASAPI(action, data) {
    try {
        const gasUrl = CONFIG.getGASUrl();
        if (!gasUrl) {
            console.error('GAS URL tidak dikonfigurasi');
            return { success: false, message: 'GAS URL not configured' };
        }
        
        const response = await fetch(gasUrl, {
            method: 'POST',
            payload: JSON.stringify({
                action: action,
                ...data
            })
        });
        
        const result = await response.json();
        console.log('🔗 GAS Response:', result);
        
        return result;
    } catch (error) {
        console.error('❌ GAS API Error:', error);
        return { success: false, message: error.toString() };
    }
}

/**
 * Process order referral (dipanggil setelah order berhasil)
 */
async function processOrderReferral(orderId, phone, name) {
    console.log('📤 Processing referral untuk order:', orderId);
    
    const result = await callGASAPI('processReferral', {
        orderId: orderId,
        phone: phone,
        name: name
    });
    
    if (result.referralProcessed) {
        console.log('✅ Referral berhasil di-process!');
        console.log('   Referrer dapat reward:', result.referrer_reward, 'poin');
        console.log('   Voucher untuk referred user:', result.voucher_code);
    }
    
    return result;
}

/**
 * Get referral stats dari GAS
 */
async function getReferralStatsFromGAS(referralCode) {
    const result = await callGASAPI('getReferralStats', {
        referralCode: referralCode
    });
    
    return result;
}
```

### 7.2 Update script.js Order Processing

File: `/workspaces/gosembako/assets/js/script.js`

Cari section yang process order (baris ~1384), update untuk call GAS:

```javascript
// Setelah order successfully logged to SheetDB:
if (window.referralOrderIntegration) {
    setTimeout(() => {
        // Call GAS backend untuk process referral
        processOrderReferral(
            orderId,
            normalizePhone(phone),
            name
        ).then(result => {
            if (result.referralProcessed) {
                console.log('✅ Referral reward processed');
                // Optional: show notification tentang referral
                showToastNotification(
                    `Referral processed! ${result.referrer_name} dapat ${result.referrer_reward} poin`
                );
            }
        }).catch(err => {
            console.error('Error processing referral:', err);
        });
    }, 2000);
}
```

---

## 📊 Troubleshooting

### Q: "Deployment ID not found" saat di browser?

**A:** 
1. Pastikan URL di config.js benar (copy-paste lagi)
2. Pastikan DEPLOYMENT_ID tidak di-cut di tengah
3. Test langsung di browser dengan full URL

### Q: Sheets tidak ter-update setelah run testProcessReferral?

**A:**
1. Cek di Google Sheets manual (refresh page)
2. Buka **Logs** di Apps Script → lihat error messages
3. Ensure sheet names exact match: `users`, `referrals`, `points_history`

### Q: Error "Spreadsheet not found"?

**A:**
1. Check bahwa GAS project dibuat dari Google Sheets (linknya sudah auto-correct)
2. Atau set `SPREADSHEET_ID` manual:
   ```javascript
   const SPREADSHEET_ID = 'COPY_YOUR_SHEET_ID_HERE';
   ```

### Q: "Anyone" access tidak bisa dipilih?

**A:**
1. Ini tergantung setting Google Workspace Anda
2. Hubungi admin jika di workspace terbatas
3. Alternatif: buat deployment dengan "Specific people" dan list email

---

## 🔄 Apa Selanjutnya?

Setelah GAS Backend deployed:

### 1. Update Frontend Scripts
- `referral-helper.js` - integrate dengan GAS API ✅
- `script.js` - call GAS saat order processed ✅
- `config.js` - add GAS URL ✅

### 2. Create Referral Dashboard (`referral.html`)
- Display user's referral code
- Share buttons
- Referral stats
- Points history
- Voucher redemption

### 3. Admin Panel Updates
- Admin dapat set GAS URL (untuk flexibility)
- View all referrals
- Manual credit/debit points
- Generate reports

---

## 📝 Files Modified

```
✏️ Modified:
- assets/js/config.js          (Add GAS URL config)
- assets/js/referral-helper.js (Add GAS integration functions)
- assets/js/script.js          (Call GAS saat order process)

✨ New:
- REFERRAL_BACKEND_GAS.gs     (Deployed as Web App)
- REFERRAL_DEPLOYMENT_GUIDE.md (This file)
```

---

## ✅ Deployment Checklist

- [ ] Buka Google Apps Script editor dari Google Sheets
- [ ] Copy-paste code dari REFERRAL_BACKEND_GAS.gs
- [ ] Save code (Ctrl+S)
- [ ] Run testGetAllData untuk authorize
- [ ] Grant permissions di popup
- [ ] Create deployment → Select "Web app"
- [ ] Set "Execute as" = Me, "Who has access" = Anyone
- [ ] Deploy dan copy URL
- [ ] Paste URL ke config.js (replace DEPLOYMENT_ID)
- [ ] Test ?action=getStats di browser
- [ ] Test testListUsers dari Apps Script editor
- [ ] Test testProcessReferral dari Apps Script editor
- [ ] Update frontend scripts (referral-helper.js, script.js)
- [ ] Do end-to-end testing

---

**Status:** ✅ Ready untuk Deployment

Next: Tahap 3 - Create Referral Dashboard Frontend 🎨
