/**
 * GoSembako Backend API - Google Apps Script
 * Referral Program Implementation
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Open Google Apps Script: https://script.google.com
 * 2. Create new project named "GoSembako API"
 * 3. Copy this entire file to Code.gs
 * 4. Update SPREADSHEET_ID below with your Google Sheets ID
 * 5. Deploy as Web App:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy the Web App URL to frontend CONFIG
 */

// ========================================
// CONFIGURATION
// ========================================

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Update this!

// ========================================
// MAIN HANDLERS
// ========================================

/**
 * Handle GET requests
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    // Validate referral code
    if (action === 'validate_referral') {
      const code = e.parameter.code;
      const result = validateReferralCode(code);
      return createJsonResponse(result);
    }
    
    // Get referral stats for user
    if (action === 'get_referral_stats') {
      const userId = e.parameter.user_id;
      const result = getReferralStats(userId);
      return createJsonResponse(result);
    }
    
    // Get sheet data (existing functionality)
    if (e.parameter.sheet) {
      const sheet = e.parameter.sheet;
      const data = getSheetData(sheet);
      return createJsonResponse(data);
    }
    
    return createJsonResponse({ error: 'Invalid action or missing parameters' });
    
  } catch (error) {
    Logger.log('Error in doGet: ' + error.message);
    return createJsonResponse({ error: error.message });
  }
}

/**
 * Handle POST requests
 */
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    
    // Register user with referral
    if (action === 'register') {
      const result = registerWithReferral(params.data);
      return createJsonResponse(result);
    }
    
    // Create referral history record
    if (action === 'create' && params.sheet === 'referral_history') {
      const result = createReferralHistory(params.data);
      return createJsonResponse(result);
    }
    
    // Update user (existing functionality, enhanced for referral)
    if (action === 'update' && params.sheet === 'users') {
      const result = updateUser(params.id, params.data);
      return createJsonResponse(result);
    }
    
    return createJsonResponse({ error: 'Invalid action' });
    
  } catch (error) {
    Logger.log('Error in doPost: ' + error.message);
    return createJsonResponse({ error: error.message });
  }
}

// ========================================
// REFERRAL FUNCTIONS
// ========================================

/**
 * Validate referral code and return referrer info
 */
function validateReferralCode(code) {
  if (!code || code.trim() === '') {
    return { valid: false };
  }
  
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('users');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const codeIdx = headers.indexOf('referral_code');
  const idIdx = headers.indexOf('id');
  const nameIdx = headers.indexOf('nama');
  
  // Check if referral_code column exists
  if (codeIdx === -1) {
    Logger.log('ERROR: referral_code column not found in users sheet');
    return { valid: false, error: 'referral_code column missing' };
  }
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][codeIdx] && 
        data[i][codeIdx].toString().toUpperCase() === code.toString().toUpperCase()) {
      return {
        valid: true,
        referrer_name: data[i][nameIdx],
        referrer_id: data[i][idIdx]
      };
    }
  }
  
  return { valid: false };
}

/**
 * Get referral statistics for a user
 */
function getReferralStats(userId) {
  if (!userId) {
    return {
      error: 'User ID required',
      referral_count: 0,
      referral_points_earned: 0
    };
  }
  
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('users');
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

/**
 * Register user with referral support
 */
function registerWithReferral(userData) {
  const usersSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('users');
  
  // Get settings
  const referrerReward = 100; // Default from referral_settings
  const refereeBonus = 50;    // Default from referral_settings
  
  // Generate user ID and referral code
  const userId = 'user_' + Date.now();
  const referralCode = generateReferralCode(userData.nama);
  
  // Validate referral code if provided
  let referrerData = null;
  if (userData.referred_by) {
    referrerData = validateReferralCode(userData.referred_by);
    if (!referrerData.valid) {
      Logger.log('Invalid referral code: ' + userData.referred_by);
      userData.referred_by = '';
      referrerData = null;
    }
  }
  
  // Create user record
  const timestamp = new Date().toLocaleString('id-ID');
  const today = new Date();
  const tanggalDaftar = Utilities.formatDate(today, 'Asia/Jakarta', 'yyyy-MM-dd');
  
  const newUser = {
    id: userId,
    nama: userData.nama,
    whatsapp: userData.whatsapp,
    pin: userData.pin,
    total_points: referrerData ? refereeBonus : 0,
    status: 'aktif',
    created_at: timestamp,
    tanggal_daftar: tanggalDaftar,
    referral_code: referralCode,
    referred_by: userData.referred_by || '',
    referral_count: 0,
    referral_points_earned: 0
  };
  
  // Insert user
  const headers = usersSheet.getRange(1, 1, 1, usersSheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => newUser[h] !== undefined ? newUser[h] : '');
  usersSheet.appendRow(row);
  
  // If referred by someone, update referrer
  if (referrerData && referrerData.valid) {
    updateReferrerOnRegistration(usersSheet, referrerData.referrer_id, referrerReward);
    
    // Note: Frontend will create referral_history record via separate API call
    Logger.log('User registered with referral: ' + referralCode + ' (referred by: ' + userData.referred_by + ')');
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
 * Generate unique referral code
 */
function generateReferralCode(name) {
  const firstName = name.split(' ')[0].toUpperCase();
  const prefix = firstName.substring(0, 4).padEnd(4, 'X');
  const random = Math.floor(1000 + Math.random() * 9000);
  const code = 'REF-' + prefix + random;
  
  // Check uniqueness (simple check)
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('users');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const codeIdx = headers.indexOf('referral_code');
  
  if (codeIdx !== -1) {
    for (let i = 1; i < data.length; i++) {
      if (data[i][codeIdx] === code) {
        // Code exists, try again
        return generateReferralCode(name);
      }
    }
  }
  
  return code;
}

/**
 * Update referrer stats when someone registers with their code
 */
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
      
      // Update referral count
      if (countIdx !== -1) {
        const currentCount = data[i][countIdx] || 0;
        sheet.getRange(row, countIdx + 1).setValue(currentCount + 1);
      }
      
      // Update referral points earned
      if (earnedIdx !== -1) {
        const currentEarned = data[i][earnedIdx] || 0;
        sheet.getRange(row, earnedIdx + 1).setValue(currentEarned + points);
      }
      
      // Update total points
      if (pointsIdx !== -1) {
        const currentPoints = data[i][pointsIdx] || 0;
        sheet.getRange(row, pointsIdx + 1).setValue(currentPoints + points);
      }
      
      Logger.log('Updated referrer: ' + referrerId + ' (+' + points + ' points)');
      break;
    }
  }
}

/**
 * Create referral history record
 */
function createReferralHistory(data) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('referral_history');
    
    if (!sheet) {
      Logger.log('ERROR: referral_history sheet not found');
      return {
        success: false,
        error: 'referral_history sheet not found. Please create it first.'
      };
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const row = headers.map(h => data[h] !== undefined ? data[h] : '');
    sheet.appendRow(row);
    
    Logger.log('Referral history created: ' + data.id);
    
    return {
      success: true,
      created: true,
      id: data.id
    };
  } catch (error) {
    Logger.log('Error creating referral history: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update user record
 */
function updateUser(userId, updateData) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('users');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf('id');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIdx] === userId) {
      const row = i + 1;
      
      // Update each field
      Object.keys(updateData).forEach(key => {
        const colIdx = headers.indexOf(key);
        if (colIdx !== -1) {
          sheet.getRange(row, colIdx + 1).setValue(updateData[key]);
        }
      });
      
      return { success: true, updated: true };
    }
  }
  
  return { success: false, error: 'User not found' };
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Get all data from a sheet
 */
function getSheetData(sheetName) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  
  if (!sheet) {
    return { error: 'Sheet not found: ' + sheetName };
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = [];
  
  for (let i = 1; i i < data.length; i++) {
    const row = {};
    headers.forEach((header, index) => {
      row[header] = data[i][index];
    });
    rows.push(row);
  }
  
  return rows;
}

/**
 * Create JSON response
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================================
// TESTING FUNCTIONS (Optional)
// ========================================

/**
 * Test validate referral code
 */
function testValidateReferral() {
  const result = validateReferralCode('REF-TEST1234');
  Logger.log(result);
}

/**
 * Test get referral stats
 */
function testGetStats() {
  const result = getReferralStats('user_123456');
  Logger.log(result);
}
