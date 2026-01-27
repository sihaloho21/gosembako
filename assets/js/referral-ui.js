/**
 * Referral UI Module - GoSembako
 * Handles referral code generation, tracking, and UI rendering
 */

// Phone utilities
const normalizePhoneTo08 = (phone) => {
    const digits = (phone || '').toString().replace(/[^0-9]/g, '');
    if (!digits) return '';
    let core = digits;
    if (core.startsWith('62')) core = core.slice(2);
    if (core.startsWith('0')) core = core.slice(1);
    if (!core.startsWith('8')) return '';
    return '0' + core;
};

// Constants
const DEFAULT_REFERRAL_REWARD_POINTS = 50;

/**
 * Fetch all referrals from the API
 * @returns {Promise<Array>} Array of referral records
 */
async function fetchAllReferrals() {
    try {
        const apiUrl = CONFIG.getMainApiUrl();
        const cacheBuster = '&_t=' + Date.now();
        const response = await fetch(`${apiUrl}?sheet=referral_history${cacheBuster}`);
        
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
function generateReferralCode(name) {
    // Extract first 4 letters from name (uppercase)
    const namePrefix = (name || 'USR').replace(/\s/g, '').substring(0, 4).toUpperCase();
    
    // Combine with random 4-digit number
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    
    return `REF-${namePrefix}${randomNum}`;
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
    if (!referrerCode || !referredName) {
        return false;
    }
    
    try {
        const apiUrl = CONFIG.getMainApiUrl();
        const timestamp = new Date().toLocaleString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        const recordId = `ref_${Date.now()}`;
        const createResult = await apiPost(apiUrl, {
            action: 'create',
            sheet: 'referral_history',
            data: {
                id: recordId,
                referrer_code: referrerCode,
                referee_name: referredName,
                referee_whatsapp: normalizePhoneTo08(referredPhone),
                event_type: 'registration',
                referrer_reward: DEFAULT_REFERRAL_REWARD_POINTS,
                referee_reward: 0,
                status: 'completed',
                created_at: timestamp
            }
        });
        return !!(createResult && (createResult.created || createResult.updated || createResult.success));
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
    const normalizedCode = (userCode || '').toString().toUpperCase();
    const userReferrals = referrals.filter(ref =>
        (ref.referrer_code || '').toString().toUpperCase() === normalizedCode
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
            const dateA = new Date(a.created_at || a.timestamp || a.date || 0);
            const dateB = new Date(b.created_at || b.timestamp || b.date || 0);
            return dateB - dateA;
        });
    
    // Render referral list
    let html = '<div class="space-y-2">';
    
    userReferrals.forEach(ref => {
        const date = new Date(ref.created_at || ref.date || ref.timestamp);
        const dateStr = date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });

        const eventLabel = {
            registration: '📝 Registrasi',
            first_order: '🛒 Order Pertama',
            fifth_order: '🎉 Order ke-5',
            milestone_10: '🏆 Milestone 10',
            milestone_20: '🏆 Milestone 20',
            milestone_50: '🏆 Milestone 50'
        };
        const eventText = eventLabel[ref.event_type] || ref.event_type || 'Referral';
        const rewardPoints = parseInt(ref.referrer_reward || ref.reward_points || DEFAULT_REFERRAL_REWARD_POINTS) || DEFAULT_REFERRAL_REWARD_POINTS;
        
        html += `
            <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div class="flex-1">
                    <p class="font-semibold text-gray-800 text-sm">${ref.referee_name || ref.referred_name || 'Pengguna Baru'}</p>
                    <p class="text-xs text-gray-500">${eventText} • ${dateStr}</p>
                </div>
                <div class="text-right">
                    <span class="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                        +${rewardPoints} poin
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
                const referralLink = `${window.location.origin}/akun.html?ref=${encodeURIComponent(referralCode)}`;
                const message = `Yuk gabung di GoSembako! Gunakan kode referral saya: ${referralCode} saat daftar dan dapatkan bonus poin! 🎁\n${referralLink}`;
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
        
        // Update referral count and points from stats API
        const userId = user.id || user.user_id;
        if (userId) {
            try {
                const apiUrl = CONFIG.getMainApiUrl();
                const statsResponse = await fetch(`${apiUrl}?action=get_referral_stats&user_id=${encodeURIComponent(userId)}`);
                const statsData = await statsResponse.json();
                if (!statsData.error) {
                    const countDisplay = document.getElementById('referral-count');
                    if (countDisplay) {
                        countDisplay.textContent = statsData.referral_count || 0;
                    }
                    const pointsDisplay = document.getElementById('referral-points-earned');
                    if (pointsDisplay) {
                        pointsDisplay.textContent = statsData.referral_points_earned || 0;
                    }
                }
            } catch (error) {
                console.error('Error loading referral stats:', error);
            }
        }
        
    } catch (error) {
        console.error('Error initializing referral widget:', error);
    }
}

// Export to window for global access
window.ReferralUI = {
    DEFAULT_REFERRAL_REWARD_POINTS,
    fetchAllReferrals,
    ensureReferralCode,
    createReferralRecord,
    renderReferralList,
    initReferralWidget
};
