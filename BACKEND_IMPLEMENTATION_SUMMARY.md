# Backend Implementation Summary - Google Apps Script

**Commit:** 885fc0b ✅ Pushed to GitHub  
**Date:** 22 Januari 2026

---

## 📦 Apa Yang Sudah Dibuat

### 1. **REFERRAL_BACKEND_GAS.gs** (900+ lines)
Complete backend logic untuk referral system:

**Core Features:**
- ✅ **Process Orders** - Detect first-time purchases dari referred users
- ✅ **Auto-Credit Points** - Referrer dapat 10.000 poin otomatis
- ✅ **Generate Vouchers** - Create discount vouchers (10%, max Rp 25.000) untuk referred users
- ✅ **Track History** - Semua transaksi poin tercatat di `points_history` sheet
- ✅ **Referral Records** - Setiap referral disimpan dengan status & timestamp

**Functions:**
```
Core:
├── processReferral(orderId, phone, name)          - Main function to process referral
├── getReferralStats(referralCode)                 - Get referral statistics
├── getUserPointsHistory(referralCode)             - Get points transaction history

Utility:
├── findUserByWhatsapp(phone)                      - Find user dari sheet
├── findUserByReferralCode(code)                   - Find user by referral code
├── hasUserMadeFirstOrder(phone)                   - Check first purchase
├── generateVoucherCode()                          - Create unique voucher
├── normalizePhone(phone)                          - Standardize phone format

API Handlers:
├── doPost(e)                                      - Handle POST requests
├── doGet(e)                                       - Handle GET requests (testing)

Test Functions:
├── testProcessReferral()                          - Manual test referral processing
├── testGetAllData()                               - Test sheet access
└── testListUsers()                                - List all users & referral codes
```

**Data Flow:**
```
1. User baru membeli (order created)
   ↓
2. GAS processReferral() dipanggil
   ↓
3. Check: Is referred user? (ada referrer_id?)
   ↓
4. Check: Is first purchase? (only 1 order di sheet?)
   ↓
5. If YES:
   - Credit referrer: +10.000 points
   - Create referral record: status = completed
   - Add points history entry
   - Generate voucher untuk referred user
   - Return success dengan details
   ↓
6. If NO:
   - Skip (no duplicate rewards)
   - Return info
```

---

### 2. **REFERRAL_DEPLOYMENT_GUIDE.md** (450+ lines)

Step-by-step deployment guide untuk:

**Setup Steps:**
1. ✅ Create Google Apps Script project (dari Google Sheets)
2. ✅ Copy-paste script code
3. ✅ Authorize script (grant permissions)
4. ✅ Deploy as Web App
5. ✅ Copy deployment URL
6. ✅ Add URL ke frontend config
7. ✅ Test API endpoints
8. ✅ Integrate dengan frontend

**Testing Procedures:**
- Test 1: Check API status (`?action=getStats`)
- Test 2: List users dari Apps Script logger
- Test 3: Manual referral processing test
- Test 4: Check logs untuk errors/success

**Troubleshooting:**
- "Deployment ID not found"
- "Sheets tidak ter-update"
- "Spreadsheet not found"
- "Anyone access tidak bisa dipilih"

---

### 3. **config.js Updates** 

Added GAS URL management:

```javascript
// Get GAS URL (from sessionStorage/localStorage)
CONFIG.getGASUrl()

// Save GAS URL dengan validation
CONFIG.setGASUrl(url)

// Test GAS API connectivity
CONFIG.testGASConnection() → Promise<boolean>

// Include GAS URL di getAllConfig()
CONFIG.getAllConfig()
```

**Storage Priority:**
1. sessionStorage (runtime, highest priority)
2. localStorage (persistent)
3. '' (default/not configured)

---

### 4. **referral-helper.js Updates**

Added GAS integration functions:

```javascript
// Generic GAS API caller
callGASAPI(action, data) → Promise<object>

// Process referral via GAS backend
processOrderReferralViaGAS(orderId, phone, name)

// Get referral stats
getReferralStatsFromGAS(referralCode)

// Get points history
getPointsHistoryFromGAS(referralCode)
```

**Auto-Toast Notifications:**
- Shows when referral processed successfully
- Displays referrer name & reward amount
- Custom duration support

---

## 🔗 API Endpoints (dari GAS)

### POST Requests:

**1. Process Referral**
```bash
POST https://[GAS_URL]
{
  "action": "processReferral",
  "orderId": "ORD-123456",
  "phone": "081234567890",
  "name": "Customer Name"
}
```

**Response (Success):**
```json
{
  "success": true,
  "referralProcessed": true,
  "referrer_name": "Budi",
  "referrer_reward": 10000,
  "referral_id": "REF-1705985402123",
  "voucher_code": "DISC10K-A7X9Q",
  "voucher_discount": "10%"
}
```

**2. Get Referral Stats**
```bash
POST https://[GAS_URL]
{
  "action": "getReferralStats",
  "referralCode": "BUDI1234"
}
```

**Response:**
```json
{
  "success": true,
  "total_referred": 5,
  "total_completed": 3,
  "total_pending": 2,
  "total_points": 30000,
  "referrals": [...]
}
```

**3. Get Points History**
```bash
POST https://[GAS_URL]
{
  "action": "getUserPointsHistory",
  "referralCode": "BUDI1234"
}
```

### GET Requests (Testing):

**Status Check:**
```
GET https://[GAS_URL]?action=getStats
```

**Simple Test:**
```
GET https://[GAS_URL]?action=test
```

---

## 📊 Database Updates

Akan di-update secara otomatis oleh GAS:

### 1. **users** Sheet
- `referral_code` → stays same
- `total_points` → ➕ 10.000 when referral completed

### 2. **referrals** Sheet (NEW)
```
referral_id      | REF-1705985402123
referrer_id      | BUDI1234
referred_id      | USR-123456
referred_name    | Andi Wijaya
status           | completed
reward_points    | 10000
order_id         | ORD-123456
completed_at     | 2026-01-22 14:30:45
```

### 3. **points_history** Sheet (NEW)
```
history_id       | PH-1705985402123
user_id          | USR-999999
referral_code    | BUDI1234
transaction_type | referral_reward
points_change    | 10000
points_before    | 20000
points_after     | 30000
reference_id     | REF-1705985402123
description      | Reward dari referral Andi Wijaya
created_at       | 2026-01-22 14:30:45
```

### 4. **vouchers** Sheet (NEW)
```
voucher_id       | VCH-1705985402123
voucher_code     | DISC10K-A7X9Q
type             | percentage
value            | 10
max_discount     | 25000
user_id          | USR-123456
is_used          | false
expires_at       | 2026-02-21
created_at       | 2026-01-22 14:30:45
```

---

## ⚙️ Configuration Required

Before deploying, ensure:

1. ✅ Google Sheets dengan sheets: `users`, `orders`
2. ✅ Kolom di users: `id`, `nama`, `whatsapp`, `referral_code`, `referrer_id`, `total_points`
3. ✅ Kolom di orders: `id`, `pelanggan`, `produk`, `qty`, `total`, `phone`, `tanggal`, `poin`

GAS akan auto-create:
- ✅ `referrals` sheet
- ✅ `points_history` sheet
- ✅ `vouchers` sheet

---

## 🔐 Security Considerations

**Current Setup:**
- ✅ GAS deployed sebagai Web App "Anyone"
- ✅ Can be called dari frontend tanpa authentication
- ✅ Input validation di backend (phone normalization, ID checking)

**Future Enhancements:**
- Add authentication token (untuk production)
- Rate limiting per referral_code
- Add CORS headers
- Encrypt sensitive data

---

## 📈 Performance Notes

**Spreadsheet Operations:**
- `getSheetData()` → Cache di memory (single request)
- Multiple lookups (findUser, findOrder) → O(n) per sheet
- **Optimization:** Could add indexing via Admin API

**Recommended Limits:**
- Max 10,000 users per sheet (before performance degrades)
- Consider archiving old referrals to separate sheet
- Add pagination untuk large datasets

---

## ✅ Next Steps: Deployment Checklist

**Your Task (Copy & Follow):**
1. [ ] Buka Google Sheets Anda
2. [ ] Go to Tools → Script Editor
3. [ ] Copy semua code dari `REFERRAL_BACKEND_GAS.gs` 
4. [ ] Paste ke Apps Script editor
5. [ ] Save (Ctrl+S)
6. [ ] Click **Run** → authorize permissions
7. [ ] Click **Deploy** → Select "Web app" → Deploy
8. [ ] Copy Web App URL
9. [ ] Come back dan paste URL ke forum/chat
10. [ ] I'll update frontend config dan do testing

**Deployment Time:** ~10-15 minutes

---

## 📚 Related Files

```
✨ NEW:
- REFERRAL_BACKEND_GAS.gs                (Google Apps Script code)
- REFERRAL_DEPLOYMENT_GUIDE.md           (Step-by-step setup)

✏️ UPDATED:
- assets/js/config.js                    (GAS URL management)
- assets/js/referral-helper.js           (GAS API integration)

📖 REFERENCE:
- REFERRAL_MIGRATION_GUIDE.md            (Database schema)
- REFERRAL_PROGRAM_COMPLETE_GUIDE.md     (Business logic)
```

---

## 🎯 What's Next?

**Phase 3: Frontend Dashboard** 🎨
- Create `/referral.html` page
- Display referral code + share buttons
- Show referral stats (real-time from GAS)
- Points history view
- Voucher redemption

**Phase 4: Testing** 🧪
- End-to-end referral flow testing
- Performance optimization
- Error handling & edge cases

---

**Status:** ✅ Backend Ready for Deployment

**Estimated Timeline:**
- Setup GAS: 15 minutes
- Test API: 5 minutes  
- Integration: 5 minutes
- Total: ~25 minutes

Siap untuk deploy? 🚀
