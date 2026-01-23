# 🧪 REFERRAL SYSTEM - LIVE TEST EXECUTION

**Status:** 🎯 READY FOR TESTING  
**Start Time:** 23 Januari 2026  
**Test Environment:** Production (dancing-pudding-dc26b3.netlify.app)

---

## 🎯 TEST OBJECTIVES

1. ✅ Verify referral code tracking from URL
2. ✅ Verify user registration dengan referrer
3. ✅ Verify first order creation
4. ✅ Verify referral processing via GAS
5. ✅ Verify data sync ke spreadsheet
6. ✅ Verify points credited ke referrer

---

## 📋 TEST EXECUTION STEPS (EXECUTE IN ORDER)

### **PHASE 1: PREPARATION**

#### Step 1.1: Open Browser Console
```
Press: F12 atau Klik Kanan → Inspect → Console Tab
```

#### Step 1.2: Verify GAS URL
Paste di console:
```javascript
console.log('=== REFERRAL SETUP CHECK ===');
console.log('GAS URL:', localStorage.getItem('gas_url'));
console.log('Status:', localStorage.getItem('gas_url') ? '✅ SET' : '❌ NOT SET');
```

**Expected Output:**
```
GAS URL: https://script.google.com/macros/s/.../exec
Status: ✅ SET
```

---

### **PHASE 2: OPEN REFERRAL LINK**

#### Step 2.1: Open Referral Link
```
URL: https://dancing-pudding-dc26b3.netlify.app/?ref=RIDO7247
```

#### Step 2.2: Check Console for Referral Tracking
**Watch for:**
```
✅ Referral code tracked: RIDO7247
```

**If you see it:** ✅ Move to next step
**If NOT:** ❌ Check if localStorage is working

---

### **PHASE 3: REGISTRATION (NEW USER)**

#### Step 3.1: Click "Masuk/Daftar" Button
- Look for login/register modal
- Click "Daftar" tab if needed

#### Step 3.2: Fill Registration Form
**Use these test data:**
```
Nama        : Test Referral User 001
WhatsApp    : 089123456789 (MUST be 08 format!)
PIN         : 121212
Konfirmasi  : 121212
```

**CRITICAL:** Use phone format 08xxxxxx (must normalize correctly)

#### Step 3.3: Submit Registration
- Click "Daftar" button
- Wait for confirmation

#### Step 3.4: Check Console
**Watch for:**
```
✅ Registration successful
User saved to database

Or check localStorage:
```javascript
console.log('User Data:', JSON.parse(localStorage.getItem('user_data')));
```

**Expected Output:**
```
User Data: {
  id: "USR-XXXXXX",
  nama: "Test Referral User 001",
  whatsapp: "089123456789",
  referral_code: "TEST0001", // Generated code
  referrer_id: "RIDO7247",   // IMPORTANT - should be RIDO7247
  status: "aktif",
  ...
}
```

**✅ If referrer_id = RIDO7247:** Proceed!
**❌ If referrer_id empty or wrong:** Debug registration flow

---

### **PHASE 4: ADD TO CART & CHECKOUT**

#### Step 4.1: Add Product to Cart
- Browse products
- Select any product (recommend: Minyak Kita 1L - simple)
- Click "Tambah ke Keranjang"
- Wait for confirmation

#### Step 4.2: Open Cart
- Click cart icon
- Verify product is there

#### Step 4.3: Click Checkout
- Click "Checkout" button
- Checkout form should appear

#### Step 4.4: Fill Checkout Data
**IMPORTANT: Use SAME phone as registration!**
```
Nama        : Test Referral User 001 (or same as registered)
WhatsApp    : 089123456789 (MUST MATCH registration!)
Alamat      : Jl. Test 123
Kota        : Jakarta
```

#### Step 4.5: Select Payment Method
- Choose: "Tunai" (Cash payment - simplest for testing)
- Click "Pilih Pembayaran"

#### Step 4.6: Submit Order
- Click "Proses Pesanan"
- DO NOT CLOSE PAGE YET

---

### **PHASE 5: MONITOR REFERRAL PROCESSING (CRITICAL!)**

#### Step 5.1: WATCH CONSOLE FOR THESE LOGS

**After clicking "Proses Pesanan", watch console for:**

**First Logs (Order Creation):**
```
✅ Order created successfully
Order ID: ORD-XXXXXXXXXXXXXX
Amount: Rp XXXXX
💰 Points: XX

🔗 Processing referral via GAS for order: ORD-XXXXXXXXXXXXXX
```

**Second Logs (GAS Processing - WAIT 3-5 seconds):**

**SUCCESS CASE:**
```
📤 Calling GAS API: processReferral
{
  orderId: "ORD-...",
  phone: "089123456789",
  name: "Test Referral User 001"
}

✅ GAS Response (processReferral):
{
  success: true,
  message: "Referral processed successfully",
  referralProcessed: true,
  referrer_name: "RIDO ALPREDO SIHALOHO",
  referrer_reward: 10000,
  referral_id: "REF-1737528000000",
  voucher_code: "DISC10K-ABCDE",
  voucher_discount: "10%"
}

✅ Referral reward processed for first order
   • Referrer: RIDO ALPREDO SIHALOHO
   • Reward: 10000 poin
   • Voucher: DISC10K-ABCDE
```

**If you see this:** ✅✅✅ REFERRAL PROCESSED SUCCESSFULLY!

**ERROR CASE (If you see error):**
```
❌ GAS API Error (processReferral):
HTTP 403 atau Connection Error atau Timeout

Or:

⚠️ GAS URL tidak dikonfigurasi di CONFIG
```

**If you see error:**
- Check GAS URL is set
- Check GAS endpoint working
- Check console for detailed error message

---

### **PHASE 6: VERIFY IN SPREADSHEET**

#### Step 6.1: Open Google Sheets
- Go to your GoSembako spreadsheet

#### Step 6.2: Check Sheet `users`
**Look for:** Row with phone 089123456789

**Verify:**
- ✅ Name: Test Referral User 001
- ✅ referral_code: TEST0001 (or similar)
- ✅ referrer_id: RIDO7247
- ✅ status: aktif

#### Step 6.3: Check Sheet `referrals`
**Look for:** Row with referrer_code = RIDO7247

**Verify NEW row:**
- ✅ id: REF-XXXX...
- ✅ referrer_phone: 8993370200
- ✅ referrer_code: RIDO7247
- ✅ referred_phone: 089123456789
- ✅ referred_name: Test Referral User 001
- ✅ status: completed
- ✅ first_order_id: ORD-XXXX... (matches console)
- ✅ created_at / completed_at: timestamp

#### Step 6.4: Check Sheet `points_history`
**Look for:** Row with referral_code = RIDO7247 AND type = referral_reward

**Verify NEW row:**
- ✅ id: PH-XXXX...
- ✅ user_phone: 8993370200 (RIDO)
- ✅ referral_code: RIDO7247
- ✅ transaction_date: today
- ✅ type: referral_reward
- ✅ amount: 10000
- ✅ balance_before: 0,00
- ✅ balance_after: 10000,00
- ✅ description: Reward dari referral Test Referral User 001
- ✅ source_id: REF-XXXX... (matches referrals sheet)

#### Step 6.5: Check Sheet `vouchers`
**Look for:** Row with referred_phone = 089123456789

**Verify NEW row:**
- ✅ voucher_code: DISC10K-XXXXX
- ✅ type: percentage
- ✅ discount_amount: 25000
- ✅ referrer_phone: 8993370200
- ✅ referred_phone: 089123456789
- ✅ status: active
- ✅ expiry_date: 30 hari dari sekarang
- ✅ created_at: timestamp

#### Step 6.6: Check Sheet `users` - RIDO Updated
**Go to:** Row with RIDO ALPREDO SIHALOHO

**Check:**
- ✅ total_points: Should be MORE than before (0 → 10000 or similar)

---

## ✅ TEST RESULTS CHECKLIST

### Console Logs
- [ ] Referral code tracked: RIDO7247
- [ ] Registration successful
- [ ] Order created
- [ ] GAS API called
- [ ] GAS Response received
- [ ] Referral processed (no error)
- [ ] Referrer name shown: RIDO ALPREDO SIHALOHO
- [ ] Reward amount: 10000 poin
- [ ] Voucher code generated: DISC10K-XXXXX

### Spreadsheet Data
- [ ] New user in `users` sheet
- [ ] referrer_id = RIDO7247
- [ ] New referral entry in `referrals` sheet
- [ ] Status = completed
- [ ] New points history entry in `points_history`
- [ ] Amount = 10000
- [ ] New voucher in `vouchers` sheet
- [ ] RIDO's points updated

### Overall Status
- [ ] PASS - All checks successful
- [ ] FAIL - Some checks failed (note which ones)
- [ ] PARTIAL - Some worked, some not

---

## 🐛 TROUBLESHOOTING

### Issue: Referral code NOT tracked
**Solution:**
- Clear browser cache
- Check URL has ?ref=RIDO7247
- Check localStorage in console

### Issue: Registration fails
**Solution:**
- Check phone format (must be 08xxxxxx)
- Check PIN is 6 digits
- Check no error in console

### Issue: Order doesn't create
**Solution:**
- Check enough balance/no payment restrictions
- Check all fields filled
- Check no error in console

### Issue: GAS API Error / Timeout
**Solution:**
- Verify GAS URL is correct
- Test GAS endpoint directly:
  ```
  https://script.google.com/macros/s/.../exec?action=test
  ```
- Check GAS deployment is active

### Issue: Referral NOT in spreadsheet
**Solution:**
- Verify referral_id saved correctly in user registration
- Check console for referral processing response
- Manually check GAS logs (https://script.google.com/home/projects)

---

## 📝 TEST REPORT TEMPLATE

After testing, fill this and share:

```
=== REFERRAL SYSTEM TEST REPORT ===
Date: [Date]
Tester: [Your name]
Test URL: https://dancing-pudding-dc26b3.netlify.app/?ref=RIDO7247

NEW USER DATA:
- Name: Test Referral User 001
- Phone: 089123456789
- Referral Code: [note generated code]
- Referrer: RIDO7247

TEST RESULTS:
Phase 1 - Referral Tracking: [PASS/FAIL]
Phase 2 - Registration: [PASS/FAIL]
Phase 3 - Order Creation: [PASS/FAIL]
Phase 4 - GAS Processing: [PASS/FAIL]
Phase 5 - Spreadsheet Sync: [PASS/FAIL]

Order ID: [ORD-XXXX]
Referral ID: [REF-XXXX]
Voucher Code: [DISC10K-XXXXX]

GAS Response:
[paste console response]

Issues Found:
[list any issues]

OVERALL STATUS: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL
```

---

## 🎯 NEXT STEPS AFTER TESTING

1. **If ALL PASS:** 🎉
   - Referral system is FULLY WORKING
   - Can deploy to production
   - Document results

2. **If PARTIAL PASS:** ⚠️
   - Identify which parts failed
   - Debug specific issue
   - Re-test that part

3. **If FAIL:** ❌
   - Check GAS deployment
   - Check GAS URL configuration
   - Review console errors
   - Check spreadsheet access

---

**Status: 🚀 READY TO TEST**

Go ahead and execute the steps above! 
Report back with results or ask for help if stuck!
