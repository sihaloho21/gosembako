/**
 * GOOGLE APPS SCRIPT: Referral System Backend (v3 - TESTING MODE)
 * 
 * Changelog:
 * - VALIDASI PEMBELIAN PERTAMA DIHILANGKAN UNTUK TESTING.
 * - Setiap order dari referred user akan memberikan poin ke referrer.
 */

// ============================================================================
// CONFIG (Sama seperti sebelumnya)
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
  REFERRER_REWARD: 10000,
  REFERRED_DISCOUNT: 25000,
  REFERRED_DISCOUNT_PERCENT: 10,
  VOUCHER_EXPIRY_DAYS: 30,
};

// ============================================================================
// MAIN ROUTER (doPost)
// ============================================================================
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    let result;

    switch (action) {
      case 'processReferral':
        result = processReferral(payload.orderId, payload.phone, payload.name, payload.referralCode);
        break;
      case 'getReferralStats':
        result = getReferralStats(payload.referralCode);
        break;
      case 'getUserPointsHistory':
        result = getUserPointsHistory(payload.referralCode);
        break;
      default:
        result = { success: false, message: 'Action tidak valid: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('❌ doPost Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Server Error: ' + error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================================
// REFERRAL PROCESSING LOGIC (VALIDASI DIHILANGKAN)
// ============================================================================
function processReferral(orderId, customerPhone, customerName, referralCode) {
  try {
    Logger.log('🔄 [TESTING MODE] Processing referral for order: ' + orderId);
    
    const buyer = findUserByWhatsapp(customerPhone);
    if (!buyer) {
      return { success: false, message: 'User tidak ditemukan.', referralProcessed: false };
    }

    if (!buyer.referrer_id) {
      return { success: true, message: 'User bukan referred user.', referralProcessed: false };
    }

    // ===================================================================
    // MODIFIKASI: Validasi pembelian pertama/status 'completed' dihilangkan untuk testing.
    // Kode di bawah ini akan selalu berjalan untuk setiap pembelian oleh referred user.
    /*
    const referralsSheet = getSheetData(SHEETS.REFERRALS);
    const existingReferral = referralsSheet.find(r => 
        normalizePhone(r.referred_phone) === normalizePhone(customerPhone) && 
        r.referrer_code === buyer.referrer_id
    );

    if (existingReferral && existingReferral.status === 'completed') {
        Logger.log('ℹ️ Validasi pembelian pertama di-skip untuk testing.');
        // return { success: true, message: 'Reward referral sudah pernah diberikan.', referralProcessed: false };
    }
    */
    // ===================================================================

    const referrer = findUserByReferralCode(buyer.referrer_id);
    if (!referrer) {
      return { success: false, message: 'Referrer tidak ditemukan.', referralProcessed: false };
    }

    // Proses pemberian reward
    const currentPoints = parseInt(referrer.total_points) || 0;
    const newTotalPoints = currentPoints + REFERRAL_CONFIG.REFERRER_REWARD;
    const referrerRowIndex = getSheetData(SHEETS.USERS).findIndex(u => u.referral_code === referrer.referral_code) + 2;
    updateCell(SHEETS.USERS, referrerRowIndex, 'total_points', newTotalPoints);

    // Catat di points_history
    addRowToSheet(SHEETS.POINTS_HISTORY, {
      id: 'PH-' + Date.now(),
      user_phone: referrer.whatsapp,
      referral_code: referrer.referral_code,
      transaction_date: getNowTimestamp(),
      type: 'credit',
      amount: REFERRAL_CONFIG.REFERRER_REWARD,
      balance_before: currentPoints,
      balance_after: newTotalPoints,
      description: '[TEST] Bonus referral dari ' + customerName,
      source_id: orderId,
      created_at: getNowTimestamp()
    });

    Logger.log('✅ [TESTING MODE] Referral processed successfully!');
    return {
      success: true,
      message: 'Referral berhasil diproses (Mode Testing).',
      referralProcessed: true,
      referrer_name: referrer.nama,
      referrer_reward: REFERRAL_CONFIG.REFERRER_REWARD,
    };

  } catch (error) {
    Logger.log('❌ processReferral Error: ' + error.toString());
    return { success: false, message: 'Gagal memproses referral: ' + error.toString(), referralProcessed: false };
  }
}


// ============================================================================
// ENDPOINT STATISTIK & RIWAYAT (Sama seperti sebelumnya)
// ============================================================================
function getReferralStats(referralCode) {
  try {
    const referrals = getSheetData(SHEETS.REFERRALS);
    const userReferrals = referrals.filter(r => r.referrer_code === referralCode);
    const totalReferred = userReferrals.length;
    const totalCompleted = userReferrals.filter(r => r.status === 'completed').length;
    const pointsHistory = getSheetData(SHEETS.POINTS_HISTORY);
    const userPoints = pointsHistory.filter(p => p.referral_code === referralCode && p.type === 'credit');
    const totalPoints = userPoints.reduce((sum, p) => sum + (parseInt(p.amount) || 0), 0);
    return {
      success: true,
      stats: {
        total_referred: totalReferred,
        total_completed: totalCompleted,
        total_points: totalPoints
      }
    };
  } catch (error) {
    Logger.log('❌ getReferralStats Error: ' + error.toString());
    return { success: false, message: 'Gagal mengambil statistik: ' + error.toString() };
  }
}

function getUserPointsHistory(referralCode) {
  try {
    const pointsHistory = getSheetData(SHEETS.POINTS_HISTORY);
    const userHistory = pointsHistory
      .filter(p => p.referral_code === referralCode)
      .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
    return {
      success: true,
      history: userHistory
    };
  } catch (error) {
    Logger.log('❌ getUserPointsHistory Error: ' + error.toString());
    return { success: false, message: 'Gagal mengambil riwayat poin: ' + error.toString() };
  }
}

// ============================================================================
// UTILITY FUNCTIONS (Placeholder - gunakan implementasi asli dari file Anda)
// ============================================================================
function getSheet(sheetName) { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName); }
function getSheetData(sheetName) { const sheet = getSheet(sheetName); if (!sheet) return []; const data = sheet.getDataRange().getValues(); const headers = data.shift(); return data.map(row => headers.reduce((obj, header, i) => (obj[header] = row[i], obj), {})); }
function findUserByWhatsapp(whatsapp) { return getSheetData(SHEETS.USERS).find(u => normalizePhone(u.whatsapp) === normalizePhone(whatsapp)); }
function findUserByReferralCode(code) { return getSheetData(SHEETS.USERS).find(u => u.referral_code === code); }
function normalizePhone(phone) { let cleaned = String(phone).replace(/[^0-9]/g, ''); if (cleaned.startsWith('62')) { cleaned = '0' + cleaned.substring(2); } if (cleaned.startsWith('8') && !cleaned.startsWith('08')) { cleaned = '0' + cleaned; } return cleaned; }
function addRowToSheet(sheetName, rowData) { const sheet = getSheet(sheetName); if (!sheet) return; const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]; const row = headers.map(header => rowData[header] || ''); sheet.appendRow(row); }
function updateCell(sheetName, rowIndex, columnName, value) { const sheet = getSheet(sheetName); if (!sheet) return; const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]; const colIndex = headers.indexOf(columnName); if (colIndex !== -1) { sheet.getRange(rowIndex, colIndex + 1).setValue(value); } }
function getNowTimestamp() { return new Date().toISOString(); }
function generateVoucherCode() { return 'VOUCHER-' + Math.random().toString(36).substr(2, 9).toUpperCase(); }
