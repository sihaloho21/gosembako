# 🎁 Program Referral GoSembako - Final Implementation

**Project:** GoSembako E-commerce Platform  
**Feature:** Referral Program (Ajak Teman, Dapat Poin)  
**Version:** 2.0 - Custom untuk GoSembako  
**Date:** 26 Januari 2026

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Database Structure](#database-structure)
3. [Backend API (Google Apps Script)](#backend-api-google-apps-script)
4. [Frontend Implementation](#frontend-implementation)
5. [User Flow](#user-flow)
6. [Reward System](#reward-system)
7. [Admin Panel](#admin-panel)
8. [Implementation Steps](#implementation-steps)

---

## 🎯 Overview

### Tujuan Program Referral
- Meningkatkan user acquisition melalui word-of-mouth marketing
- Memberikan reward kepada user yang mengajak teman/keluarga
- Membangun community engagement

### Key Features
1. ✅ Setiap user mendapat kode referral unik setelah registrasi
2. ✅ **Auto-tracking referral dari URL** (tidak perlu input manual)
3. ✅ Referrer mendapat poin bertingkat:
   - +100 poin saat referee registrasi
   - +50 poin saat referee order pertama
   - +200 poin saat referee order 5x
   - +500 poin saat total referral mencapai 10 orang
4. ✅ Referee mendapat bonus 50 poin saat registrasi
5. ✅ Tracking referral di halaman akun
6. ✅ Admin bisa monitoring referral activity

---

## 🗄️ Database Structure

### Sheet: `users` (EXISTING - UPDATE)

**Kolom yang sudah ada:**
- `id` - User ID (contoh: `user_1234567890`)
- `nama` - Nama user
- `whatsapp` - Nomor WhatsApp
- `pin` - PIN untuk login
- `total_points` - Total poin user
- `status` - Status user
- `created_at` - Timestamp registrasi
- `tanggal_daftar` - Tanggal registrasi

**Kolom BARU yang perlu ditambahkan:**

| Kolom | Tipe | Deskripsi | Contoh | Default |
|-------|------|-----------|--------|---------|
| **`referral_code`** | String | Kode referral unik | `REF-BUDI123` | Auto-generated |
| **`referred_by`** | String | Kode referral yang digunakan saat daftar | `REF-JOHN456` | Empty string |
| **`referral_count`** | Number | Jumlah orang yang daftar pakai kode ini | `5` | `0` |
| **`referral_points_earned`** | Number | Total poin dari referral | `500` | `0` |

**Cara menambahkan kolom:**
1. Buka Google Sheets
2. Klik kolom terakhir (`tanggal_daftar`)
3. Insert 4 kolom baru di sebelah kanan
4. Beri nama sesuai tabel di atas

---

### Sheet: `referral_history` (NEW)

Sheet baru untuk tracking detail referral activity:

| Kolom | Tipe | Deskripsi | Contoh |
|-------|------|-----------|--------|
| `id` | String | Referral transaction ID | `ref_1234567890` |
| `referrer_id` | String | User ID yang punya kode referral | `user_1234567890` |
| `referrer_code` | String | Kode referral yang digunakan | `REF-BUDI123` |
| `referee_id` | String | User ID yang daftar pakai kode | `user_9876543210` |
| `referee_name` | String | Nama user yang daftar | `Siti Aminah` |
| `referee_whatsapp` | String | WhatsApp user yang daftar | `081234567890` |
| `event_type` | String | Jenis event | `registration`, `first_order`, `fifth_order`, `milestone_10` |
| `referrer_reward` | Number | Poin reward untuk referrer | `100` |
| `referee_reward` | Number | Poin bonus untuk referee | `50` |
| `status` | String | Status referral | `completed` |
| `created_at` | String | Tanggal referral | `2026-01-26 10:30:00` |

**Cara membuat sheet baru:**
1. Klik tanda `+` di bawah tab sheet
2. Rename sheet menjadi `referral_history`
3. Isi header row dengan kolom-kolom di atas

---

### Sheet: `referral_milestones` (NEW)

Sheet untuk tracking milestone rewards:

| Kolom | Tipe | Deskripsi | Contoh |
|-------|------|-----------|--------|
| `id` | String | Milestone ID | `milestone_1234567890` |
| `user_id` | String | User ID yang mencapai milestone | `user_1234567890` |
| `user_name` | String | Nama user | `Budi Santoso` |
| `milestone_type` | String | Jenis milestone | `referral_10`, `referral_20`, `referral_50` |
| `referral_count` | Number | Jumlah referral saat milestone | `10` |
| `reward_points` | Number | Poin reward | `500` |
| `achieved_at` | String | Tanggal tercapai | `2026-01-26 10:30:00` |

---

### Sheet: `referral_settings` (NEW)

Sheet untuk konfigurasi reward:

| setting_key | setting_value | description |
|-------------|---------------|-------------|
| `referrer_registration_reward` | `100` | Poin untuk referrer saat referee registrasi |
| `referee_registration_bonus` | `50` | Poin bonus untuk referee saat registrasi |
| `referrer_first_order_reward` | `50` | Poin untuk referrer saat referee order pertama |
| `referrer_fifth_order_reward` | `200` | Poin untuk referrer saat referee order ke-5 |
| `milestone_10_referrals_reward` | `500` | Poin bonus saat total referral 10 orang |
| `milestone_20_referrals_reward` | `1000` | Poin bonus saat total referral 20 orang |
| `milestone_50_referrals_reward` | `3000` | Poin bonus saat total referral 50 orang |

---

## 🔧 Backend API (Google Apps Script)

### 1. Generate Referral Code

```javascript
/**
 * Generate unique referral code
 * Format: REF-{FIRST_NAME}{RANDOM_4_DIGITS}
 */
function generateReferralCode(userId, userName) {
  const firstName = userName.split(' ')[0].toUpperCase().substring(0, 4);
  const random = Math.floor(1000 + Math.random() * 9000);
  const code = `REF-${firstName}${random}`;
  
  // Check if code already exists
  const usersSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('users');
  const data = usersSheet.getDataRange().getValues();
  const headers = data[0];
  const codeIndex = headers.indexOf('referral_code');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][codeIndex] === code) {
      // Code exists, generate new one (recursive)
      return generateReferralCode(userId, userName);
    }
  }
  
  return code;
}
```

---

### 2. Validate Referral Code

```javascript
/**
 * Validate referral code and return referrer info
 */
function validateReferralCode(code) {
  if (!code || code.trim() === '') {
    return { valid: false };
  }
  
  const usersSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('users');
  const data = usersSheet.getDataRange().getValues();
  const headers = data[0];
  
  const codeIndex = headers.indexOf('referral_code');
  const idIndex = headers.indexOf('id');
  const namaIndex = headers.indexOf('nama');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][codeIndex] === code) {
      return {
        valid: true,
        referrer_name: data[i][namaIndex],
        referrer_id: data[i][idIndex]
      };
    }
  }
  
  return { valid: false };
}
```

**Endpoint:** `GET ?action=validate_referral&code=REF-BUDI123`

**Response:**
```json
{
  "valid": true,
  "referrer_name": "Budi Santoso",
  "referrer_id": "user_1234567890"
}
```

---

### 3. Register with Referral Code

```javascript
/**
 * Register user with optional referral code
 */
function registerWithReferral(userData) {
  const usersSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('users');
  const settingsSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('referral_settings');
  const historySheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('referral_history');
  
  // Get reward settings
  const referrerReward = parseInt(getSettingValue(settingsSheet, 'referrer_registration_reward')) || 100;
  const refereeBonus = parseInt(getSettingValue(settingsSheet, 'referee_registration_bonus')) || 50;
  
  // Generate user ID
  const userId = 'user_' + Date.now();
  
  // Generate referral code for new user
  const referralCode = generateReferralCode(userId, userData.nama);
  
  // Validate referral code if provided
  let referrerData = null;
  if (userData.referred_by) {
    referrerData = validateReferralCode(userData.referred_by);
    if (!referrerData.valid) {
      Logger.log('Invalid referral code: ' + userData.referred_by);
      // Continue registration without referral
      userData.referred_by = '';
    }
  }
  
  // Create user account
  const timestamp = new Date().toLocaleString('id-ID');
  const tanggalDaftar = new Date().toLocaleDateString('id-ID');
  
  const newUser = {
    id: userId,
    nama: userData.nama,
    whatsapp: userData.whatsapp,
    pin: userData.pin,
    total_points: (referrerData && referrerData.valid) ? refereeBonus : 0,
    status: 'active',
    created_at: timestamp,
    tanggal_daftar: tanggalDaftar,
    referral_code: referralCode,
    referred_by: userData.referred_by || '',
    referral_count: 0,
    referral_points_earned: 0
  };
  
  // Insert user
  const headers = usersSheet.getRange(1, 1, 1, usersSheet.getLastColumn()).getValues()[0];
  const row = headers.map(header => newUser[header] || '');
  usersSheet.appendRow(row);
  
  // If referred by someone, update referrer and create history
  if (referrerData && referrerData.valid) {
    // Update referrer
    const newReferralCount = updateReferrerStats(
      usersSheet, 
      referrerData.referrer_id, 
      referrerReward, 
      'registration'
    );
    
    // Create referral history
    const historyEntry = {
      id: 'ref_' + Date.now(),
      referrer_id: referrerData.referrer_id,
      referrer_code: userData.referred_by,
      referee_id: userId,
      referee_name: userData.nama,
      referee_whatsapp: userData.whatsapp,
      event_type: 'registration',
      referrer_reward: referrerReward,
      referee_reward: refereeBonus,
      status: 'completed',
      created_at: timestamp
    };
    
    const historyHeaders = historySheet.getRange(1, 1, 1, historySheet.getLastColumn()).getValues()[0];
    const historyRow = historyHeaders.map(header => historyEntry[header] || '');
    historySheet.appendRow(historyRow);
    
    // Check milestone (10 referrals)
    checkAndRewardMilestone(referrerData.referrer_id, newReferralCount);
  }
  
  return { 
    success: true, 
    user_id: userId,
    referral_code: referralCode,
    bonus_points: newUser.total_points,
    referred_by: userData.referred_by || null
  };
}

/**
 * Get setting value from referral_settings sheet
 */
function getSettingValue(settingsSheet, key) {
  const data = settingsSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      return data[i][1];
    }
  }
  return null;
}
```

---

### 4. Update Referrer Stats

```javascript
/**
 * Update referrer statistics and add points
 * Returns new referral count
 */
function updateReferrerStats(sheet, referrerId, rewardPoints, eventType) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const idIndex = headers.indexOf('id');
  const countIndex = headers.indexOf('referral_count');
  const earnedIndex = headers.indexOf('referral_points_earned');
  const pointsIndex = headers.indexOf('total_points');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === referrerId) {
      const currentCount = data[i][countIndex] || 0;
      const currentEarned = data[i][earnedIndex] || 0;
      const currentPoints = data[i][pointsIndex] || 0;
      
      const newCount = eventType === 'registration' ? currentCount + 1 : currentCount;
      const newEarned = currentEarned + rewardPoints;
      const newPoints = currentPoints + rewardPoints;
      
      sheet.getRange(i + 1, countIndex + 1).setValue(newCount);
      sheet.getRange(i + 1, earnedIndex + 1).setValue(newEarned);
      sheet.getRange(i + 1, pointsIndex + 1).setValue(newPoints);
      
      return newCount;
    }
  }
  
  return 0;
}
```

---

### 5. Track Order and Reward Referrer

```javascript
/**
 * Track order and check if referrer should get reward
 * Call this function after order is completed
 */
function trackOrderForReferral(userId) {
  const usersSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('users');
  const ordersSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('orders');
  const historySheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('referral_history');
  const settingsSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('referral_settings');
  
  // Get user data
  const userData = getUserById(usersSheet, userId);
  if (!userData || !userData.referred_by) {
    return; // User tidak punya referrer
  }
  
  // Count completed orders for this user
  const orderCount = countUserOrders(ordersSheet, userId);
  
  // Get referrer data
  const referrerData = getReferrerByCode(usersSheet, userData.referred_by);
  if (!referrerData) {
    return;
  }
  
  let rewardPoints = 0;
  let eventType = '';
  
  // Check if this is first order or fifth order
  if (orderCount === 1) {
    // First order reward
    rewardPoints = parseInt(getSettingValue(settingsSheet, 'referrer_first_order_reward')) || 50;
    eventType = 'first_order';
  } else if (orderCount === 5) {
    // Fifth order reward
    rewardPoints = parseInt(getSettingValue(settingsSheet, 'referrer_fifth_order_reward')) || 200;
    eventType = 'fifth_order';
  } else {
    return; // No reward for other order counts
  }
  
  // Check if reward already given
  if (isRewardAlreadyGiven(historySheet, referrerData.id, userId, eventType)) {
    return;
  }
  
  // Give reward to referrer
  updateReferrerStats(usersSheet, referrerData.id, rewardPoints, eventType);
  
  // Create history entry
  const timestamp = new Date().toLocaleString('id-ID');
  const historyEntry = {
    id: 'ref_' + Date.now(),
    referrer_id: referrerData.id,
    referrer_code: userData.referred_by,
    referee_id: userId,
    referee_name: userData.nama,
    referee_whatsapp: userData.whatsapp,
    event_type: eventType,
    referrer_reward: rewardPoints,
    referee_reward: 0,
    status: 'completed',
    created_at: timestamp
  };
  
  const historyHeaders = historySheet.getRange(1, 1, 1, historySheet.getLastColumn()).getValues()[0];
  const historyRow = historyHeaders.map(header => historyEntry[header] || '');
  historySheet.appendRow(historyRow);
}

/**
 * Helper: Get user by ID
 */
function getUserById(sheet, userId) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][headers.indexOf('id')] === userId) {
      const user = {};
      headers.forEach((header, index) => {
        user[header] = data[i][index];
      });
      return user;
    }
  }
  return null;
}

/**
 * Helper: Get referrer by code
 */
function getReferrerByCode(sheet, code) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][headers.indexOf('referral_code')] === code) {
      const user = {};
      headers.forEach((header, index) => {
        user[header] = data[i][index];
      });
      return user;
    }
  }
  return null;
}

/**
 * Helper: Count completed orders for user
 */
function countUserOrders(ordersSheet, userId) {
  const data = ordersSheet.getDataRange().getValues();
  const headers = data[0];
  const userIdIndex = headers.indexOf('user_id');
  const statusIndex = headers.indexOf('status');
  
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][userIdIndex] === userId && data[i][statusIndex] === 'selesai') {
      count++;
    }
  }
  return count;
}

/**
 * Helper: Check if reward already given
 */
function isRewardAlreadyGiven(historySheet, referrerId, refereeId, eventType) {
  const data = historySheet.getDataRange().getValues();
  const headers = data[0];
  
  const referrerIndex = headers.indexOf('referrer_id');
  const refereeIndex = headers.indexOf('referee_id');
  const eventIndex = headers.indexOf('event_type');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][referrerIndex] === referrerId && 
        data[i][refereeIndex] === refereeId && 
        data[i][eventIndex] === eventType) {
      return true;
    }
  }
  return false;
}
```

---

### 6. Check and Reward Milestone

```javascript
/**
 * Check if user reached milestone and give bonus
 */
function checkAndRewardMilestone(userId, referralCount) {
  const settingsSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('referral_settings');
  const milestonesSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('referral_milestones');
  const usersSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('users');
  
  let milestoneType = '';
  let rewardPoints = 0;
  
  // Check which milestone reached
  if (referralCount === 10) {
    milestoneType = 'referral_10';
    rewardPoints = parseInt(getSettingValue(settingsSheet, 'milestone_10_referrals_reward')) || 500;
  } else if (referralCount === 20) {
    milestoneType = 'referral_20';
    rewardPoints = parseInt(getSettingValue(settingsSheet, 'milestone_20_referrals_reward')) || 1000;
  } else if (referralCount === 50) {
    milestoneType = 'referral_50';
    rewardPoints = parseInt(getSettingValue(settingsSheet, 'milestone_50_referrals_reward')) || 3000;
  } else {
    return; // No milestone reached
  }
  
  // Check if milestone already rewarded
  if (isMilestoneAlreadyRewarded(milestonesSheet, userId, milestoneType)) {
    return;
  }
  
  // Get user data
  const userData = getUserById(usersSheet, userId);
  if (!userData) return;
  
  // Give reward
  updateReferrerStats(usersSheet, userId, rewardPoints, 'milestone');
  
  // Record milestone
  const timestamp = new Date().toLocaleString('id-ID');
  const milestoneEntry = {
    id: 'milestone_' + Date.now(),
    user_id: userId,
    user_name: userData.nama,
    milestone_type: milestoneType,
    referral_count: referralCount,
    reward_points: rewardPoints,
    achieved_at: timestamp
  };
  
  const headers = milestonesSheet.getRange(1, 1, 1, milestonesSheet.getLastColumn()).getValues()[0];
  const row = headers.map(header => milestoneEntry[header] || '');
  milestonesSheet.appendRow(row);
}

/**
 * Helper: Check if milestone already rewarded
 */
function isMilestoneAlreadyRewarded(sheet, userId, milestoneType) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const userIdIndex = headers.indexOf('user_id');
  const typeIndex = headers.indexOf('milestone_type');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][userIdIndex] === userId && data[i][typeIndex] === milestoneType) {
      return true;
    }
  }
  return false;
}
```

---

### 7. Get Referral Stats

```javascript
/**
 * Get referral statistics for user
 */
function getReferralStats(userId) {
  const usersSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('users');
  const historySheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('referral_history');
  
  // Get user data
  const userData = getUserById(usersSheet, userId);
  if (!userData) {
    return { error: 'User not found' };
  }
  
  // Get referral history
  const historyData = historySheet.getDataRange().getValues();
  const historyHeaders = historyData[0];
  
  const referrerIdIndex = historyHeaders.indexOf('referrer_id');
  const refereeNameIndex = historyHeaders.indexOf('referee_name');
  const eventTypeIndex = historyHeaders.indexOf('event_type');
  const rewardIndex = historyHeaders.indexOf('referrer_reward');
  const createdIndex = historyHeaders.indexOf('created_at');
  
  const referrals = [];
  for (let i = 1; i < historyData.length; i++) {
    if (historyData[i][referrerIdIndex] === userId) {
      referrals.push({
        name: historyData[i][refereeNameIndex],
        event: historyData[i][eventTypeIndex],
        reward: historyData[i][rewardIndex],
        date: historyData[i][createdIndex]
      });
    }
  }
  
  return {
    referral_code: userData.referral_code,
    referral_count: userData.referral_count || 0,
    referral_points_earned: userData.referral_points_earned || 0,
    total_points: userData.total_points || 0,
    referrals: referrals
  };
}
```

**Endpoint:** `GET ?action=get_referral_stats&user_id=user_1234567890`

**Response:**
```json
{
  "referral_code": "REF-BUDI123",
  "referral_count": 5,
  "referral_points_earned": 800,
  "total_points": 2500,
  "referrals": [
    {
      "name": "Siti Aminah",
      "event": "registration",
      "reward": 100,
      "date": "2026-01-26 10:30:00"
    },
    {
      "name": "Siti Aminah",
      "event": "first_order",
      "reward": 50,
      "date": "2026-01-27 14:20:00"
    }
  ]
}
```

---

### 8. Update doPost Handler

```javascript
function doPost(e) {
  const contentType = e.postData.type;
  let body;
  
  if (contentType === 'application/x-www-form-urlencoded') {
    const params = new URLSearchParams(e.postData.contents);
    body = JSON.parse(params.get('json') || '{}');
  } else {
    body = JSON.parse(e.postData.contents || '{}');
  }
  
  const action = body.action;
  
  try {
    let result;
    
    switch(action) {
      case 'register':
        result = registerWithReferral(body.data);
        break;
      
      case 'track_order_referral':
        trackOrderForReferral(body.user_id);
        result = { success: true, message: 'Referral tracked' };
        break;
      
      // ... other actions
      
      default:
        result = { error: 'Unknown action' };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const action = e.parameter.action;
  
  try {
    let result;
    
    switch(action) {
      case 'validate_referral':
        result = validateReferralCode(e.parameter.code);
        break;
      
      case 'get_referral_stats':
        result = getReferralStats(e.parameter.user_id);
        break;
      
      // ... other actions
      
      default:
        result = { error: 'Unknown action' };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

## 💻 Frontend Implementation

### 1. Registration Page (`/register.html`)

**HTML (NO INPUT FIELD):**
```html
<form id="register-form">
  <input type="text" id="nama" placeholder="Nama Lengkap" required>
  <input type="tel" id="whatsapp" placeholder="Nomor WhatsApp" required>
  <input type="password" id="pin" placeholder="PIN (6 digit)" required maxlength="6">
  
  <!-- NO REFERRAL INPUT FIELD - AUTO TRACKING -->
  
  <button type="submit">Daftar</button>
</form>

<div id="referral-info" class="hidden">
  <p>✨ Anda diajak oleh: <strong id="referrer-name"></strong></p>
  <p>Bonus 50 poin akan Anda dapatkan setelah registrasi!</p>
</div>
```

**JavaScript:**
```javascript
// Auto-detect referral code from URL
let referralCode = null;

window.addEventListener('DOMContentLoaded', async function() {
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');
  
  if (refCode) {
    referralCode = refCode.toUpperCase();
    
    // Validate referral code
    try {
      const response = await fetch(`${API_URL}?action=validate_referral&code=${referralCode}`);
      const result = await response.json();
      
      if (result.valid) {
        // Show referral info
        document.getElementById('referrer-name').textContent = result.referrer_name;
        document.getElementById('referral-info').classList.remove('hidden');
        
        // Store in sessionStorage
        sessionStorage.setItem('referral_code', referralCode);
        sessionStorage.setItem('referrer_name', result.referrer_name);
      } else {
        referralCode = null;
      }
    } catch (error) {
      console.error('Error validating referral:', error);
      referralCode = null;
    }
  }
});

// Handle registration
document.getElementById('register-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const payload = {
    action: 'register',
    sheet: 'users',
    data: {
      nama: document.getElementById('nama').value,
      whatsapp: document.getElementById('whatsapp').value,
      pin: document.getElementById('pin').value,
      referred_by: referralCode || ''
    }
  };
  
  try {
    const result = await apiPost(API_URL, payload);
    
    if (result.success) {
      let message = `Registrasi berhasil!\\nKode referral Anda: ${result.referral_code}`;
      
      if (result.bonus_points > 0) {
        message += `\\n\\nSelamat! Anda mendapat bonus ${result.bonus_points} poin!`;
      }
      
      alert(message);
      window.location.href = 'login.html';
    } else {
      alert('Registrasi gagal: ' + result.message);
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
});
```

---

### 2. Account Page (`/akun.html`)

**HTML:**
```html
<div class="referral-card">
  <h3>🎁 Program Referral</h3>
  
  <div class="referral-code-section">
    <label>Kode Referral Anda:</label>
    <div class="code-display">
      <span id="user-referral-code" class="code">REF-BUDI123</span>
      <button onclick="copyReferralCode()" class="btn-copy">📋 Copy</button>
      <button onclick="shareReferralCode()" class="btn-share">📤 Share</button>
    </div>
  </div>
  
  <div class="referral-stats">
    <div class="stat-item">
      <span class="stat-icon">👥</span>
      <div>
        <span class="stat-label">Total Referral</span>
        <span class="stat-value" id="referral-count">0</span>
      </div>
    </div>
    <div class="stat-item">
      <span class="stat-icon">⭐</span>
      <div>
        <span class="stat-label">Poin dari Referral</span>
        <span class="stat-value" id="referral-points">0</span>
      </div>
    </div>
  </div>
  
  <div class="referral-rewards">
    <h4>🎯 Reward Bertingkat:</h4>
    <ul>
      <li>✅ Teman daftar: <strong>+100 poin</strong></li>
      <li>✅ Teman order pertama: <strong>+50 poin</strong></li>
      <li>✅ Teman order 5x: <strong>+200 poin</strong></li>
      <li>✅ Total 10 referral: <strong>+500 poin bonus!</strong></li>
    </ul>
  </div>
  
  <div class="referral-list">
    <h4>📋 Riwayat Referral:</h4>
    <div id="referral-list-items">
      <!-- Will be populated by JavaScript -->
    </div>
  </div>
  
  <div class="referral-link">
    <p>Link Pendaftaran dengan Kode Anda:</p>
    <div class="link-display">
      <input type="text" id="referral-link" readonly>
      <button onclick="copyReferralLink()">Copy Link</button>
    </div>
  </div>
</div>
```

**CSS:**
```css
.referral-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  border-radius: 16px;
  margin: 20px 0;
}

.code-display {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 12px 0;
}

.code {
  background: rgba(255,255,255,0.2);
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 20px;
  font-weight: bold;
  letter-spacing: 2px;
  flex: 1;
}

.btn-copy, .btn-share {
  background: rgba(255,255,255,0.3);
  border: none;
  padding: 12px 16px;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-weight: bold;
}

.referral-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin: 20px 0;
}

.stat-item {
  background: rgba(255,255,255,0.2);
  padding: 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  font-size: 32px;
}

.stat-label {
  display: block;
  font-size: 12px;
  opacity: 0.8;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: bold;
}

.referral-rewards {
  background: rgba(255,255,255,0.1);
  padding: 16px;
  border-radius: 12px;
  margin: 20px 0;
}

.referral-rewards ul {
  list-style: none;
  padding: 0;
  margin: 12px 0 0 0;
}

.referral-rewards li {
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.referral-list {
  margin: 20px 0;
}

.referral-list-item {
  background: rgba(255,255,255,0.1);
  padding: 12px;
  border-radius: 8px;
  margin: 8px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.link-display {
  display: flex;
  gap: 8px;
  margin: 12px 0;
}

.link-display input {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  border: none;
  background: rgba(255,255,255,0.2);
  color: white;
}
```

**JavaScript:**
```javascript
// Load referral stats
async function loadReferralStats() {
  const userId = localStorage.getItem('user_id');
  
  try {
    const response = await fetch(`${API_URL}?action=get_referral_stats&user_id=${userId}`);
    const data = await response.json();
    
    if (data.error) {
      console.error('Error loading referral stats:', data.error);
      return;
    }
    
    // Update UI
    document.getElementById('user-referral-code').textContent = data.referral_code;
    document.getElementById('referral-count').textContent = data.referral_count;
    document.getElementById('referral-points').textContent = data.referral_points_earned;
    
    // Update referral link
    const referralLink = `${window.location.origin}/register.html?ref=${data.referral_code}`;
    document.getElementById('referral-link').value = referralLink;
    
    // Populate referral list
    const listEl = document.getElementById('referral-list-items');
    listEl.innerHTML = '';
    
    if (data.referrals.length === 0) {
      listEl.innerHTML = '<p style="opacity: 0.7;">Belum ada referral. Yuk ajak teman!</p>';
    } else {
      data.referrals.forEach(ref => {
        const item = document.createElement('div');
        item.className = 'referral-list-item';
        
        const eventLabel = {
          'registration': '📝 Registrasi',
          'first_order': '🛒 Order Pertama',
          'fifth_order': '🎉 Order ke-5'
        };
        
        item.innerHTML = `
          <div>
            <strong>${ref.name}</strong>
            <br>
            <small>${eventLabel[ref.event] || ref.event} • ${ref.date}</small>
          </div>
          <div class="reward-badge">+${ref.reward} poin</div>
        `;
        listEl.appendChild(item);
      });
    }
  } catch (error) {
    console.error('Error loading referral stats:', error);
  }
}

// Copy referral code
function copyReferralCode() {
  const code = document.getElementById('user-referral-code').textContent;
  navigator.clipboard.writeText(code);
  
  // Show toast notification
  showToast('✅ Kode referral berhasil di-copy!');
}

// Copy referral link
function copyReferralLink() {
  const link = document.getElementById('referral-link').value;
  navigator.clipboard.writeText(link);
  
  showToast('✅ Link referral berhasil di-copy!');
}

// Share referral code
function shareReferralCode() {
  const code = document.getElementById('user-referral-code').textContent;
  const link = document.getElementById('referral-link').value;
  const text = `🎁 Yuk belanja sembako online di GoSembako!\\n\\nPakai kode referral saya: ${code}\\nDapat bonus 50 poin langsung!\\n\\n${link}`;
  
  if (navigator.share) {
    navigator.share({
      title: 'GoSembako Referral',
      text: text
    }).catch(err => {
      console.log('Share cancelled');
    });
  } else {
    // Fallback: Copy to clipboard
    navigator.clipboard.writeText(text);
    showToast('✅ Pesan referral berhasil di-copy! Silakan share ke teman Anda.');
  }
}

// Show toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    z-index: 9999;
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Load stats on page load
loadReferralStats();
```

---

### 3. Track Order for Referral

**In your order completion code:**

```javascript
// After order status changed to "selesai"
async function onOrderCompleted(orderId, userId) {
  // ... existing order completion logic
  
  // Track referral
  try {
    await apiPost(API_URL, {
      action: 'track_order_referral',
      user_id: userId
    });
  } catch (error) {
    console.error('Error tracking referral:', error);
  }
}
```

---

## 👥 User Flow

### Flow 1: User A Share Kode

```
1. User A login → Buka halaman Akun
2. Scroll ke section "Program Referral"
3. Lihat kode referral: REF-BUDI123
4. Klik "Share" → Pilih WhatsApp/Instagram/dll
5. Pesan otomatis ter-generate dengan link referral
6. Share ke teman/keluarga
```

### Flow 2: User B Registrasi dengan Link Referral

```
1. User B klik link: https://gosembako.com/register.html?ref=REF-BUDI123
2. Halaman registrasi terbuka
3. Muncul notifikasi: "✨ Anda diajak oleh: Budi Santoso"
4. Isi form registrasi (nama, whatsapp, PIN)
5. Klik "Daftar"
6. Sistem:
   - Create account untuk User B
   - Generate kode referral untuk User B: REF-SITI789
   - Berikan bonus 50 poin ke User B
   - Tambah 100 poin ke User A
   - Update referral_count User A
   - Create entry di referral_history
7. User B melihat: "Selamat! Anda dapat bonus 50 poin!"
8. User A melihat notifikasi di halaman akun (next refresh)
```

### Flow 3: User B Order Pertama

```
1. User B order produk pertama kali
2. Order selesai (status: "selesai")
3. Sistem:
   - Detect ini order pertama User B
   - Check User B punya referrer (User A)
   - Tambah 50 poin ke User A
   - Create entry di referral_history (event: first_order)
4. User A melihat: "+50 poin - Siti Aminah order pertama"
```

### Flow 4: User B Order ke-5

```
1. User B order untuk ke-5 kalinya
2. Order selesai
3. Sistem:
   - Detect ini order ke-5 User B
   - Tambah 200 poin ke User A
   - Create entry di referral_history (event: fifth_order)
4. User A melihat: "+200 poin - Siti Aminah order ke-5"
```

### Flow 5: User A Milestone 10 Referral

```
1. User A berhasil ajak 10 orang
2. Saat referral ke-10 registrasi:
   - Sistem detect referral_count = 10
   - Tambah bonus 500 poin ke User A
   - Create entry di referral_milestones
3. User A melihat: "🎉 Selamat! Bonus 500 poin - Milestone 10 referral!"
```

---

## 🎁 Reward System

### Registration Rewards

| Event | Referrer | Referee |
|-------|----------|---------|
| **Registrasi Berhasil** | +100 poin | +50 poin |

### Order-Based Rewards

| Event | Referrer | Referee |
|-------|----------|---------|
| **Referee Order Pertama** | +50 poin | - |
| **Referee Order ke-5** | +200 poin | - |

### Milestone Rewards

| Milestone | Reward | Notes |
|-----------|--------|-------|
| **10 Referral** | +500 poin | Bonus sekali |
| **20 Referral** | +1000 poin | Bonus sekali |
| **50 Referral** | +3000 poin | Bonus sekali |

### Total Potential Earnings

**Contoh: User A ajak 10 orang, semua order 5x**

| Item | Calculation | Total |
|------|-------------|-------|
| Registration (10 orang) | 10 × 100 | 1,000 poin |
| First Order (10 orang) | 10 × 50 | 500 poin |
| Fifth Order (10 orang) | 10 × 200 | 2,000 poin |
| Milestone 10 Referral | 1 × 500 | 500 poin |
| **TOTAL** | | **4,000 poin** |

---

## 🛠️ Admin Panel

### Referral Dashboard (`/admin/index.html`)

**Add new menu item:**
```html
<button onclick="showSection('referral')" id="nav-referral" class="sidebar-item">
  <svg>...</svg>
  Referral Program
</button>
```

**Add new section:**
```html
<section id="section-referral" class="hidden space-y-6">
  <!-- Stats Cards -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div class="stat-card">
      <p class="stat-label">Total Referrals</p>
      <h3 id="admin-total-referrals" class="stat-value">0</h3>
    </div>
    <div class="stat-card">
      <p class="stat-label">Active Referrers</p>
      <h3 id="admin-active-referrers" class="stat-value">0</h3>
    </div>
    <div class="stat-card">
      <p class="stat-label">Poin Dibagikan</p>
      <h3 id="admin-points-distributed" class="stat-value">0</h3>
    </div>
    <div class="stat-card">
      <p class="stat-label">Conversion Rate</p>
      <h3 id="admin-conversion-rate" class="stat-value">0%</h3>
    </div>
  </div>
  
  <!-- Top Referrers -->
  <div class="card">
    <h3>🏆 Top Referrers</h3>
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Nama</th>
          <th>Kode Referral</th>
          <th>Total Referrals</th>
          <th>Poin Earned</th>
        </tr>
      </thead>
      <tbody id="admin-top-referrers">
        <!-- Populated by JS -->
      </tbody>
    </table>
  </div>
  
  <!-- Recent Referrals -->
  <div class="card">
    <h3>📋 Recent Referrals</h3>
    <table>
      <thead>
        <tr>
          <th>Tanggal</th>
          <th>Referrer</th>
          <th>Referee</th>
          <th>Event</th>
          <th>Reward</th>
        </tr>
      </thead>
      <tbody id="admin-referral-history">
        <!-- Populated by JS -->
      </tbody>
    </table>
  </div>
  
  <!-- Settings -->
  <div class="card">
    <h3>⚙️ Referral Settings</h3>
    <form id="admin-referral-settings-form" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label>Poin Registrasi (Referrer):</label>
          <input type="number" id="setting-referrer-registration" value="100">
        </div>
        <div>
          <label>Bonus Registrasi (Referee):</label>
          <input type="number" id="setting-referee-registration" value="50">
        </div>
        <div>
          <label>Poin Order Pertama:</label>
          <input type="number" id="setting-first-order" value="50">
        </div>
        <div>
          <label>Poin Order ke-5:</label>
          <input type="number" id="setting-fifth-order" value="200">
        </div>
        <div>
          <label>Milestone 10 Referral:</label>
          <input type="number" id="setting-milestone-10" value="500">
        </div>
        <div>
          <label>Milestone 20 Referral:</label>
          <input type="number" id="setting-milestone-20" value="1000">
        </div>
      </div>
      <button type="submit" class="btn-primary">Simpan Pengaturan</button>
    </form>
  </div>
</section>
```

**JavaScript:**
```javascript
async function fetchReferralAnalytics() {
  try {
    const response = await fetch(`${API_URL}?action=get_referral_analytics`);
    const data = await response.json();
    
    document.getElementById('admin-total-referrals').textContent = data.total_referrals;
    document.getElementById('admin-active-referrers').textContent = data.active_referrers;
    document.getElementById('admin-points-distributed').textContent = data.points_distributed;
    document.getElementById('admin-conversion-rate').textContent = data.conversion_rate + '%';
    
    // Populate top referrers
    const topReferrersBody = document.getElementById('admin-top-referrers');
    topReferrersBody.innerHTML = '';
    data.top_referrers.forEach((user, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${user.nama}</td>
        <td>${user.referral_code}</td>
        <td>${user.referral_count}</td>
        <td>${user.referral_points_earned}</td>
      `;
      topReferrersBody.appendChild(tr);
    });
    
    // Populate recent referrals
    const historyBody = document.getElementById('admin-referral-history');
    historyBody.innerHTML = '';
    data.recent_referrals.forEach(ref => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${ref.created_at}</td>
        <td>${ref.referrer_name}</td>
        <td>${ref.referee_name}</td>
        <td>${ref.event_type}</td>
        <td>+${ref.referrer_reward}</td>
      `;
      historyBody.appendChild(tr);
    });
  } catch (error) {
    console.error('Error fetching referral analytics:', error);
  }
}
```

---

## 🚀 Implementation Steps

### Phase 1: Database Setup (30 minutes)

1. **Update sheet `users`:**
   - Tambah kolom: `referral_code`, `referred_by`, `referral_count`, `referral_points_earned`
   - Generate referral code untuk existing users (optional)

2. **Create sheet `referral_history`:**
   - Header: `id`, `referrer_id`, `referrer_code`, `referee_id`, `referee_name`, `referee_whatsapp`, `event_type`, `referrer_reward`, `referee_reward`, `status`, `created_at`

3. **Create sheet `referral_milestones`:**
   - Header: `id`, `user_id`, `user_name`, `milestone_type`, `referral_count`, `reward_points`, `achieved_at`

4. **Create sheet `referral_settings`:**
   - Populate default settings (7 rows)

---

### Phase 2: Backend API (2-3 hours)

1. **Implement helper functions:**
   - `generateReferralCode()`
   - `validateReferralCode()`
   - `getUserById()`
   - `getReferrerByCode()`
   - `getSettingValue()`

2. **Update registration:**
   - Modify `registerWithReferral()` function
   - Add referral tracking logic

3. **Implement order tracking:**
   - `trackOrderForReferral()`
   - `countUserOrders()`
   - `isRewardAlreadyGiven()`

4. **Implement milestone system:**
   - `checkAndRewardMilestone()`
   - `isMilestoneAlreadyRewarded()`

5. **Implement stats API:**
   - `getReferralStats()`
   - `getReferralAnalytics()` (for admin)

6. **Update doPost/doGet handlers**

---

### Phase 3: Frontend - Registration (1 hour)

1. **Update `/register.html`:**
   - Add referral info display (hidden by default)
   - Add JavaScript for auto-detect referral from URL
   - Update registration handler to include referral code

2. **Test registration flow:**
   - With referral code
   - Without referral code

---

### Phase 4: Frontend - Account Page (2 hours)

1. **Update `/akun.html`:**
   - Add referral card section with all UI elements
   - Add CSS styling
   - Implement `loadReferralStats()`
   - Implement copy/share functions

2. **Test account page:**
   - Display referral code
   - Copy/share functionality
   - Referral list display

---

### Phase 5: Order Tracking Integration (1 hour)

1. **Find order completion code**
2. **Add `trackOrderForReferral()` call**
3. **Test order tracking:**
   - First order reward
   - Fifth order reward

---

### Phase 6: Admin Panel (2 hours)

1. **Add referral menu item**
2. **Create referral section**
3. **Implement analytics display**
4. **Implement settings management**
5. **Test admin panel**

---

### Phase 7: Testing & Launch (2 hours)

1. **End-to-end testing:**
   - Complete user journey
   - All reward scenarios
   - Milestone rewards

2. **Bug fixes**

3. **Launch to production**

---

## ✅ Testing Checklist

### Backend Testing

- [ ] Generate referral code untuk user baru
- [ ] Validate referral code (valid/invalid)
- [ ] Register dengan referral code
- [ ] Register tanpa referral code
- [ ] Update referrer stats setelah referral
- [ ] Track first order reward
- [ ] Track fifth order reward
- [ ] Check milestone 10 referrals
- [ ] Check milestone 20 referrals
- [ ] Get referral stats API

### Frontend Testing

- [ ] Auto-detect referral code dari URL
- [ ] Display referral info saat registrasi
- [ ] Registration dengan referral code
- [ ] Display referral code di halaman akun
- [ ] Copy referral code
- [ ] Share referral code (WhatsApp/Instagram)
- [ ] Display referral stats
- [ ] Display referral history

### Integration Testing

- [ ] User A share link → User B register → Both get points
- [ ] User B order pertama → User A get +50 poin
- [ ] User B order ke-5 → User A get +200 poin
- [ ] User A reach 10 referrals → Get +500 poin bonus
- [ ] Admin panel display correct analytics

---

## 📝 Notes

### Security
- ✅ Validate referral code di backend
- ✅ Prevent self-referral
- ✅ Check duplicate rewards
- ✅ Log all referral activities

### Performance
- ✅ Cache referral stats
- ✅ Batch updates untuk multiple referrals
- ✅ Index referral_code column

### Future Enhancements
- Referral leaderboard dengan prizes
- Limited-time referral campaigns (2x points)
- Referral expiry (kode expired setelah 1 tahun)
- Social media integration (auto-post)

---

**Ready for Implementation!** 🚀

**Estimated Total Time:** 10-12 hours  
**Difficulty:** Medium  
**Impact:** High (user acquisition & engagement)

---

**Created by:** Manus AI Agent  
**Date:** 26 Januari 2026  
**Status:** ✅ Ready for Implementation
