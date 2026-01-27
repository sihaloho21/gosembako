# Backend Deployment Guide

## 📋 Prerequisites

Before deploying the backend, you need:

1. Google Account with access to Google Sheets
2. The GoSembako Google Sheets file
3. Google Apps Script permissions

## 🚀 Deployment Steps

### Step 1: Prepare Google Sheets

#### 1.1 Add Columns to `users` Sheet

Open your Google Sheets and add these 4 columns after the last existing column:

| Column Name | Data Type | Default Value | Description |
|------------|-----------|---------------|-------------|
| `referral_code` | Text | (empty) | User's unique referral code (auto-generated) |
| `referred_by` | Text | (empty) | Referral code used during registration |
| `referral_count` | Number | 0 | Number of successful referrals |
| `referral_points_earned` | Number | 0 | Total points earned from referrals |

**How to add:**
1. Open the `users` sheet
2. Scroll to the last column
3. Right-click → Insert 4 columns to the right
4. Name the headers as shown above
5. Set default value 0 for numeric columns

#### 1.2 Create `referral_history` Sheet

Create a new sheet named `referral_history` with these columns:

| Column Name | Data Type | Description |
|------------|-----------|-------------|
| `id` | Text | Unique ID (format: ref_1234567890) |
| `referrer_code` | Text | Referral code that was used |
| `referee_name` | Text | Name of the new user |
| `referee_whatsapp` | Text | WhatsApp of the new user |
| `event_type` | Text | registration, first_order, etc. |
| `referrer_reward` | Number | Points given to referrer |
| `referee_reward` | Number | Points given to referee |
| `status` | Text | completed, pending, cancelled |
| `created_at` | Text | Timestamp |

**How to create:**
1. Click the `+` button at the bottom of the sheet tabs
2. Rename the new sheet to `referral_history`
3. Add the column headers in row 1

### Step 2: Deploy Google Apps Script

#### 2.1 Open Apps Script Editor

1. In your Google Sheets, go to **Extensions** → **Apps Script**
2. Delete any existing code in `Code.gs`
3. Copy the entire content from `/backend/Code.gs`
4. Paste it into the Apps Script editor

#### 2.2 Configure Spreadsheet ID

1. Get your Spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit
   ```
2. In the Apps Script editor, find line 17:
   ```javascript
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
   ```
3. Replace `'YOUR_SPREADSHEET_ID_HERE'` with your actual Spreadsheet ID

#### 2.3 Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure:
   - **Description:** "GoSembako Referral API"
   - **Execute as:** Me (your email)
   - **Who has access:** Anyone
5. Click **Deploy**
6. **IMPORTANT:** Copy the **Web App URL** (you'll need this for frontend)
7. Click **Done**

### Step 3: Test the Backend

#### 3.1 Test Validate Referral

Open this URL in your browser:
```
YOUR_WEB_APP_URL?action=validate_referral&code=TEST123
```

Expected response:
```json
{"valid":false}
```

#### 3.2 Test Get Referral Stats

```
YOUR_WEB_APP_URL?action=get_referral_stats&user_id=test_user
```

Expected response:
```json
{
  "error":"User not found",
  "referral_count":0,
  "referral_points_earned":0
}
```

If you get these responses, the backend is working! ✅

### Step 4: Update Frontend Configuration

#### 4.1 Update API URL

You need to update the frontend to use the new Web App URL.

**Method 1: Via Admin Panel (Recommended)**
1. Login to admin panel
2. Go to Settings
3. Update "API URL" with your Web App URL
4. Save

**Method 2: Via Code**
1. Open your frontend code
2. Find the CONFIG object
3. Update the API URL:
   ```javascript
   const CONFIG = {
       mainApiUrl: 'YOUR_WEB_APP_URL_HERE'
   };
   ```

## ✅ Verification Checklist

After deployment, verify everything is working:

- [ ] `users` sheet has 4 new columns
- [ ] `referral_history` sheet exists with 9 columns
- [ ] Apps Script deployed successfully
- [ ] Web App URL copied
- [ ] Test endpoints return valid JSON
- [ ] Frontend CONFIG updated with new URL
- [ ] No errors in Apps Script execution log

## 🔒 Security Notes

1. **NEVER** commit your Spreadsheet ID to public repositories
2. **NEVER** expose the Web App URL publicly (it has full access to your sheets)
3. Consider adding rate limiting if needed
4. Monitor the Apps Script execution logs regularly

## 🐛 Troubleshooting

### Error: "referral_code column missing"

**Solution:** You forgot to add the columns to the `users` sheet. Go back to Step 1.1.

### Error: "referral_history sheet not found"

**Solution:** You forgot to create the referral_history sheet. Go back to Step 1.2.

### Error: "Authorization required"

**Solution:** 
1. In Apps Script, click on the clock icon (Triggers)
2. Remove any existing triggers
3. Redeploy the web app
4. Make sure "Execute as: Me" is selected

### Error: "Script has not been enabled"

**Solution:**
1. The first time you deploy, Google will ask for permissions
2. Click "Review Permissions"
3. Choose your Google account
4. Click "Advanced" → "Go to GoSembako API (unsafe)"
5. Click "Allow"

## 📝 Maintenance

### Viewing Logs

1. In Apps Script editor, click **Executions** (left sidebar)
2. View recent execution logs
3. Check for any errors

### Updating the Code

1. Make changes in Apps Script editor
2. **Save** the project (Ctrl+S or Cmd+S)
3. Click **Deploy** → **Manage deployments**
4. Click the pencil icon ✏️ next to your deployment
5. Change version to "New version"
6. Click **Deploy**
7. The URL stays the same, no need to update frontend

## 🎯 Next Steps

After backend is deployed:

1. Test the complete referral flow
2. Monitor the first few registrations
3. Check if points are awarded correctly
4. Verify referral_history records are created
5. Set up monitoring/alerts if needed

---

**Deployment Status:** [ ] Not Started | [ ] In Progress | [ ] Complete

**Deployed By:** _______________  
**Date:** _______________  
**Web App URL:** _______________
