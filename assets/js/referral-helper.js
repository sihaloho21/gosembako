/**
 * REFERRAL HELPER UTILITIES
 * Fungsi-fungsi helper untuk program referral
 * 
 * Includes:
 * - Generate referral code
 * - Get referral link
 * - Track referral from URL
 * - Get referrer info
 * - Integration dengan Google Apps Script backend
 */

// ============================================================================
// GOOGLE APPS SCRIPT INTEGRATION
// ============================================================================

/**
 * Call Google Apps Script backend untuk process referral
 * @param {string} action - Action name (processReferral, getReferralStats, etc)
 * @param {object} data - Data untuk dikirim ke GAS
 * @param {number} timeout - Request timeout in milliseconds (default: 30000)
 * @returns {Promise<object>} Response dari GAS
 */
async function callGASAPI(action, data, timeout = 30000) {
    try {
        const gasUrl = CONFIG.getGASUrl();
        
        if (!gasUrl) {
            console.error('❌ GAS URL tidak dikonfigurasi di CONFIG');
            console.log('   Silakan atur GAS URL melalui CONFIG.setGASUrl()');
            return {
                success: false,
                message: 'GAS URL not configured',
                action: action,
                error: 'CONFIG_ERROR'
            };
        }
        
        console.log(`📤 [${new Date().toLocaleTimeString()}] Calling GAS API: ${action}`);
        console.log(`   URL: ${gasUrl.substring(0, 50)}...`);
        console.log(`   Data:`, data);
        
        const payload = JSON.stringify({
            action: action,
            ...data
        });
        
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        console.log(`   ⏱️ Timeout set: ${timeout}ms`);
        
        const response = await fetch(gasUrl, {
            method: 'POST',
            body: payload,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        clearTimeout(timeoutId);
        
        console.log(`   📨 HTTP Response: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ GAS HTTP Error: ${response.status}`);
            console.error(`   Error body:`, errorText.substring(0, 200));
            return {
                success: false,
                message: `HTTP ${response.status}: ${response.statusText}`,
                action: action,
                error: 'HTTP_ERROR',
                status: response.status
            };
        }
        
        let result;
        try {
            result = await response.json();
        } catch (parseError) {
            console.error(`❌ Failed to parse GAS response as JSON`);
            console.error(`   Response text:`, await response.text());
            return {
                success: false,
                message: 'Invalid JSON response from GAS',
                action: action,
                error: 'JSON_PARSE_ERROR'
            };
        }
        
        console.log(`✅ [${new Date().toLocaleTimeString()}] GAS Response (${action}):`, result);
        
        return result;
        
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error(`❌ GAS API Timeout (${action}): Request took longer than expected`);
            return {
                success: false,
                message: 'Request timeout - API response too slow',
                action: action,
                error: 'TIMEOUT_ERROR'
            };
        }
        
        console.error(`❌ GAS API Error (${action}):`, error.message);
        console.error(`   Error type:`, error.name);
        console.error(`   Full error:`, error);
        return {
            success: false,
            message: error.message || 'Unknown error',
            action: action,
            error: 'NETWORK_ERROR'
        };
    }
}

/**
 * Process order referral di backend GAS
 * Dipanggil setelah order berhasil dibuat
 */
async function processOrderReferralViaGAS(orderId, phone, name) {
    console.log(`🔗 Processing referral via GAS for order: ${orderId}`);
    
    // Get referral code from localStorage (saved from URL parameter)
    const referralCode = getReferralCode();
    
    const result = await callGASAPI('processReferral', {
        orderId: orderId,
        phone: phone,
        name: name,
        referralCode: referralCode  // Send referral code for auto-register
    });
    
    if (result.success && result.referralProcessed) {
        console.log('✅ Referral berhasil di-process!');
        console.log(`   • Referrer: ${result.referrer_name}`);
        console.log(`   • Reward: ${result.referrer_reward} poin`);
        console.log(`   • Voucher: ${result.voucher_code}`);
        
        // Show notification
        showToastNotification(
            `🎉 Referral processed! ${result.referrer_name} dapat ${result.referrer_reward} poin`,
            4000
        );
    } else if (result.success && !result.referralProcessed) {
        console.log('ℹ️ ' + result.message);
    } else {
        console.log('❌ Referral processing failed: ' + result.message);
    }
    
    return result;
}

/**
 * Get referral stats dari GAS
 * @param {string} referralCode - Referral code pengguna
 * @returns {Promise<object>} Stats object dengan struktur: {success, total_referred, total_completed, total_pending, total_points, referrals}
 */
async function getReferralStatsFromGAS(referralCode) {
    console.log(`📊 Getting referral stats from GAS: ${referralCode}`);
    
    if (!referralCode) {
        console.error('❌ Referral code tidak valid:', referralCode);
        return {
            success: false,
            message: 'Referral code is required',
            total_referred: 0,
            total_completed: 0,
            total_pending: 0,
            total_points: 0,
            referrals: []
        };
    }
    
    const result = await callGASAPI('getReferralStats', {
        referralCode: referralCode
    });
    
    // Validate dan normalize response
    if (result.success) {
        return {
            success: true,
            total_referred: result.total_referred || 0,
            total_completed: result.total_completed || 0,
            total_pending: result.total_pending || 0,
            total_points: parseInt(result.total_points) || 0,
            referrals: Array.isArray(result.referrals) ? result.referrals : []
        };
    }
    
    console.warn('⚠️ getReferralStats failed:', result.message);
    return {
        success: false,
        message: result.message || 'Failed to get stats',
        total_referred: 0,
        total_completed: 0,
        total_pending: 0,
        total_points: 0,
        referrals: []
    };
}

/**
 * Get points history dari GAS
 * @param {string} referralCode - Referral code pengguna
 * @returns {Promise<object>} History object dengan struktur: {success, history}
 */
async function getPointsHistoryFromGAS(referralCode) {
    console.log(`📝 Getting points history from GAS: ${referralCode}`);
    
    if (!referralCode) {
        console.error('❌ Referral code tidak valid:', referralCode);
        return {
            success: false,
            message: 'Referral code is required',
            history: []
        };
    }
    
    const result = await callGASAPI('getUserPointsHistory', {
        referralCode: referralCode
    });
    
    // Validate dan normalize response
    if (result.success) {
        return {
            success: true,
            history: Array.isArray(result.history) ? result.history : []
        };
    }
    
    console.warn('⚠️ getPointsHistoryFromGAS failed:', result.message);
    return {
        success: false,
        message: result.message || 'Failed to get history',
        history: []
    };
}

// ============================================================================
// REFERRAL CODE & LINK MANAGEMENT
// ============================================================================

/**
 * Generate referral code dari nama user
 * Format: 4 huruf pertama nama (uppercase) + 4 digit random
 * Contoh: "Budi Santoso" -> "BUDI1234"
 */
function generateReferralCode(name) {
    const nameForCode = name
        .replace(/\s/g, '') // Hapus space
        .substring(0, 4)    // Ambil 4 karakter pertama
        .toUpperCase();
    
    const randomDigits = Math.floor(Math.random() * 9000) + 1000;
    return nameForCode + randomDigits;
}

/**
 * Get current user's referral link
 * Contoh: https://paketsembako.com/?ref=BUDI1234
 */
function getReferralLink(referralCode) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/?ref=${referralCode}`;
}

/**
 * Save referral code to session/localStorage dari URL ?ref=XXX
 * Called saat user pertama kali landing di website dengan ref link
 */
function trackReferralFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode) {
        // Save ke session storage (untuk proses registrasi)
        sessionStorage.setItem('referral_code', refCode);
        sessionStorage.setItem('referral_timestamp', new Date().toISOString());
        
        // Save ke localStorage untuk persistensi lebih lama
        localStorage.setItem('referral_code', refCode);
        
        console.log('✅ Referral code tracked:', refCode);
        return refCode;
    }
    
    return null;
}

/**
 * Get referral code dari session (untuk registrasi)
 */
function getReferralCodeFromSession() {
    return sessionStorage.getItem('referral_code') || '';
}

/**
 * Get referral code dari localStorage atau sessionStorage
 * Cek localStorage dulu (lebih persisten), fallback ke sessionStorage
 */
function getReferralCode() {
    return localStorage.getItem('referral_code') || sessionStorage.getItem('referral_code') || null;
}

/**
 * Clear referral data setelah user berhasil daftar
 */
function clearReferralSession() {
    sessionStorage.removeItem('referral_code');
    sessionStorage.removeItem('referral_timestamp');
}

/**
 * Get user's referral stats dari API
 * Returns: { total_clicks, total_registered, total_completed, total_points }
 */
async function getReferralStats(referralCode) {
    try {
        const apiUrl = CONFIG.getMainApiUrl();
        
        // Query referrals sheet untuk user ini
        const response = await fetch(
            `${apiUrl}?sheet=referrals&referrer_id=${referralCode}`
        );
        
        if (!response.ok) return null;
        
        const referrals = await response.json();
        if (!referrals || referrals.length === 0) {
            return {
                total_referred: 0,
                total_completed: 0,
                total_points: 0
            };
        }
        
        const completed = referrals.filter(r => r.status === 'completed').length;
        const totalPoints = referrals.reduce((sum, r) => {
            return sum + (parseInt(r.reward_points) || 0);
        }, 0);
        
        return {
            total_referred: referrals.length,
            total_completed: completed,
            total_points: totalPoints
        };
    } catch (error) {
        console.error('Error getting referral stats:', error);
        return null;
    }
}

/**
 * Share referral link ke WhatsApp
 */
function shareReferralViaWhatsApp(referralCode) {
    const link = getReferralLink(referralCode);
    const message = encodeURIComponent(
        `Halo! Aku sudah menggunakan GoSembako untuk belanja paket sembako. ` +
        `Kualitas terbaik dengan harga super hemat! 🛒\n\n` +
        `Yuk, daftar juga dan dapatkan diskon 10% untuk pembelian pertamamu:\n\n` +
        `${link}\n\n` +
        `Dengan link ini, kamu dapat diskon dan aku dapat poin reward! 💰`
    );
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
}

/**
 * Share referral link ke Facebook
 */
function shareReferralViaFacebook(referralCode) {
    const link = getReferralLink(referralCode);
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
    window.open(facebookShareUrl, '_blank', 'width=600,height=400');
}

/**
 * Share referral link ke Twitter
 */
function shareReferralViaTwitter(referralCode) {
    const link = getReferralLink(referralCode);
    const text = encodeURIComponent(
        'Belanja paket sembako berkualitas di GoSembako! Hemat dan aman. ' +
        'Dapatkan diskon 10% untuk pengguna baru 👉 ' + link
    );
    
    window.open(
        `https://twitter.com/intent/tweet?text=${text}`,
        '_blank',
        'width=600,height=400'
    );
}

/**
 * Copy referral link ke clipboard
 */
function copyReferralLinkToClipboard(referralCode) {
    const link = getReferralLink(referralCode);
    
    navigator.clipboard.writeText(link).then(() => {
        console.log('✅ Referral link copied to clipboard:', link);
        // Show toast notification
        showToastNotification('Link referral berhasil disalin! 📋');
    }).catch(err => {
        console.error('Failed to copy:', err);
        // Fallback: select text
        const textarea = document.createElement('textarea');
        textarea.value = link;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToastNotification('Link referral berhasil disalin! 📋');
    });
}

/**
 * Show simple toast notification
 */
function showToastNotification(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg text-sm z-50';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, duration);
}

/**
 * Initialize referral tracking on page load
 * Call this dalam document.ready atau di awal script utama
 */
function initializeReferralTracking() {
    // Track referral dari URL jika ada
    trackReferralFromUrl();
    
    // Show welcome banner jika ada referral code
    const refCode = sessionStorage.getItem('referral_code');
    if (refCode) {
        showReferralWelcomeBanner(refCode);
    }
}

/**
 * Show welcome banner untuk referred user
 */
function showReferralWelcomeBanner(referralCode) {
    // Cek apakah banner sudah pernah ditampilkan
    if (localStorage.getItem('referral_banner_shown_' + referralCode)) {
        return;
    }
    
    const banner = document.createElement('div');
    banner.className = 'bg-gradient-to-r from-green-400 to-blue-500 text-white p-4 rounded-lg shadow-lg mb-4 mx-4 mt-4';
    banner.innerHTML = `
        <div class="flex items-start justify-between">
            <div class="flex-1">
                <h3 class="font-bold text-lg mb-1">🎉 Selamat Datang!</h3>
                <p class="text-sm">Dapatkan <strong>DISKON 10%</strong> (maks Rp 25.000) untuk pembelian pertama dengan mendaftar sekarang!</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200 text-2xl">&times;</button>
        </div>
    `;
    
    // Insert setelah header atau di paling atas
    const mainContainer = document.querySelector('main') || document.querySelector('.container');
    if (mainContainer) {
        mainContainer.insertBefore(banner, mainContainer.firstChild);
    }
    
    // Mark banner as shown
    localStorage.setItem('referral_banner_shown_' + referralCode, 'true');
}

// Initialize referral tracking saat page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeReferralTracking);
} else {
    initializeReferralTracking();
}
