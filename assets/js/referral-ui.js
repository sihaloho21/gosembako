/**
 * Referral UI Module - GoSembako
 * Handles referral code generation, tracking, and UI rendering
 */

// Constants
const REFERRAL_REWARD_POINTS = 50;

/**
 * Normalize phone number to 08xxxxxxxxxx format
 * @param {string} phone - Phone number in any format
 * @returns {string} Normalized phone number or empty string
 */
const normalizePhoneTo08 = (phone) => {
    const digits = (phone || '').toString().replace(/[^0-9]/g, '');
    if (!digits) return '';
    let core = digits;
    if (core.startsWith('62')) core = core.slice(2);
    if (core.startsWith('0')) core = core.slice(1);
    if (!core.startsWith('8')) return '';
    return '0' + core;
};

/**
 * Generate phone number lookup variants
 * @param {string} phone - Phone number
 * @returns {Array<string>} Array of phone variants
 */
const phoneLookupVariants = (phone) => {
    const base = normalizePhoneTo08(phone);
    if (!base) return [];
    const core = base.slice(1);
    return [base, `+62${core}`, `62${core}`, core];
};

/**
 * Fetch all referrals from the API
 * @returns {Promise<Array>} Array of referral records
 */
async function fetchAllReferrals() {
    try {
        const apiUrl = CONFIG.getMainApiUrl();
        const cacheBuster = '&_t=' + Date.now();
        const response = await fetch(`${apiUrl}?sheet=referrals${cacheBuster}`);
        
        if (!response.ok) {
            console.error('Failed to fetch referrals:', response.status);
            return [];
        }
        
        const data = await response.json();
        
        // Parse response (handle both array and object with result property)
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.result)) return data.result;
        if (data && data.result) return Array.isArray(data.result) ? data.result : [data.result];
        return [];
    } catch (error) {
        console.error('Error fetching referrals:', error);
        return [];
    }
}

/**
 * Generate a unique referral code for a user
 * @param {string} name - User's name
 * @param {string} phone - User's phone number
 * @returns {string} Generated referral code
 */
function generateReferralCode(name, phone) {
    // Extract first 3 letters from name (uppercase)
    const namePrefix = (name || 'USR').replace(/\s/g, '').substring(0, 3).toUpperCase();
    
    // Get last 4 digits of phone
    const phoneDigits = (phone || '').replace(/[^0-9]/g, '');
    const phoneSuffix = phoneDigits.slice(-4);
    
    // Combine with random 2-digit number
    const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    
    return `${namePrefix}${phoneSuffix}${randomNum}`;
}

/**
 * Ensure user has a referral code, generate if missing
 * @param {Object} user - User object
 * @returns {Promise<string>} User's referral code
 */
async function ensureReferralCode(user) {
    try {
        // If user already has referral_code, return it
        if (user.referral_code && user.referral_code.trim()) {
            return user.referral_code.trim();
        }
        
        // Generate new referral code
        const newCode = generateReferralCode(user.nama, user.whatsapp);
        
        // Update user record with new referral code
        const apiUrl = CONFIG.getMainApiUrl();
        const updateResult = await apiPost(apiUrl, {
            action: 'update',
            sheet: 'users',
            id: user.id,
            data: {
                referral_code: newCode
            }
        });
        
        if (updateResult && updateResult.updated) {
            console.log('✅ Referral code generated:', newCode);
            user.referral_code = newCode;
            return newCode;
        } else {
            console.warn('⚠️ Failed to update referral code');
            return newCode; // Return generated code anyway
        }
    } catch (error) {
        console.error('Error ensuring referral code:', error);
        // Generate code anyway for display
        return generateReferralCode(user.nama, user.whatsapp);
    }
}

/**
 * Create a referral record when a new user signs up with a referral code
 * @param {string} referrerCode - Referral code of the referrer
 * @param {string} referredPhone - Phone number of the new user
 * @param {string} referredName - Name of the new user
 * @returns {Promise<boolean>} Success status
 */
async function createReferralRecord(referrerCode, referredPhone, referredName) {
    try {
        const apiUrl = CONFIG.getMainApiUrl();
        const now = new Date().toISOString().split('T')[0];
        const timestamp = new Date().toLocaleString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        const recordId = `REF-${Date.now().toString().slice(-8)}`;
        
        const createResult = await apiPost(apiUrl, {
            action: 'create',
            sheet: 'referrals',
            data: {
                id: recordId,
                referrer_code: referrerCode,
                referred_phone: normalizePhoneTo08(referredPhone),
                referred_name: referredName,
                reward_points: REFERRAL_REWARD_POINTS,
                date: now,
                timestamp: timestamp,
                status: 'completed'
            }
        });
        
        if (createResult && createResult.created) {
            console.log('✅ Referral record created:', recordId);
            return true;
        } else {
            console.warn('⚠️ Failed to create referral record');
            return false;
        }
    } catch (error) {
        console.error('Error creating referral record:', error);
        return false;
    }
}

/**
 * Render referral list in the UI
 * @param {Array} referrals - Array of referral records
 * @param {string} userCode - Current user's referral code
 * @param {HTMLElement} container - Container element to render into
 */
function renderReferralList(referrals, userCode, container) {
    if (!container) return;
    
    // Filter referrals for this user
    const userReferrals = referrals.filter(ref => 
        ref.referrer_code === userCode
    );
    
    if (userReferrals.length === 0) {
        container.innerHTML = `
            <div class="text-center py-6 text-gray-500">
                <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <p class="text-sm">Belum ada teman yang mendaftar</p>
                <p class="text-xs mt-1">Bagikan kode referral Anda!</p>
            </div>
        `;
        return;
    }
    
    // Sort by date (newest first)
    userReferrals.sort((a, b) => {
        const dateA = new Date(a.timestamp || a.date || 0);
        const dateB = new Date(b.timestamp || b.date || 0);
        return dateB - dateA;
    });
    
    // Render referral list
    let html = '<div class="space-y-2">';
    
    userReferrals.forEach(ref => {
        const date = new Date(ref.date || ref.timestamp);
        const dateStr = date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        
        html += `
            <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div class="flex-1">
                    <p class="font-semibold text-gray-800 text-sm">${ref.referred_name || 'Pengguna Baru'}</p>
                    <p class="text-xs text-gray-500">${dateStr}</p>
                </div>
                <div class="text-right">
                    <span class="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                        +${ref.reward_points || REFERRAL_REWARD_POINTS} poin
                    </span>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * Initialize referral widget for logged-in user
 * @param {Object} user - User object
 */
async function initReferralWidget(user) {
    if (!user) return;
    
    try {
        // Ensure user has referral code
        const referralCode = await ensureReferralCode(user);
        
        // Update UI with referral code
        const codeDisplay = document.getElementById('referral-code-display');
        if (codeDisplay) {
            codeDisplay.textContent = referralCode;
        }
        
        // Setup copy button
        const copyBtn = document.getElementById('copy-referral-code');
        if (copyBtn) {
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(referralCode).then(() => {
                    // Show success feedback
                    const originalText = copyBtn.innerHTML;
                    copyBtn.innerHTML = `
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Tersalin!
                    `;
                    setTimeout(() => {
                        copyBtn.innerHTML = originalText;
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy:', err);
                    alert('Gagal menyalin kode');
                });
            };
        }
        
        // Setup share button
        const shareBtn = document.getElementById('share-referral-code');
        if (shareBtn) {
            shareBtn.onclick = () => {
                const message = `Yuk gabung di GoSembako! Gunakan kode referral saya: ${referralCode} saat daftar dan dapatkan bonus poin! 🎁`;
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
            };
        }
        
        // Fetch and display referrals
        const referrals = await fetchAllReferrals();
        const listContainer = document.getElementById('referral-list');
        if (listContainer) {
            renderReferralList(referrals, referralCode, listContainer);
        }
        
        // Update referral count
        const userReferrals = referrals.filter(ref => ref.referrer_code === referralCode);
        const countDisplay = document.getElementById('referral-count');
        if (countDisplay) {
            countDisplay.textContent = userReferrals.length;
        }
        
        // Calculate total earned points
        const totalPoints = userReferrals.reduce((sum, ref) => 
            sum + (parseInt(ref.reward_points) || REFERRAL_REWARD_POINTS), 0
        );
        const pointsDisplay = document.getElementById('referral-points-earned');
        if (pointsDisplay) {
            pointsDisplay.textContent = totalPoints;
        }
        
    } catch (error) {
        console.error('Error initializing referral widget:', error);
    }
}

// Export to window for global access
window.ReferralUI = {
    REFERRAL_REWARD_POINTS,
    normalizePhoneTo08,
    phoneLookupVariants,
    fetchAllReferrals,
    ensureReferralCode,
    createReferralRecord,
    renderReferralList,
    initReferralWidget
};
