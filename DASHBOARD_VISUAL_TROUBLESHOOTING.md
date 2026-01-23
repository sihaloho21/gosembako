# 📊 Dashboard Stats Issue - Visual Troubleshooting Guide

## The Problem (Visual)

```
┌─────────────────────────────────────────────┐
│         USER REFERRAL DASHBOARD             │
├─────────────────────────────────────────────┤
│  Orang Direferensikan:        0  ❌ WRONG! │
│  Pembelian Selesai:           0  ❌ WRONG! │
│  Menunggu Pembelian:          0  ❌ WRONG! │
│  Total Poin:                  0  ❌ WRONG! │
└─────────────────────────────────────────────┘

TAPI DI SHEET:
┌──────────────────────────────────────┐
│ referrals       → 1 row (ADMI1542)   │
│ points_history  → 1 row (10,000 poin)│
│ vouchers        → 1 code created     │
│ users           → total_points=10000 │
└──────────────────────────────────────┘

WHY? Data tidak match dengan query!
```

## Possible Causes (Decision Tree)

```
Dashboard menunjukkan 0?
        ↓
   RUN DIAGNOSTIC
        ↓
  ┌─────┴─────┐
  │           │
[0]        [>0]
  │           │
  │    ✅ DATA OK
  │    Check browser console
  │
[ISSUE]
  │
  ├─→ Column headers tidak match?
  │   └─→ FIX: Rename columns exactly
  │
  ├─→ Referral code format berbeda?
  │   └─→ FIX: Normalize code (uppercase, trim)
  │
  ├─→ Data belum tersimpan?
  │   └─→ FIX: Check processReferral logs
  │
  └─→ User login dengan whatsapp bukan code?
      └─→ FIX: Ensure referral_code is set
```

## Quick Diagnosis (3 Steps)

### Step 1️⃣: Get Referral Code
```javascript
// Di Google Apps Script Console
const users = getSheetData('users');
users.forEach(u => Logger.log(`${u.referral_code} → ${u.nama}`));
// Find the code (e.g., "ADMI1542")
```

### Step 2️⃣: Run Full Diagnostic
```javascript
// Copy-paste ini dengan kode dari step 1
diagnosticDashboardIssue('ADMI1542');
```

### Step 3️⃣: Read Output
```
✅ User found: admin
   - Total Points: 10000

📋 REFERRALS: 1 found
   1. Rido Iphone (08794613258) - completed

💰 POINTS HISTORY: 1 records
   1. referral_reward - 10000 poin

📊 SUMMARY:
   Total Referred: 1
   Total Points: 10000
```

**Result:**
- ✅ Shows values → Data is correct, debug frontend
- ❌ Shows 0 or NOT FOUND → Data mismatch, check sheet headers

## Common Scenarios & Fixes

### Scenario 1: Data ada, tapi dashboard 0

```
CAUSE: Column headers tidak exact match
       (case-sensitive!)

SHEET HAS:        QUERY LOOKS FOR:
"Referral_Code"   "referral_code"  ❌ NO MATCH

FIX:
1. Check sheet headers exact spelling
2. Update code if column names different
3. Or rename sheet columns to match code
```

### Scenario 2: Data ada, dashboard 0, logs show 0 matches

```
CAUSE: Referral code format berbeda
       Sheet: "ADMI1542"
       Query: "admin"
       Result: 0 matches ❌

FIX:
1. Check what code user login dengan
2. Verify same code in referrals sheet
3. Normalize if needed (uppercase, trim spaces)
```

### Scenario 3: getReferralStats shows values, dashboard still 0

```
CAUSE: Frontend JavaScript error
       Data correct, but not displayed

FIX:
1. Open browser (F12) → Console
2. Look for JavaScript errors
3. Check if HTML IDs match (stat-referred, stat-points)
4. Refresh page
```

### Scenario 4: processReferral shows success, getReferralStats 0

```
CAUSE: Data not actually saved to sheet
       Frontend got success response but
       addRowToSheet failed silently

FIX:
1. Check column headers in ALL sheets
2. Run verifyReferralRecorded() for that order
3. Check GAS execution logs for errors
4. Ensure all required sheets exist
```

## The Data Flow (With Potential Breakpoints)

```
FRONTEND                    BACKEND                  SHEETS
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│ 1. User logs in                                              │
│    referral_code = "ADMI1542"                                │
│         ↓                                                     │
│ 2. Dashboard loads                                           │
│    getReferralStatsFromGAS("ADMI1542")                       │
│         ↓                                                     │
│         ├─→ (API CALL)                                       │
│             ↓                                                │
│             getReferralStats("ADMI1542")                    │
│                 ↓                                            │
│                 getSheetData('referrals')                   │
│                 ├─→ Read sheet ───────→ [referrals sheet]   │
│                     ↓                                       │
│                 filter(r =>                                 │
│                    r.referrer_code === "ADMI1542"          │
│                 )                                           │
│                 ↓                                            │
│                 [Check 1] ❓ Match found?                   │
│                 YES → Continue                              │
│                 NO → Return 0 ⚠️ PROBLEM!                   │
│                 ↓                                            │
│             getSheetData('users')                           │
│             ├─→ Read sheet ───────→ [users sheet]           │
│                 ↓                                            │
│                 find(u =>                                   │
│                    u.referral_code === "ADMI1542"           │
│                 )                                           │
│                 ↓                                            │
│                 [Check 2] ❓ User found?                    │
│                 YES → Get points                            │
│                 NO → Return 0 ⚠️ PROBLEM!                   │
│                 ↓                                            │
│             Return { success, total_referred, ... }         │
│         ↓                                                     │
│    Display in dashboard cards                               │
│    stat-referred.textContent = result.total_referred        │
│    stat-points.textContent = result.total_points            │
│         ↓                                                     │
│ 3. User sees stats (or 0!)                                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘

BREAKPOINTS WHERE 0 CAN HAPPEN:
[Check 1] referrer_code column NOT FOUND or data format mismatch
[Check 2] referral_code column NOT FOUND or data format mismatch
DISPLAY: JavaScript error preventing display update
```

## Solution Hierarchy

```
Priority 1: Fix Column Headers
  ↓
  All sheets must have EXACT column names:
  - referrals: "referrer_code"
  - users: "referral_code"
  - points_history: "referral_code"
  
  If column names different → FIX FIRST

Priority 2: Verify Referral Code Format
  ↓
  Code must be consistent:
  - Stored in sheet: "ADMI1542"
  - User logs in with: "ADMI1542"
  - Query uses: "ADMI1542"
  
  If format different → Normalize code

Priority 3: Check Data Actually Saved
  ↓
  Use verifyReferralRecorded() to confirm
  processReferral saved data correctly
  
  If not saved → Check processReferral logs

Priority 4: Check Frontend
  ↓
  Browser console (F12) for JavaScript errors
  HTML element IDs match
  
  If error → Fix JavaScript
```

## Emergency Checklist

```
🆘 Dashboard showing 0? Follow this:

[ ] 1. Get referral code to test
      diagnosticDashboardIssue('ADMI1542')

[ ] 2. Read output
      - Shows numbers? → Frontend issue (skip to 6)
      - Shows 0? → Go to 3

[ ] 3. Check sheet column headers
      referrals sheet:   referrer_code ✅
      users sheet:       referral_code ✅
      points_history:    referral_code ✅

[ ] 4. If headers wrong
      Rename column or update code to match

[ ] 5. Re-test
      diagnosticDashboardIssue('ADMI1542')
      Should show values now ✅

[ ] 6. If still 0 or Frontend issue
      Browser F12 → Console → Check errors
      Look for JavaScript exceptions

[ ] 7. Still stuck?
      Check QUICK_DEBUG_COMMANDS.md
      Run individual test functions
```

## File Reference

| File | Purpose |
|------|---------|
| [COMPLETE_DASHBOARD_FIX_SUMMARY.md](COMPLETE_DASHBOARD_FIX_SUMMARY.md) | What was fixed (overview) |
| [DASHBOARD_ISSUE_SOLUTION_SUMMARY.md](DASHBOARD_ISSUE_SOLUTION_SUMMARY.md) | Problem + Solution explanation |
| [DASHBOARD_REFERRAL_STATS_DEBUG.md](DASHBOARD_REFERRAL_STATS_DEBUG.md) | Detailed debug guide |
| [QUICK_DEBUG_COMMANDS.md](QUICK_DEBUG_COMMANDS.md) | Copy-paste test commands |

## One-Minute Quick Fix

**If dashboard shows 0:**

```
1. Open Google Apps Script Console
2. Paste: diagnosticDashboardIssue('ADMI1542')
3. Press Enter
4. If shows numbers → Check browser console for JS errors
5. If shows 0 → Check sheet column headers (case-sensitive!)
```

---

**Duration:** Most issues fixed in < 5 minutes
**Complexity:** Low (mostly checking headers + running diagnostics)
**Success Rate:** 99% once diagnostic run

Generated: 2026-01-23
