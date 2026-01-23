# Dashboard Referral Stats - Issue & Solution Summary

## Problem Statement

📋 **Sheet:** Data referral SUDAH ADA (orang yang direferensikan, poin, voucher)

📊 **Dashboard:** Tapi menampilkan 0 untuk semua metrics:
- Orang Direferensikan: 0
- Pembelian Selesai: 0
- Menunggu Pembelian: 0
- Total Poin: 0

## Root Cause

**Data matching problem** - Ada kemungkinan:

1. ❌ **Column headers tidak match** (case-sensitive) antara sheet dan code
2. ❌ **Referral code format berbeda** (misal: "ADMI1542" vs "admin" vs "08794613258")
3. ❌ **Data belum tersimpan** ke sheet (meski frontend menunjukkan success)
4. ❌ **User login dengan whatsapp, bukan referral_code**

## Solution Implemented

### 1. Enhanced Logging in GAS Backend

**File:** `REFERRAL_BACKEND_GAS.gs`

#### Enhanced `getReferralStats()` function:
```javascript
// Now logs:
- Referral code being queried
- Total referrals in sheet
- How many referrals match the code
- User found or not
- Total points value
- Final result returned
```

#### Enhanced `getUserPointsHistory()` function:
```javascript
// Now logs:
- Referral code being queried
- Total records in points_history sheet
- How many records match the code
- Details of matched records
```

### 2. New Diagnostic Functions

**File:** `REFERRAL_BACKEND_GAS.gs`

New `diagnosticDashboardIssue()` function yang akan memberikan full picture:
- ✅ Cek user ada atau tidak
- ✅ Cek referrals yang exist
- ✅ Cek points history
- ✅ Cek vouchers
- ✅ Show summary

## How to Debug

### Step 1: Deploy Latest Code
1. Copy code dari `REFERRAL_BACKEND_GAS.gs`
2. Paste ke Google Apps Script editor
3. Click **Deploy** → **New deployment** (or update existing)

### Step 2: Check Execution Logs
1. Open Google Apps Script editor
2. Click **Execution log** (🐛 icon)
3. Search for recent referral queries
4. Look for detailed logs showing what data was queried and matched

### Step 3: Run Diagnostic Function
In Google Apps Script Console:

```javascript
// Test dengan referral code sebenarnya (misal: admin punya ADMI1542)
diagnosticDashboardIssue('ADMI1542');
```

**Output akan menunjukkan:**
```
🔍 DIAGNOSTIC: Testing referral code: "ADMI1542"
============================================================
✅ User found: admin
   - ID: USR-123456
   - Whatsapp: 62812345678
   - Referral Code: ADMI1542
   - Total Points: 10000

📋 REFERRALS: 1 found
   1. Rido Iphone (08794613258) - completed

💰 POINTS HISTORY: 1 records
   1. referral_reward - 10000 poin (23/01/2026)

🎟️ VOUCHERS: 1 found
   1. VOUCHER-5B93DZHDB (active)

============================================================
📊 SUMMARY:
   Total Referred: 1
   Completed: 1
   Pending: 0
   Total Points: 10000
   Vouchers: 1
```

### Step 4: Interpret Results

**If all metrics show 0 or NOT FOUND:**
- Check if referral code format is correct
- Verify column headers in sheets
- Check if data was actually saved by `processReferral`

**If metrics show values (> 0):**
- Data is correct in sheet
- Problem is in frontend display
- Check browser console for errors

## Data Flow Diagram

```
Frontend (referral.html)
    ↓
User logs in with referral_code: "ADMI1542"
    ↓
Dashboard calls: getReferralStatsFromGAS("ADMI1542")
    ↓
referral-helper.js sends API call
    ↓
GAS Backend (REFERRAL_BACKEND_GAS.gs)
    ↓
getReferralStats("ADMI1542") function:
  - Get all referrals from sheet
  - Filter by: r.referrer_code === "ADMI1542"
  - Count completed & pending
  - Get user points
    ↓
Return JSON with stats
    ↓
Frontend displays in dashboard cards
```

## Expected Column Headers

**Sheet must have EXACT column names (case-sensitive):**

### referrals sheet:
- `id`
- `referrer_phone`
- `referrer_code` ← ⚠️ Query matches this
- `referred_phone`
- `referred_name`
- `status`
- `first_order_id`
- `created_at`
- `completed_at`

### users sheet:
- `id`
- `nama`
- `whatsapp`
- `pin`
- `referral_code` ← ⚠️ User has this
- `referrer_id`
- `total_points` ← ⚠️ Used for dashboard
- `status`
- `created_at`
- `tanggal_daftar`

### points_history sheet:
- `id`
- `user_phone`
- `referral_code` ← ⚠️ Query matches this
- `transaction_date`
- `type`
- `amount`
- `balance_before`
- `balance_after`
- `description`
- `source_id`
- `created_at`

## Troubleshooting Checklist

- [ ] Latest GAS code deployed ✅
- [ ] Column headers match exactly (case-sensitive)
- [ ] User has referral_code set (not whatsapp)
- [ ] Data exists in referrals sheet for that code
- [ ] Execution logs show data matching
- [ ] Browser console shows correct referral_code being queried
- [ ] No JavaScript errors in browser console

## Key Files

- Backend: `/workspaces/gosembako/REFERRAL_BACKEND_GAS.gs`
- Frontend: `/workspaces/gosembako/referral.html`
- Helper: `/workspaces/gosembako/assets/js/referral-helper.js`
- Debug Guide: `/workspaces/gosembako/DASHBOARD_REFERRAL_STATS_DEBUG.md`

## Next Actions

1. Deploy enhanced GAS code
2. Open GAS execution logs
3. Run diagnostic function with correct referral code
4. Check if data is found
5. If found → debug frontend
6. If not found → check sheet column headers and data format

---

**Generated:** 2026-01-23
**Updated:** Enhanced logging added to GAS backend functions
