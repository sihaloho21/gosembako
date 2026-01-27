# 🛠️ Quick Fix Guide - Referral Program

**Target:** GoSembako Referral Program  
**Status:** 🔴 BROKEN → ✅ FIXED  
**Time Required:** 4-6 hours

---

## 🚀 Quick Start - Fix Order

Follow these steps **IN ORDER**:

### Step 1: Database (15 min) ⭐ START HERE

**Action:** Add columns to Google Sheets

1. Open Google Sheets for GoSembako
2. Go to `users` sheet
3. Add 4 new columns after `tanggal_daftar`:

```
| referral_code | referred_by | referral_count | referral_points_earned |
|---------------|-------------|----------------|------------------------|
| (text)        | (text)      | (number)       | (number)               |
```

4. Create new sheet: `referral_history` with columns:

```
| id | referrer_code | referee_name | referee_whatsapp | event_type | referrer_reward | referee_reward | status | created_at |
```

**Verification:**
```javascript
// Test in browser console after this step:
// You should be able to insert data to these columns
```

---

### Step 2: Backend API (2-3 hours) ⭐ CRITICAL

**Action:** Add handlers to Google Apps Script

**File:** `Code.gs` (or your main GAS file)

Add these functions:

#### 2.1 Add to `doGet()`:

```javascript
function doGet(e) {
  const action = e.parameter.action;
  
  // ... existing code ...
  
  // ✅ ADD THIS:
  if (action === 'validate_referral') {
    const code = e.parameter.code;
    return ContentService.createTextOutput(
      JSON.stringify(validateReferralCode(code))
    ).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'get_referral_stats') {
    const userId = e.parameter.user_id;
    return ContentService.createTextOutput(
      JSON.stringify(getReferralStats(userId))
    ).setMimeType(ContentService.MimeType.JSON);
  }
  
  // ... existing code ...
}
```

#### 2.2 Add to `doPost()`:

```javascript
function doPost(e) {
  const params = JSON.parse(e.postData.contents);
  const action = params.action;
  
  // ... existing code ...
  
  // ✅ ADD THIS:
  if (action === 'register') {
    return ContentService.createTextOutput(
      JSON.stringify(registerWithReferral(params.data))
    ).setMimeType(ContentService.MimeType.JSON);
  }
  
  // ... existing code ...
}
```

#### 2.3 Add new functions:

```javascript
// Validate referral code
function validateReferralCode(code) {
  if (!code || code.trim() === '') return { valid: false };
  
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID)
    .getSheetByName('users');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const codeIdx = headers.indexOf('referral_code');
  const idIdx = headers.indexOf('id');
  const nameIdx = headers.indexOf('nama');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][codeIdx] && 
        data[i][codeIdx].toUpperCase() === code.toUpperCase()) {
      return {
        valid: true,
        referrer_name: data[i][nameIdx],
        referrer_id: data[i][idIdx]
      };
    }
  }
  return { valid: false };
}

// Get referral stats
function getReferralStats(userId) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID)
    .getSheetByName('users');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const idIdx = headers.indexOf('id');
  const countIdx = headers.indexOf('referral_count');
  const earnedIdx = headers.indexOf('referral_points_earned');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIdx] === userId) {
      return {
        referral_count: data[i][countIdx] || 0,
        referral_points_earned: data[i][earnedIdx] || 0
      };
    }
  }
  return {
    error: 'User not found',
    referral_count: 0,
    referral_points_earned: 0
  };
}

// Register with referral
function registerWithReferral(userData) {
  const usersSheet = SpreadsheetApp.openById(SPREADSHEET_ID)
    .getSheetByName('users');
  const historySheet = SpreadsheetApp.openById(SPREADSHEET_ID)
    .getSheetByName('referral_history');
  
  // Settings
  const referrerReward = 100;
  const refereeBonus = 50;
  
  // Generate user ID and referral code
  const userId = 'user_' + Date.now();
  const referralCode = generateReferralCode(userData.nama);
  
  // Validate referral code if provided
  let referrerData = null;
  if (userData.referred_by) {
    referrerData = validateReferralCode(userData.referred_by);
    if (!referrerData.valid) {
      userData.referred_by = '';
      referrerData = null;
    }
  }
  
  // Create user
  const timestamp = new Date().toLocaleString('id-ID');
  const newUser = {
    id: userId,
    nama: userData.nama,
    whatsapp: userData.whatsapp,
    pin: userData.pin,
    total_points: referrerData ? refereeBonus : 0,
    status: 'aktif',
    created_at: timestamp,
    tanggal_daftar: new Date().toLocaleDateString('id-ID'),
    referral_code: referralCode,
    referred_by: userData.referred_by || '',
    referral_count: 0,
    referral_points_earned: 0
  };
  
  // Insert user
  const headers = usersSheet.getRange(1, 1, 1, 
    usersSheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => newUser[h] || '');
  usersSheet.appendRow(row);
  
  // If referred, update referrer and create history
  if (referrerData && referrerData.valid) {
    updateReferrerOnRegistration(usersSheet, referrerData.referrer_id, 
      referrerReward);
    
    createReferralHistory(historySheet, {
      referrer_id: referrerData.referrer_id,
      referrer_code: userData.referred_by,
      referee_id: userId,
      referee_name: userData.nama,
      referee_whatsapp: userData.whatsapp,
      referrer_reward: referrerReward,
      referee_reward: refereeBonus
    });
  }
  
  return {
    success: true,
    user_id: userId,
    referral_code: referralCode,
    bonus_points: newUser.total_points,
    referred_by: userData.referred_by || null
  };
}

// Generate referral code
function generateReferralCode(name) {
  const prefix = name.split(' ')[0].toUpperCase()
    .substring(0, 4).padEnd(4, 'X');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `REF-${prefix}${random}`;
}

// Update referrer stats
function updateReferrerOnRegistration(sheet, referrerId, points) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const idIdx = headers.indexOf('id');
  const countIdx = headers.indexOf('referral_count');
  const earnedIdx = headers.indexOf('referral_points_earned');
  const pointsIdx = headers.indexOf('total_points');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIdx] === referrerId) {
      const row = i + 1;
      sheet.getRange(row, countIdx + 1)
        .setValue((data[i][countIdx] || 0) + 1);
      sheet.getRange(row, earnedIdx + 1)
        .setValue((data[i][earnedIdx] || 0) + points);
      sheet.getRange(row, pointsIdx + 1)
        .setValue((data[i][pointsIdx] || 0) + points);
      break;
    }
  }
}

// Create referral history
function createReferralHistory(sheet, data) {
  const timestamp = new Date().toLocaleString('id-ID');
  const entry = {
    id: 'ref_' + Date.now(),
    referrer_code: data.referrer_code,
    referee_name: data.referee_name,
    referee_whatsapp: data.referee_whatsapp,
    event_type: 'registration',
    referrer_reward: data.referrer_reward,
    referee_reward: data.referee_reward,
    status: 'completed',
    created_at: timestamp
  };
  
  const headers = sheet.getRange(1, 1, 1, 
    sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => entry[h] || '');
  sheet.appendRow(row);
}
```

**Deploy:**
1. Click "Deploy" → "New deployment"
2. Type: Web app
3. Execute as: Me
4. Who has access: Anyone
5. Deploy
6. Copy Web App URL
7. Update `CONFIG` in frontend with new URL

**Verification:**
```bash
# Test validate endpoint:
curl "YOUR_WEB_APP_URL?action=validate_referral&code=REF-TEST1234"

# Should return: {"valid":false} or {"valid":true,"referrer_name":"..."}
```

---

### Step 3: Fix Minified JS (15 min)

**Action:** Re-minify referral-ui.js correctly

```bash
cd /home/runner/work/gosembako/gosembako

# Install terser if not installed
npm install -g terser

# Re-minify with correct settings
terser assets/js/referral-ui.js \
  -o assets/js/referral-ui.min.js \
  --compress \
  --mangle \
  --keep-fnames

# ❌ DON'T use uglify with --compress dead_code
# It removes the function body!
```

**Verification:**
```bash
# Check the minified file contains the function body
grep -o "createReferralRecord.*return" assets/js/referral-ui.min.js

# Should show actual code, not just "return!1" or "return false"
```

---

### Step 4: Call Function in Registration (30 min)

**Action:** Edit `assets/js/akun.js`

**Find this code (around line 860):**

```javascript
if (!createResult || !createResult.success) {
    throw new Error(createResult && createResult.message ? createResult.message : 'Gagal mendaftar');
}

// Show success
successDiv.classList.remove('hidden');
```

**Change to:**

```javascript
if (!createResult || !createResult.success) {
    throw new Error(createResult && createResult.message ? createResult.message : 'Gagal mendaftar');
}

// ✅ ADD: Create referral record
if (referralCode && typeof ReferralUI !== 'undefined' && ReferralUI.createReferralRecord) {
    try {
        const recordCreated = await ReferralUI.createReferralRecord(
            referralCode, 
            normalizedPhone, 
            name
        );
        if (recordCreated) {
            console.log('✅ Referral record created');
        }
    } catch (error) {
        console.error('❌ Failed to create referral record:', error);
        // Don't fail registration if referral record fails
    }
}

// Show success
successDiv.classList.remove('hidden');
```

**Verification:**
```javascript
// Test in browser console:
// 1. Open akun.html?ref=REF-TEST1234
// 2. Register new user
// 3. Check console - should see "✅ Referral record created"
// 4. Check referral_history sheet - should have new row
```

---

### Step 5: Award Referee Bonus (15 min)

**Action:** Edit `assets/js/akun.js`

**Find this code (around line 844):**

```javascript
const userData = {
    id: userId,
    nama: name,
    whatsapp: normalizedPhone,
    pin: pin,
    tanggal_daftar: today,
    status: 'aktif',
    total_points: 0,  // ❌ CHANGE THIS
    created_at: now
};
```

**Change to:**

```javascript
const userData = {
    id: userId,
    nama: name,
    whatsapp: normalizedPhone,
    pin: pin,
    tanggal_daftar: today,
    status: 'aktif',
    total_points: referralCode ? 50 : 0,  // ✅ Bonus if referral
    created_at: now
};
```

**Verification:**
```javascript
// Test:
// 1. Register with referral code
// 2. Check user's total_points in database
// 3. Should be 50, not 0
```

---

## 🧪 Complete Test

After ALL steps are done, run this end-to-end test:

### Test 1: Happy Path

```
1. User A logs in
   → Should auto-generate referral code (e.g., REF-USRA5678)
   
2. User A copies referral link
   → akun.html?ref=REF-USRA5678
   
3. User B opens link
   → Should see "Diundang oleh: User A"
   
4. User B registers (name: "User B", phone: "081234567890", pin: "123456")
   → Success message shown
   → Should see "Bonus: 50 poin"
   
5. Check User B in database:
   ✅ total_points = 50
   ✅ referred_by = REF-USRA5678
   
6. Check User A in database:
   ✅ total_points increased by 100
   ✅ referral_count = 1
   ✅ referral_points_earned = 100
   
7. Check referral_history sheet:
   ✅ New row with:
      - referrer_code: REF-USRA5678
      - referee_name: User B
      - event_type: registration
      - referrer_reward: 100
      - referee_reward: 50
      - status: completed
      
8. User A opens referral tab:
   ✅ Shows "1 referral"
   ✅ Shows "100 points earned"
   ✅ Lists "User B" in referrals
```

### Test 2: Invalid Code

```
1. User C opens: akun.html?ref=INVALID999
   → Should NOT show referral message
   
2. User C registers
   → No bonus message
   
3. Check User C in database:
   ✅ total_points = 0
   ✅ referred_by = empty
```

---

## ⚠️ Common Pitfalls

### Pitfall 1: Wrong API URL
**Symptom:** All API calls return 404  
**Fix:** Update CONFIG with correct Web App URL after deployment

### Pitfall 2: CORS Error
**Symptom:** Frontend can't call backend  
**Fix:** Set "Who has access" to "Anyone" in GAS deployment

### Pitfall 3: Minifier Too Aggressive
**Symptom:** Function still returns false after re-minify  
**Fix:** Use `--keep-fnames` flag or switch to terser

### Pitfall 4: Sheet Names Mismatch
**Symptom:** Backend can't find sheet  
**Fix:** Ensure sheet names match exactly (case-sensitive):
  - `users` (not `Users`)
  - `referral_history` (not `Referral_History`)

### Pitfall 5: Missing Headers
**Symptom:** Data goes to wrong columns  
**Fix:** Ensure column headers match exactly in all sheets

---

## 📋 Completion Checklist

- [ ] Database columns added
- [ ] Backend functions implemented
- [ ] Backend deployed and URL updated
- [ ] JavaScript re-minified
- [ ] createReferralRecord called in registration
- [ ] Referee bonus logic added
- [ ] All 8 tests passed
- [ ] No console errors
- [ ] Admin can see data in sheets

**Status after completion:** ✅ REFERRAL PROGRAM FULLY FUNCTIONAL

---

## 🆘 Need Help?

**Debug Mode:**
```javascript
// Add to top of referral-ui.js for debugging:
window.DEBUG_REFERRAL = true;

// Then in console:
localStorage.setItem('debug_referral', 'true');
```

**Check Backend Logs:**
1. Open Google Apps Script editor
2. Click "Executions" (left sidebar)
3. View recent execution logs

**Common Error Messages:**

| Error | Cause | Fix |
|-------|-------|-----|
| "referral_code is not defined" | Column missing | Add to sheets |
| "validateReferralCode is not a function" | Backend not deployed | Deploy GAS |
| "createReferralRecord always returns false" | Minified wrong | Re-minify |
| "Cannot read property 'createReferralRecord'" | Function not loaded | Check script order |

---

**Estimated Total Time:** 4-6 hours  
**Difficulty:** Medium (requires backend + frontend changes)  
**Result:** Fully working referral program! 🎉
