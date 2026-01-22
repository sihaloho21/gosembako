/**
 * REFERRAL HELPER UTILITIES
 * Fungsi-fungsi helper untuk program referral
 * 
 * Includes:
 * - Generate referral code
 * - Get referral link
 * - Track referral from URL
 * - Get referrer info
 */

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
