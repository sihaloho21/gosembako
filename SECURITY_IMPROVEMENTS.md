# 🔒 Security Improvements - GoSembako Referral System

**Date**: 23 Januari 2026  
**Status**: Implementation Guide

---

## 1. GAS URL Security

### Current Issue
- Google Apps Script URL adalah **public & exposed** di browser (file `config.js`)
- Siapa pun bisa melihat URL GAS di browser console → bisa abuse API
- Tidak ada rate limiting atau authentication

### ✅ Solutions Implemented

#### Option A: Use Netlify Functions (Recommended)
Pindahkan logic API call ke Netlify Functions untuk menyembunyikan GAS URL.

**Benefits:**
- GAS URL tersembunyi dari client-side
- Netlify Function bisa implement rate limiting
- Bisa add API key validation
- Lebih professional dan secure

**Implementation:**
```bash
# Create Netlify function
netlify/functions/referral.js
```

```javascript
// netlify/functions/referral.js
exports.handler = async (event) => {
    const { action, data } = JSON.parse(event.body);
    
    // Get GAS URL dari environment variable
    const GAS_URL = process.env.REACT_APP_GAS_URL;
    
    // Call GAS backend
    const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action, ...data })
    });
    
    return {
        statusCode: 200,
        body: JSON.stringify(await response.json())
    };
};
```

**Update netlify.toml:**
```toml
[build]
functions = "netlify/functions"

[context.production]
environment = { REACT_APP_GAS_URL = "https://script.google.com/..." }
```

**Update frontend:**
```javascript
// assets/js/referral-helper.js
async function callGASAPI(action, data) {
    const response = await fetch('/.netlify/functions/referral', {
        method: 'POST',
        body: JSON.stringify({ action, ...data })
    });
    
    return response.json();
}
```

#### Option B: Use Environment Variables
Tetap pakai direct GAS call tapi ukur lebih careful.

**netlify.toml:**
```toml
[build]
environment = { REACT_APP_GAS_URL = "https://script.google.com/..." }

[context.preview]
environment = { REACT_APP_GAS_URL = "https://script.google.com/..." }

[context.production]
environment = { REACT_APP_GAS_URL = "https://script.google.com/..." }
```

**config.js:**
```javascript
getGASUrl() {
    // Dari environment variable
    const envUrl = window.REACT_APP_GAS_URL || 
                   import.meta.env.VITE_GAS_URL ||
                   process.env.REACT_APP_GAS_URL;
    
    if (envUrl) return envUrl;
    
    // Fallback ke localStorage
    return localStorage.getItem('sembako_gas_url');
}
```

### ⚠️ Current Mitigation
Sampai implementasi di atas selesai:

1. **GAS Web App Security:**
   - Deploy dengan "Execute as ME" ✅
   - "Anyone" akses tapi validate referral code ✅

2. **Validation di Backend:**
   - Cek referral code valid
   - Cek phone number normalization
   - Anti-duplicate checks ✅

3. **Client-side Obfuscation:**
   ```javascript
   // Encode GAS URL di config
   const GAS_URL_ENCODED = btoa('https://script.google.com/...');
   // Decode saat digunakan
   const gasUrl = atob(GAS_URL_ENCODED);
   ```

---

## 2. API Rate Limiting

### Issue
- Tidak ada rate limiting di GAS
- Bisa spam API dengan banyak requests

### ✅ Solution

**Option A: Implement di Netlify Function**
```javascript
// netlify/functions/rate-limiter.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

exports.handler = limiter(async (event) => {
    // Handle request
});
```

**Option B: Implement di GAS dengan timestamp check**
```javascript
// REFERRAL_BACKEND_GAS.gs
const REQUEST_LIMITS = {
    'processReferral': 1,      // 1 request per IP per second
    'getReferralStats': 10,    // 10 requests per IP per second
};

function checkRateLimit(clientIp, action) {
    const key = `${clientIp}_${action}`;
    const cache = CacheService.getScriptCache();
    
    const lastCall = cache.get(key);
    if (lastCall) {
        return false; // Rate limited
    }
    
    cache.put(key, Date.now(), 1); // Cache for 1 second
    return true;
}
```

---

## 3. Input Validation

### ✅ Current Implementation
- Phone normalization ✅
- Referral code validation ✅
- Order ID checking ✅

### Enhancement Needed
```javascript
// assets/js/referral-helper.js

function validateReferralInput(data) {
    const errors = [];
    
    // Validate referral code format
    if (!data.referralCode || !/^[A-Z0-9]{4,10}$/.test(data.referralCode)) {
        errors.push('Invalid referral code format');
    }
    
    // Validate phone
    if (!data.phone || !/^08\d{8,11}$/.test(normalizePhone(data.phone))) {
        errors.push('Invalid phone number');
    }
    
    // Validate name
    if (!data.name || data.name.length < 2 || data.name.length > 100) {
        errors.push('Invalid name');
    }
    
    return errors;
}
```

---

## 4. CORS Headers

### Current Status
- GAS deploy sebagai Web App dengan "Anyone" akses ✅
- Cross-origin requests already enabled ✅

### Recommendation
Tambah CORS headers di GAS:
```javascript
// REFERRAL_BACKEND_GAS.gs

function doPost(e) {
    // ... existing code ...
    
    const response = ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    
    // Add CORS headers
    response.addHeader('Access-Control-Allow-Origin', '*');
    response.addHeader('Access-Control-Allow-Methods', 'POST, GET');
    response.addHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
}
```

---

## 5. Data Encryption

### Sensitive Data
- Phone numbers ⚠️
- Referral codes ⚠️
- Points balance ⚠️

### ✅ Current Safeguards
- HTTPS only ✅
- No passwords transmitted ✅
- Session-based (localStorage) ✅

### Enhancement
Use hashing untuk referral code storage:
```javascript
function generateSecureReferralCode(userId) {
    const hash = CryptoJS.SHA256(userId + Date.now()).toString();
    return hash.substring(0, 8).toUpperCase();
}
```

---

## 6. Implementation Priority

| Priority | Task | Effort | Security Impact |
|----------|------|--------|-----------------|
| 🔴 High | Implement Netlify Functions | 2-3 hours | Critical |
| 🔴 High | Add rate limiting | 1-2 hours | High |
| 🟡 Medium | Enhanced input validation | 1 hour | Medium |
| 🟢 Low | CORS headers | 30 min | Low |
| 🟢 Low | Data encryption | 2 hours | Low |

---

## 7. Deployment Checklist

- [ ] Implement Netlify Functions wrapper
- [ ] Add rate limiting logic
- [ ] Update config.js to use env vars
- [ ] Add input validation on frontend
- [ ] Add CORS headers to GAS
- [ ] Test security with Burp Suite / OWASP ZAP
- [ ] Document security measures
- [ ] Monitor API logs for abuse patterns

---

## 8. Monitoring

Setup monitoring untuk detect abuse:

```javascript
// netlify/functions/monitor-api.js
const logs = [];

function logAPICall(action, phone, status) {
    logs.push({
        timestamp: new Date(),
        action,
        phone: maskPhone(phone),
        status
    });
    
    // Alert if unusual patterns
    checkAnomalies();
}

function checkAnomalies() {
    const last10Mins = logs.filter(l => 
        Date.now() - l.timestamp < 10 * 60 * 1000
    );
    
    // Alert if >100 calls per IP
    const byIp = {};
    last10Mins.forEach(l => {
        byIp[l.ip] = (byIp[l.ip] || 0) + 1;
    });
    
    Object.entries(byIp).forEach(([ip, count]) => {
        if (count > 100) {
            console.error(`⚠️ Unusual activity from ${ip}: ${count} calls`);
            // Send alert email
        }
    });
}
```

---

## Resources

- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [GAS Security Best Practices](https://developers.google.com/apps-script/security)
- [Environment Variables in Netlify](https://docs.netlify.com/configure-builds/environment-variables/)

---

**Next Step**: Implement Netlify Functions untuk hide GAS URL
