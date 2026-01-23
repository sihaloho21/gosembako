# Referral Data Recording - Debug Guide

## Issue
Referral data (ORD-099628) appears to process successfully on the frontend, but data is not being recorded to the Google Sheet.

## What SHOULD Happen

When a referral is processed via GAS, the following should be recorded:

1. **referrals sheet** → New row with:
   - `id`: REF-[timestamp]
   - `referrer_phone`: admin's phone
   - `referrer_code`: ADMI1542
   - `referred_phone`: 08794613258
   - `referred_name`: Rido Iphone
   - `status`: completed
   - `first_order_id`: ORD-099628
   - `created_at`: timestamp
   - `completed_at`: timestamp

2. **points_history sheet** → New row with:
   - `id`: PH-[timestamp]
   - `user_phone`: admin's phone
   - `referral_code`: ADMI1542
   - `type`: referral_reward
   - `amount`: 10000
   - `description`: Reward dari referral Rido Iphone
   - `source_id`: REF-[timestamp]

3. **vouchers sheet** → New row with:
   - `voucher_code`: VOUCHER-XXXXX
   - `type`: percentage
   - `referred_phone`: 08794613258
   - `referrer_phone`: admin's phone
   - `status`: active

4. **users sheet** → Update admin's row:
   - `total_points`: +10000

## Debug Steps

### Step 1: Check GAS Execution Logs

1. Open Google Apps Script:
   - Go to [script.google.com](https://script.google.com)
   - Select the Gosembako project
   - Click **Execution log** (🐛 icon)

2. Look for entries from when ORD-099628 was processed
3. Search for logs with:
   - `✅ [addRowToSheet] Row added successfully`
   - `❌ [addRowToSheet] Error adding row`
   - `❌ [getSheet] Sheet not found`

### Step 2: Verify Sheets Exist

Check that ALL these sheets exist in the Google Sheet:
- [ ] `users`
- [ ] `orders`
- [ ] `referrals`
- [ ] `points_history`
- [ ] `vouchers`

If missing, create them with proper headers.

### Step 3: Run Diagnostic Function

In Apps Script editor, run:

```javascript
// Verify data for the specific order
verifyReferralRecorded('ORD-099628', '08794613258', 'ADMI1542');
```

This will check all 4 sheets and report if the data was recorded.

### Step 4: Check Sheet Permissions

Ensure the GAS service account has write access to all sheets:
1. Open Google Sheet
2. Check share settings → Make sure GAS account has Editor access

### Step 5: Check Sheet Structure

Verify each sheet has the correct column headers:

**referrals sheet headers:**
```
id, referrer_phone, referrer_code, referred_phone, referred_name, status, first_order_id, created_at, completed_at
```

**points_history sheet headers:**
```
id, user_phone, referral_code, transaction_date, type, amount, balance_before, balance_after, description, source_id, created_at
```

**vouchers sheet headers:**
```
voucher_code, type, discount_amount, referrer_phone, referred_phone, status, created_at, expiry_date, used_at, order_id, generated_by, notes
```

## Common Issues & Solutions

### Issue: "Sheet not found" error
**Solution:** Create missing sheet with correct column headers

### Issue: Data added but wrong columns
**Solution:** Verify column headers match EXACTLY (including spelling, spaces, capitalization)

### Issue: No logs appearing
**Solution:** 
- Redeploy the GAS as new version
- Clear browser cache
- Verify GAS URL in CONFIG is correct

## Testing

After fixing, test with:

```javascript
// Test function in Apps Script console
testProcessReferral();
```

Then run:
```javascript
verifyReferralRecorded('ORD-001', '081234567890', 'ADMI1542');
```

## Key Files

- **Backend:** `REFERRAL_BACKEND_GAS.gs`
- **Frontend:** `assets/js/referral-helper.js`
- **Config:** `assets/js/config.js` (contains GAS URL)

## Next Steps

1. [ ] Check execution logs for ORD-099628
2. [ ] Verify all sheets exist with correct headers
3. [ ] Run `verifyReferralRecorded()` diagnostic
4. [ ] Review error messages in logs
5. [ ] Fix any issues found
6. [ ] Re-test with new order

---

**Generated:** 2026-01-23
**Order ID:** ORD-099628
**Issue:** Data not being recorded to sheets despite successful API response
