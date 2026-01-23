/**
 * GOOGLE APPS SCRIPT: Referral System Backend (v2 - Diperbaiki)
 * 
 * Changelog:
 * - Router di doPost untuk handle multiple actions.
 * - Endpoint BARU: getReferralStats, getUserPointsHistory.
 * - Logika anti-fraud yang lebih solid di processReferral.
 * - Konsistensi nama parameter dengan frontend.
 * - Standarisasi format response JSON.
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
// UTILITY FUNCTIONS (Asumsikan fungsi-fungsi ini sudah ada dan benar)
// getSheet, getSheetData, findUserByWhatsapp, findUserByReferralCode, 
// normalizePhone, addRowToSheet, updateCell, getNowTimestamp, generateVoucherCode
// ============================================================================

// ============================================================================
// MAIN ROUTER (doPost)
// ============================================================================

/**
 * Main entry point untuk POST requests dari frontend.
 * Berfungsi sebagai router untuk berbagai action.
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    let result;

    // PERBAIKAN: Router untuk menangani berbagai action
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
// REFERRAL PROCESSING LOGIC (Diperbaiki)
// ============================================================================

function processReferral(orderId, customerPhone, customerName, referralCode) {
  try {
    Logger.log('🔄 Processing referral for order: ' + orderId);
    
    const buyer = findUserByWhatsapp(customerPhone);
    if (!buyer) {
      // Logika auto-register bisa ditambahkan di sini jika diperlukan, 
      // namun untuk saat ini kita asumsikan user sudah ada.
      return { success: false, message: 'User tidak ditemukan.', referralProcessed: false };
    }

    if (!buyer.referrer_id) {
      return { success: true, message: 'User bukan referred user.', referralProcessed: false };
    }

    // PERBAIKAN: Cek apakah referral ini sudah pernah diproses sebelumnya
    const referralsSheet = getSheetData(SHEETS.REFERRALS);
    const existingReferral = referralsSheet.find(r => 
        normalizePhone(r.referred_phone) === normalizePhone(customerPhone) && 
        r.referrer_code === buyer.referrer_id
    );

    if (existingReferral && existingReferral.status === 'completed') {
        Logger.log('ℹ️ Referral untuk user ini sudah pernah diproses (completed).');
        return { success: true, message: 'Reward referral sudah pernah diberikan.', referralProcessed: false };
    }

    const referrer = findUserByReferralCode(buyer.referrer_id);
    if (!referrer) {
      return { success: false, message: 'Referrer tidak ditemukan.', referralProcessed: false };
    }

    // PERBAIKAN: Logika pemberian reward disederhanakan
    // 1. Update status di sheet 'referrals'
    // (Asumsikan baris referral sudah dibuat saat user mendaftar)
    // Jika belum, kita perlu menambahkannya di sini.
    let referralRowIndex = -1;
    if(existingReferral) {
        referralRowIndex = referralsSheet.indexOf(existingReferral) + 2; // +2 karena header dan 0-based index
        updateCell(SHEETS.REFERRALS, referralRowIndex, 'status', 'completed');
        updateCell(SHEETS.REFERRALS, referralRowIndex, 'completed_at', getNowTimestamp());
        updateCell(SHEETS.REFERRALS, referralRowIndex, 'first_order_id', orderId);
    } else {
        // Jika belum ada, buat baris referral baru
        addRowToSheet(SHEETS.REFERRALS, {
            id: 'REF-' + Date.now(),
            referrer_phone: referrer.whatsapp,
            referrer_code: referrer.referral_code,
            referred_phone: normalizePhone(customerPhone),
            referred_name: customerName,
            status: 'completed',
            first_order_id: orderId,
            created_at: getNowTimestamp(),
            completed_at: getNowTimestamp()
        });
    }

    // 2. Tambah poin ke referrer
    const currentPoints = parseInt(referrer.total_points) || 0;
    const newTotalPoints = currentPoints + REFERRAL_CONFIG.REFERRER_REWARD;
    const referrerRowIndex = getSheetData(SHEETS.USERS).findIndex(u => u.referral_code === referrer.referral_code) + 2;
    updateCell(SHEETS.USERS, referrerRowIndex, 'total_points', newTotalPoints);

    // 3. Catat di points_history
    addRowToSheet(SHEETS.POINTS_HISTORY, {
      id: 'PH-' + Date.now(),
      user_phone: referrer.whatsapp,
      referral_code: referrer.referral_code,
      transaction_date: getNowTimestamp(),
      type: 'credit',
      amount: REFERRAL_CONFIG.REFERRER_REWARD,
      balance_before: currentPoints,
      balance_after: newTotalPoints,
      description: 'Bonus referral dari ' + customerName,
      source_id: orderId,
      created_at: getNowTimestamp()
    });

    // 4. Buat voucher untuk buyer (opsional)
    const voucherCode = generateVoucherCode();
    addRowToSheet(SHEETS.VOUCHERS, {
        voucher_code: voucherCode,
        type: 'DISCOUNT_FIRST_PURCHASE',
        discount_amount: REFERRAL_CONFIG.REFERRED_DISCOUNT,
        referred_phone: normalizePhone(customerPhone),
        status: 'available',
        created_at: getNowTimestamp(),
        expiry_date: new Date(Date.now() + REFERRAL_CONFIG.VOUCHER_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
        generated_by: 'SYSTEM_REFERRAL'
    });

    Logger.log('✅ Referral processed successfully!');
    return {
      success: true,
      message: 'Referral berhasil diproses.',
      referralProcessed: true,
      referrer_name: referrer.nama,
      referrer_reward: REFERRAL_CONFIG.REFERRER_REWARD,
      voucher_code: voucherCode
    };

  } catch (error) {
    Logger.log('❌ processReferral Error: ' + error.toString());
    return { success: false, message: 'Gagal memproses referral: ' + error.toString(), referralProcessed: false };
  }
}


// ============================================================================
// BARU: ENDPOINT UNTUK STATISTIK & RIWAYAT
// ============================================================================

/**
 * BARU: Get referral stats untuk dashboard.
 */
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

/**
 * BARU: Get user points history untuk dashboard.
 */
function getUserPointsHistory(referralCode) {
  try {
    const pointsHistory = getSheetData(SHEETS.POINTS_HISTORY);
    const userHistory = pointsHistory
      .filter(p => p.referral_code === referralCode)
      .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)); // Urutkan terbaru dulu

    return {
      success: true,
      history: userHistory
    };
  } catch (error) {
    Logger.log('❌ getUserPointsHistory Error: ' + error.toString());
    return { success: false, message: 'Gagal mengambil riwayat poin: ' + error.toString() };
  }
}

// Dummy functions for completeness, replace with actual implementation from user's file
function getSheet(sheetName) { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName); }
function getSheetData(sheetName) { const sheet = getSheet(sheetName); if (!sheet) return []; const data = sheet.getDataRange().getValues(); const headers = data.shift(); return data.map(row => headers.reduce((obj, header, i) => (obj[header] = row[i], obj), {})); }
function findUserByWhatsapp(whatsapp) { return getSheetData(SHEETS.USERS).find(u => normalizePhone(u.whatsapp) === normalizePhone(whatsapp)); }
function findUserByReferralCode(code) { return getSheetData(SHEETS.USERS).find(u => u.referral_code === code); }
function normalizePhone(phone) { let cleaned = String(phone).replace(/[^0-9]/g, ''); if (cleaned.startsWith('62')) { cleaned = '0' + cleaned.substring(2); } if (cleaned.startsWith('8') && !cleaned.startsWith('08')) { cleaned = '0' + cleaned; } return cleaned; }
function addRowToSheet(sheetName, rowData) { const sheet = getSheet(sheetName); if (!sheet) return; const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]; const row = headers.map(header => rowData[header] || ''); sheet.appendRow(row); }
function updateCell(sheetName, rowIndex, columnName, value) { const sheet = getSheet(sheetName); if (!sheet) return; const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]; const colIndex = headers.indexOf(columnName); if (colIndex !== -1) { sheet.getRange(rowIndex, colIndex + 1).setValue(value); } }
function getNowTimestamp() { return new Date().toISOString(); }
function generateVoucherCode() { return 'VOUCHER-' + Math.random().toString(36).substr(2, 9).toUpperCase(); }
