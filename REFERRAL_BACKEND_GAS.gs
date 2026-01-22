/**
 * GOOGLE APPS SCRIPT: Referral System Backend
 * 
 * Functionality:
 * 1. Process new orders dan track first-time purchases
 * 2. Credit referrer dengan poin otomatis
 * 3. Manage referral data (users, referrals, points_history sheets)
 * 4. Provide API endpoints untuk frontend
 * 
 * Installation:
 * 1. Copy ini ke Google Apps Script console (script.google.com)
 * 2. Authorize script (grant permissions to access Google Sheets)
 * 3. Deploy as Web App (Execute as ME, Anyone)
 * 4. Copy Web App URL dan masukkan di frontend CONFIG
 * 
 * Usage dari Frontend:
 * - POST /processReferral → Process new order + credit referrer
 * - GET /getReferralStats → Get referral stats untuk user
 */

// ============================================================================
// CONFIG
// ============================================================================

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const SHEETS = {
  USERS: 'users',
  ORDERS: 'orders',
  REFERRALS: 'referrals',
  POINTS_HISTORY: 'points_history',
  VOUCHERS: 'vouchers'
};

const REFERRAL_CONFIG = {
  REFERRER_REWARD: 10000,        // Poin yang dapat referrer ketika referred user beli
  REFERRED_DISCOUNT: 25000,      // Max diskon untuk referred user (Rp 25.000)
  REFERRED_DISCOUNT_PERCENT: 10, // Diskon percentage (10%)
  VOUCHER_EXPIRY_DAYS: 30,       // Voucher berlaku selama 30 hari
};

// ============================================================================
// SHEET SCHEMA DEFINITIONS (for audit)
// ============================================================================

const REFERRAL_SHEET_DEFS = {
  users: ['id','nama','whatsapp','pin','referral_code','referrer_id','total_points','status','created_at','updated_at'],
  referrals: ['id','referrer_phone','referrer_code','referred_phone','referred_name','status','first_order_id','created_at','completed_at'],
  points_history: ['id','user_phone','referral_code','transaction_date','type','amount','balance_before','balance_after','description','source_id','created_at'],
  vouchers: ['voucher_code','type','discount_amount','referrer_phone','referred_phone','status','created_at','expiry_date','used_at','order_id','generated_by','notes'],
  orders: ['order_id','phone','name','total_amount','status','created_at','used_voucher','referral_source'],
  settings: ['key','value','notes']
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get sheet by name, create if not exists
 */
function getSheet(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    console.error(`Sheet "${sheetName}" not found!`);
    return null;
  }
  return sheet;
}

/**
 * Get all data dari sheet sebagai array of objects
 */
function getSheetData(sheetName) {
  const sheet = getSheet(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    rows.push(row);
  }
  
  return rows;
}

/**
 * Find user by whatsapp number
 */
function findUserByWhatsapp(whatsapp) {
  const users = getSheetData(SHEETS.USERS);
  const normalized = normalizePhone(whatsapp);
  
  return users.find(u => normalizePhone(u.whatsapp) === normalized);
}

/**
 * Find user by referral code
 */
function findUserByReferralCode(code) {
  const users = getSheetData(SHEETS.USERS);
  return users.find(u => u.referral_code === code);
}

/**
 * Normalize phone number (remove all non-digits)
 */
function normalizePhone(phone) {
  return String(phone).replace(/[^0-9]/g, '');
}

/**
 * Find order by ID
 */
function findOrderById(orderId) {
  const orders = getSheetData(SHEETS.ORDERS);
  return orders.find(o => String(o.id) === String(orderId));
}

/**
 * Check if user has made a first order (any order)
 */
function hasUserMadeFirstOrder(whatsapp) {
  const orders = getSheetData(SHEETS.ORDERS);
  const normalized = normalizePhone(whatsapp);
  
  return orders.some(o => normalizePhone(o.phone) === normalized);
}

/**
 * Generate unique voucher code
 * Format: DISC10K-XXXXX (random 5 characters)
 */
function generateVoucherCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'DISC10K-';
  
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

/**
 * Add row to sheet
 */
function addRowToSheet(sheetName, rowData) {
  const sheet = getSheet(sheetName);
  if (!sheet) return false;
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = [];
  
  for (let i = 0; i < headers.length; i++) {
    row.push(rowData[headers[i]] || '');
  }
  
  sheet.appendRow(row);
  return true;
}

/**
 * Update cell in sheet
 */
function updateCell(sheetName, rowIndex, columnName, value) {
  const sheet = getSheet(sheetName);
  if (!sheet) return false;
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const colIndex = headers.indexOf(columnName);
  
  if (colIndex === -1) {
    console.error(`Column "${columnName}" not found!`);
    return false;
  }
  
  sheet.getRange(rowIndex + 1, colIndex + 1).setValue(value);
  return true;
}

/**
 * Get timestamp sekarang
 */
function getNowTimestamp() {
  return new Date().toLocaleString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// ============================================================================
// REFERRAL PROCESSING LOGIC
// ============================================================================

/**
 * Main function: Process order dan credit referrer jika applicable
 * 
 * Logic:
 * 1. Cek user ada di referrals sheet (referred_id)
 * 2. Cek apakah ini first order user (hanya 1 order di orders sheet)
 * 3. Jika first order, credit referrer dengan poin
 * 4. Mark referral sebagai completed
 * 5. Generate voucher untuk referred user
 */
function processReferral(orderId, customerPhone, customerName) {
  try {
    Logger.log('🔄 Processing referral for order: ' + orderId);
    
    // Step 1: Cari user yang baru beli
    const buyer = findUserByWhatsapp(customerPhone);
    if (!buyer) {
      Logger.log('❌ Buyer not found in users sheet');
      return {
        success: false,
        message: 'User tidak ditemukan',
        referralProcessed: false
      };
    }
    
    Logger.log('✅ Buyer found: ' + buyer.nama);
    
    // Step 2: Cek apakah buyer adalah referred user (punya referrer_id)
    if (!buyer.referrer_id || buyer.referrer_id === '' || buyer.referrer_id === 'N/A') {
      Logger.log('ℹ️ Buyer is not a referred user');
      return {
        success: true,
        message: 'User bukan referred user (tidak ada referrer)',
        referralProcessed: false
      };
    }
    
    Logger.log('✅ Buyer adalah referred user, referrer_id: ' + buyer.referrer_id);
    
    // Step 3: Cari referrer
    const referrer = findUserByReferralCode(buyer.referrer_id);
    if (!referrer) {
      Logger.log('❌ Referrer not found');
      return {
        success: false,
        message: 'Referrer tidak ditemukan',
        referralProcessed: false
      };
    }
    
    Logger.log('✅ Referrer found: ' + referrer.nama);
    
    // Step 4: Check apakah sudah ada completed referral (to prevent duplicate credits)
    const referrals = getSheetData(SHEETS.REFERRALS);
    const existingReferral = referrals.find(r => 
      r.referrer_id === buyer.referrer_id && 
      r.referred_id === buyer.id && 
      r.status === 'completed'
    );
    
    if (existingReferral) {
      Logger.log('⚠️ Referral sudah completed sebelumnya, skip');
      return {
        success: true,
        message: 'Referral sudah pernah di-process',
        referralProcessed: false
      };
    }
    
    // Step 5: Get order untuk confirm first purchase
    const order = findOrderById(orderId);
    if (!order) {
      Logger.log('❌ Order not found');
      return {
        success: false,
        message: 'Order tidak ditemukan',
        referralProcessed: false
      };
    }
    
    // Step 6: Count total orders untuk buyer (should be 1 jika ini first order)
    const buyerOrders = getSheetData(SHEETS.ORDERS).filter(o => 
      normalizePhone(o.phone) === normalizePhone(customerPhone)
    );
    
    Logger.log('📊 Buyer has ' + buyerOrders.length + ' orders total');
    
    if (buyerOrders.length !== 1) {
      // Bukan first order, jadi skip referral credit
      Logger.log('ℹ️ Bukan first order dari buyer, skip referral credit');
      return {
        success: true,
        message: 'Bukan pembelian pertama',
        referralProcessed: false
      };
    }
    
    // Step 7: Credit referrer dengan poin
    Logger.log('💰 Crediting referrer with ' + REFERRAL_CONFIG.REFERRER_REWARD + ' points');
    
    const newPoints = parseInt(referrer.total_points || 0) + REFERRAL_CONFIG.REFERRER_REWARD;
    
    // Find referrer row index untuk update
    const users = getSheetData(SHEETS.USERS);
    const referrerRowIndex = users.findIndex(u => u.referral_code === buyer.referrer_id);
    
    if (referrerRowIndex !== -1) {
      updateCell(SHEETS.USERS, referrerRowIndex, 'total_points', newPoints);
      Logger.log('✅ Referrer points updated: ' + newPoints);
    }
    
    // Step 8: Create referral record
    const referralId = 'REF-' + Date.now();
    addRowToSheet(SHEETS.REFERRALS, {
      referral_id: referralId,
      referrer_id: buyer.referrer_id,
      referred_id: buyer.id,
      referred_name: buyer.nama,
      status: 'completed',
      reward_points: REFERRAL_CONFIG.REFERRER_REWARD,
      order_id: orderId,
      created_at: new Date().toISOString(),
      completed_at: getNowTimestamp()
    });
    
    Logger.log('✅ Referral record created: ' + referralId);
    
    // Step 9: Add points history untuk referrer
    addRowToSheet(SHEETS.POINTS_HISTORY, {
      history_id: 'PH-' + Date.now(),
      user_id: referrer.id,
      referral_code: referrer.referral_code,
      transaction_type: 'referral_reward',
      points_change: REFERRAL_CONFIG.REFERRER_REWARD,
      points_before: parseInt(referrer.total_points || 0),
      points_after: newPoints,
      reference_id: referralId,
      description: 'Reward dari referral ' + buyer.nama,
      created_at: getNowTimestamp()
    });
    
    Logger.log('✅ Points history recorded');
    
    // Step 10: Generate & create voucher untuk referred user (jika pertama kali)
    const voucherCode = generateVoucherCode();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + REFERRAL_CONFIG.VOUCHER_EXPIRY_DAYS);
    
    addRowToSheet(SHEETS.VOUCHERS, {
      voucher_id: 'VCH-' + Date.now(),
      voucher_code: voucherCode,
      type: 'percentage',
      value: REFERRAL_CONFIG.REFERRED_DISCOUNT_PERCENT,
      max_discount: REFERRAL_CONFIG.REFERRED_DISCOUNT,
      user_id: buyer.id,
      is_used: false,
      expires_at: expiryDate.toLocaleDateString('id-ID'),
      created_at: getNowTimestamp()
    });
    
    Logger.log('✅ Voucher created: ' + voucherCode);
    
    // Success response
    return {
      success: true,
      message: 'Referral processed successfully',
      referralProcessed: true,
      referrer_name: referrer.nama,
      referrer_reward: REFERRAL_CONFIG.REFERRER_REWARD,
      referral_id: referralId,
      voucher_code: voucherCode,
      voucher_discount: REFERRAL_CONFIG.REFERRED_DISCOUNT_PERCENT + '%'
    };
    
  } catch (error) {
    Logger.log('❌ Error: ' + error.toString());
    return {
      success: false,
      message: 'Error: ' + error.toString(),
      referralProcessed: false
    };
  }
}

/**
 * Get referral statistics untuk user
 */
function getReferralStats(referralCode) {
  try {
    const referrals = getSheetData(SHEETS.REFERRALS);
    const userReferrals = referrals.filter(r => r.referrer_id === referralCode);
    
    const completed = userReferrals.filter(r => r.status === 'completed');
    const pending = userReferrals.filter(r => r.status === 'pending');
    
    const totalPoints = completed.reduce((sum, r) => {
      return sum + (parseInt(r.reward_points) || 0);
    }, 0);
    
    return {
      success: true,
      total_referred: userReferrals.length,
      total_completed: completed.length,
      total_pending: pending.length,
      total_points: totalPoints,
      referrals: userReferrals.map(r => ({
        id: r.referred_id,
        name: r.referred_name,
        status: r.status,
        reward_points: r.reward_points,
        completed_at: r.completed_at
      }))
    };
  } catch (error) {
    Logger.log('❌ Error getting referral stats: ' + error.toString());
    return {
      success: false,
      message: 'Error: ' + error.toString()
    };
  }
}

/**
 * Get user points history
 */
function getUserPointsHistory(referralCode) {
  try {
    const history = getSheetData(SHEETS.POINTS_HISTORY);
    const userHistory = history.filter(h => h.referral_code === referralCode);
    
    return {
      success: true,
      history: userHistory.map(h => ({
        id: h.history_id,
        type: h.transaction_type,
        change: h.points_change,
        before: h.points_before,
        after: h.points_after,
        description: h.description,
        date: h.created_at
      }))
    };
  } catch (error) {
    Logger.log('❌ Error getting points history: ' + error.toString());
    return {
      success: false,
      message: 'Error: ' + error.toString()
    };
  }
}

// ============================================================================
// WEB APP HANDLERS (untuk API requests dari frontend)
// ============================================================================

/**
 * Handle POST requests
 * 
 * Endpoints:
 * - POST /processReferral → Process order referral
 * - POST /getReferralStats → Get referral stats
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    Logger.log('📨 POST request: ' + action);
    Logger.log('Data: ' + JSON.stringify(data));
    
    let response;
    
    switch (action) {
      case 'processReferral':
        response = processReferral(
          data.orderId,
          data.phone,
          data.name
        );
        break;
        
      case 'getReferralStats':
        response = getReferralStats(data.referralCode);
        break;
        
      case 'getUserPointsHistory':
        response = getUserPointsHistory(data.referralCode);
        break;
        
      default:
        response = {
          success: false,
          message: 'Unknown action: ' + action
        };
    }
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('❌ Error in doPost: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Error: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle GET requests (untuk testing)
 */
function doGet(e) {
  const action = e.parameter.action;
  
  Logger.log('📨 GET request: ' + action);
  
  let response;
  
  switch (action) {
    case 'getStats':
      response = {
        success: true,
        message: 'API is working',
        referral_config: REFERRAL_CONFIG,
        sheets_available: [
          SHEETS.USERS,
          SHEETS.ORDERS,
          SHEETS.REFERRALS,
          SHEETS.POINTS_HISTORY,
          SHEETS.VOUCHERS
        ]
      };
      break;
      
    case 'test':
      response = {
        success: true,
        message: 'Test successful',
        timestamp: new Date().toISOString()
      };
      break;
      
    case 'auditSheets':
      const sheetId = e.parameter.spreadsheetId || SPREADSHEET_ID;
      const fix = (e.parameter.fix || 'false') === 'true';
      const auditResult = auditReferralSheetsById(sheetId, fix);
      response = {
        success: true,
        result: auditResult
      };
      break;
      
    default:
      response = {
        success: false,
        message: 'Unknown action. Available: getStats, test, auditSheets'
      };
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// AUDIT FUNCTIONS (verify & fix sheet structure)
// ============================================================================

/**
 * Audit referral sheets in a target spreadsheet
 * @param {string} spreadsheetId - Target spreadsheet ID
 * @param {boolean} fix - If true, auto-create/fix missing sheets and headers
 * @returns {object} Audit report
 */
function auditReferralSheetsById(spreadsheetId, fix = false) {
  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const report = {
      spreadsheetId,
      timestamp: new Date().toISOString(),
      ok: true,
      missingSheets: [],
      headerIssues: [],
      created: [],
      fixedHeaders: []
    };

    Object.entries(REFERRAL_SHEET_DEFS).forEach(([name, expectedHeaders]) => {
      let sh = ss.getSheetByName(name);
      
      if (!sh) {
        report.ok = false;
        report.missingSheets.push(name);
        if (fix) {
          sh = ss.insertSheet(name);
          sh.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
          sh.setFrozenRows(1);
          report.created.push(name);
        }
        return;
      }
      
      // Check headers
      const firstRow = sh.getRange(1, 1, 1, expectedHeaders.length).getValues()[0] || [];
      const mismatch = expectedHeaders.some((h, i) => (firstRow[i] || '').toString().trim() !== h);
      
      if (mismatch) {
        report.ok = false;
        report.headerIssues.push({
          sheet: name,
          expected: expectedHeaders,
          found: firstRow
        });
        if (fix) {
          sh.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
          sh.setFrozenRows(1);
          report.fixedHeaders.push(name);
        }
      }
    });

    return report;
  } catch (err) {
    return {
      spreadsheetId,
      ok: false,
      error: String(err),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Audit current active spreadsheet (convenience wrapper)
 */
function auditCurrentSheets(fix = false) {
  return auditReferralSheetsById(SPREADSHEET_ID, fix);
}

// ============================================================================
// TEST FUNCTIONS (untuk development/debugging)
// ============================================================================

/**
 * Test function: Create sample referral data
 * Run dari Apps Script editor: Ctrl+Enter
 */
function testProcessReferral() {
  Logger.log('🧪 Testing referral processing...');
  
  // Simulate order
  const result = processReferral(
    'ORD-001',
    '081234567890',
    'Test Customer'
  );
  
  Logger.log('Result: ' + JSON.stringify(result));
}

/**
 * Test function: Get all sheets data
 */
function testGetAllData() {
  Logger.log('🧪 Getting all data...');
  
  for (let sheet in SHEETS) {
    const data = getSheetData(SHEETS[sheet]);
    Logger.log(`${SHEETS[sheet]}: ${data.length} rows`);
  }
}

/**
 * Test function: List all users
 */
function testListUsers() {
  Logger.log('🧪 Listing all users...');
  
  const users = getSheetData(SHEETS.USERS);
  users.forEach(u => {
    Logger.log(`${u.nama} (${u.whatsapp}) - Ref: ${u.referral_code}, Points: ${u.total_points}`);
  });
}
