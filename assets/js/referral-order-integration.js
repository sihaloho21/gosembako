/**
 * Referral Order Integration V2
 * Handles order tracking and automatic reward distribution
 * IMPROVED: Better error handling, phone normalization, idempotency
 */

class ReferralOrderIntegration {
    constructor() {
        this.apiUrl = null;
        this.processing = false; // Prevent concurrent processing
    }

    /**
     * Initialize the integration
     */
    async init() {
        this.apiUrl = CONFIG.getMainApiUrl();
    }

    /**
     * Normalize phone number to consistent format (628xxx)
     * @param {string} phone - Raw phone number
     * @returns {string} Normalized phone
     */
    normalizePhone(phone) {
        if (!phone) return '';
        
        // Remove all non-digit characters
        let cleaned = phone.toString().replace(/\D/g, '');
        
        // Handle different formats
        if (cleaned.startsWith('0')) {
            cleaned = '62' + cleaned.substring(1);
        } else if (cleaned.startsWith('8')) {
            cleaned = '62' + cleaned;
        } else if (!cleaned.startsWith('62')) {
            cleaned = '62' + cleaned;
        }
        
        return cleaned;
    }

    /**
     * Convert phone to sheet format (8xxx for users/orders, 0xxx for user_points)
     * @param {string} phone - Normalized phone (628xxx)
     * @param {string} sheet - Sheet name ('users', 'orders', or 'user_points')
     * @returns {string} Phone in sheet format
     */
    phoneForSheet(phone, sheet) {
        if (!phone) return '';
        
        // Normalize first
        const normalized = this.normalizePhone(phone);
        
        if (sheet === 'user_points') {
            // user_points uses 0xxx format
            if (normalized.startsWith('62')) {
                return '0' + normalized.substring(2);
            }
            return normalized;
        } else {
            // users & orders use 8xxx format
            if (normalized.startsWith('62')) {
                return normalized.substring(2);
            }
            return normalized;
        }
    }

    /**
     * Fetch with retry logic
     * @param {string} url - API URL
     * @param {object} options - Fetch options
     * @param {number} retries - Max retries
     * @returns {Promise<Response>}
     */
    async fetchWithRetry(url, options = {}, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, options);
                if (response.ok) return response;
                
                // If not ok but not 5xx, don't retry
                if (response.status < 500) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                throw new Error(`HTTP ${response.status}`);
            } catch (error) {
                console.log(`🔄 Attempt ${i + 1}/${retries} failed:`, error.message);
                
                if (i === retries - 1) throw error;
                
                // Exponential backoff: 1s, 2s, 4s
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
            }
        }
    }

    /**
     * Process order and handle referral rewards
     * Call this function after order is logged to existing orders sheet
     * @param {string} phone - Customer phone number
     * @param {string} customerName - Customer name
     */
    async processOrder(phone, customerName) {
        // Prevent concurrent processing
        if (this.processing) {
            console.log('⏳ Already processing, skipping...');
            return { success: false, message: 'Already processing' };
        }

        this.processing = true;

        try {
            // Normalize phone number
            phone = this.normalizePhone(phone);
            console.log('🔄 Processing referral for phone:', phone);
            
            // 1. Check if user exists, if not create user
            const user = await this.findOrCreateUser(phone, customerName);
            
            if (!user) {
                console.error('❌ Failed to find or create user');
                return { success: false, message: 'User creation failed' };
            }

            // 2. Check if this is first order
            const isFirstOrder = await this.isFirstOrder(phone);
            
            if (isFirstOrder && user.referrer_code) {
                console.log('✅ First order detected with referrer:', user.referrer_code);
                await this.completeReferralAndGiveReward(user);
                console.log('✅ Referral reward processed');
                
                return {
                    success: true,
                    isFirstOrder: true,
                    referralProcessed: true
                };
            }

            console.log('✅ Order recorded:', isFirstOrder ? '(First order, no referrer)' : '(Not first order)');

            return {
                success: true,
                isFirstOrder: isFirstOrder,
                referralProcessed: false
            };

        } catch (error) {
            console.error('❌ Error processing order:', error);
            return { success: false, message: error.message };
        } finally {
            this.processing = false;
        }
    }

    /**
     * Find user by phone number or create new user
     * @param {string} phone - Phone number (normalized)
     * @param {string} name - Customer name
     * @returns {Object|null} User object or null
     */
    async findOrCreateUser(phone, name) {
        try {
            // IMPORTANT: Users sheet uses 8xxx format, not 628xxx
            // Convert 628xxx → 8xxx for search
            const searchPhone = phone.startsWith('62') ? phone.substring(2) : phone;
            console.log(`🔍 Searching user with phone: ${searchPhone} (original: ${phone})`);
            
            // Search for existing user by WhatsApp number
            const response = await this.fetchWithRetry(
                `${this.apiUrl}/search?sheet=users&whatsapp_no=${searchPhone}`
            );
            const users = await response.json();

            if (users && users.length > 0) {
                console.log('✅ Existing user found:', users[0].name);
                return users[0];
            }

            // User not found - check if there's a pending referral code
            const referrerCode = localStorage.getItem('sembako_referral_code') || 
                                sessionStorage.getItem('sembako_referral_code') || '';
            
            console.log('📝 Creating new user...');
            
            // Create new user
            const userId = 'USR-' + Date.now();
            const referralCode = this.generateReferralCode(name);

            // Save phone in 8xxx format to match existing data
            const savePhone = phone.startsWith('62') ? phone.substring(2) : phone;
            
            const newUser = {
                user_id: userId,
                name: name,
                whatsapp_no: savePhone,  // Save as 8xxx format
                referral_code: referralCode,
                referrer_code: referrerCode,
                total_points: 0,
                created_at: new Date().toISOString()
            };

            await this.fetchWithRetry(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sheet: 'users', data: [newUser] })
            });

            // If user came from referral, create referral record
            if (referrerCode) {
                await this.createReferralRecord(referrerCode, userId, name);
                console.log('✅ Referral record created for code:', referrerCode);
                
                // Clear referral code after use
                localStorage.removeItem('sembako_referral_code');
                localStorage.removeItem('sembako_referrer_name');
                sessionStorage.removeItem('sembako_referral_code');
                sessionStorage.removeItem('sembako_referrer_name');
            }

            console.log('✅ New user created:', userId);
            return newUser;

        } catch (error) {
            console.error('❌ Error finding/creating user:', error);
            return null;
        }
    }

    /**
     * Create referral record
     * @param {string} referrerCode - Referrer's referral code
     * @param {string} referredUserId - Referred user's ID
     * @param {string} referredName - Referred user's name
     */
    async createReferralRecord(referrerCode, referredUserId, referredName) {
        try {
            const referralId = 'REF-' + Date.now();
            const referralData = {
                referral_id: referralId,
                referrer_code: referrerCode,
                referred_user_id: referredUserId,
                referred_name: referredName,
                status: 'pending',
                reward_points: 10000,
                created_at: new Date().toISOString(),
                completed_at: ''
            };

            await this.fetchWithRetry(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sheet: 'referrals', data: [referralData] })
            });

            console.log('✅ Referral record created:', referralId);
        } catch (error) {
            console.error('❌ Error creating referral record:', error);
        }
    }

    /**
     * Check if this is user's first order
     * Uses existing orders sheet with phone column
     * @param {string} phone - Phone number (normalized)
     * @returns {boolean} True if first order
     */
    async isFirstOrder(phone) {
        try {
            // Retry up to 3 times with 1s delay if order count is 0
            // This handles SheetDB indexing delay
            let orderCount = 0;
            let attempts = 0;
            const maxAttempts = 3;
            
            // IMPORTANT: Orders sheet uses 8xxx format, not 628xxx
            // Convert 628xxx → 8xxx for search
            const searchPhone = phone.startsWith('62') ? phone.substring(2) : phone;
            console.log(`🔍 Searching orders with phone: ${searchPhone} (original: ${phone})`);
            
            while (attempts < maxAttempts) {
                const response = await this.fetchWithRetry(
                    `${this.apiUrl}/search?sheet=orders&phone=${searchPhone}`
                );
                const orders = await response.json();
                
                orderCount = orders && orders.length > 0 ? orders.length : 0;
                console.log(`📊 Order count for ${phone}: ${orderCount} (attempt ${attempts + 1}/${maxAttempts})`);
                
                // If we found orders, break the loop
                if (orderCount > 0) {
                    break;
                }
                
                // If still 0, wait 1s and try again
                attempts++;
                if (attempts < maxAttempts) {
                    console.log(`⏳ Order not found yet, waiting 1s before retry...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            if (orderCount === 0) {
                console.warn('⚠️ Order count still 0 after ${maxAttempts} attempts - SheetDB may be slow');
            }
            
            return orderCount === 1; // True if only 1 order (the one just created)
        } catch (error) {
            console.error('❌ Error checking first order:', error);
            return false;
        }
    }

    /**
     * Complete referral and give reward to referrer
     * @param {Object} referredUser - The user who just made first purchase
     */
    async completeReferralAndGiveReward(referredUser) {
        try {
            const referrerCode = referredUser.referrer_code;
            const referredUserId = referredUser.user_id;

            console.log('🎁 Processing reward for referrer code:', referrerCode);

            // 1. Find the referral record (check if already completed)
            const refResponse = await this.fetchWithRetry(
                `${this.apiUrl}/search?sheet=referrals&referrer_code=${referrerCode}&referred_user_id=${referredUserId}`
            );
            const referrals = await refResponse.json();

            if (!referrals || referrals.length === 0) {
                console.log('⚠️ No referral found');
                return;
            }

            const referral = referrals[0];
            console.log('✅ Referral found:', referral.referral_id, 'Status:', referral.status);

            // IDEMPOTENCY CHECK
            if (referral.status === 'completed') {
                console.log('✅ Reward already given, skipping');
                return;
            }

            // 2. Find referrer user
            const referrerResponse = await this.fetchWithRetry(
                `${this.apiUrl}/search?sheet=users&referral_code=${referrerCode}`
            );
            const referrers = await referrerResponse.json();

            if (!referrers || referrers.length === 0) {
                console.log('⚠️ Referrer not found');
                return;
            }

            const referrer = referrers[0];
            console.log('✅ Referrer found:', referrer.name);

            // 3. Update user_points (single source of truth)
            // user_points structure: phone | points | last_updated
            const referrerPhone8xxx = referrer.whatsapp_no; // 8xxx format from users sheet
            const referrerPhone0xxx = this.phoneForSheet(referrerPhone8xxx, 'user_points'); // Convert to 0xxx for user_points
            
            console.log(`📞 Referrer phone: ${referrerPhone8xxx} (users) → ${referrerPhone0xxx} (user_points)`);
            
            try {
                // Get current points from user_points
                const userPointsResponse = await this.fetchWithRetry(
                    `${this.apiUrl}/search?sheet=user_points&phone=${referrerPhone0xxx}`
                );
                const userPointsData = await userPointsResponse.json();
                
                let currentPoints = 0;
                let updateMethod = 'INSERT'; // Default: create new record
                
                if (userPointsData && userPointsData.length > 0) {
                    // User exists in user_points
                    currentPoints = parseInt(userPointsData[0].points) || 0;
                    updateMethod = 'PATCH';
                }
                
                const newPoints = currentPoints + 10000;
                const timestamp = new Date().toLocaleString('id-ID', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                }).replace(/\//g, '-');
                
                if (updateMethod === 'PATCH') {
                    // Update existing record
                    await this.fetchWithRetry(
                        `${this.apiUrl}/phone/${referrerPhone0xxx}?sheet=user_points`,
                        {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                data: { 
                                    points: newPoints,
                                    last_updated: timestamp
                                }
                            })
                        }
                    );
                    console.log(`✅ Points updated in user_points: ${referrer.name} now has ${newPoints} points`);
                } else {
                    // Create new record
                    await this.fetchWithRetry(this.apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            sheet: 'user_points',
                            data: [{
                                phone: referrerPhone0xxx,
                                points: newPoints,
                                last_updated: timestamp
                            }]
                        })
                    });
                    console.log(`✅ Points created in user_points: ${referrer.name} now has ${newPoints} points`);
                }
            } catch (pointsError) {
                console.error('⚠️ Failed to update user_points:', pointsError.message);
                // Continue anyway - referral status will still be updated
            }

            // 5. Update referral status
            // Use more reliable method: Update all fields via search-based PATCH
            try {
                // Method 1: Try PATCH with multiple search criteria
                const updateUrl = `${this.apiUrl}/referrer_code/${referrerCode}/referred_user_id/${referredUserId}?sheet=referrals`;
                const updateResponse = await this.fetchWithRetry(
                    updateUrl,
                    {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            data: { 
                                status: 'completed',
                                completed_at: new Date().toLocaleString('id-ID', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: false
                                }).replace(',', '')
                            }
                        })
                    }
                );
                
                if (updateResponse.ok) {
                    console.log('✅ Referral status updated to completed');
                } else {
                    throw new Error(`PATCH failed with status ${updateResponse.status}`);
                }
            } catch (patchError) {
                console.error('⚠️ PATCH failed:', patchError.message);
                console.log('🔄 Trying alternative method: DELETE + INSERT');
                
                // Fallback Method 2: Delete old record and insert new one with completed status
                try {
                    // Delete the old pending record
                    await this.fetchWithRetry(
                        `${this.apiUrl}/referral_id/${referral.referral_id}?sheet=referrals`,
                        { method: 'DELETE' }
                    );
                    
                    // Insert new completed record
                    const completedReferral = {
                        ...referral,
                        status: 'completed',
                        completed_at: new Date().toLocaleString('id-ID', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false
                        }).replace(',', '')
                    };
                    
                    await this.fetchWithRetry(this.apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sheet: 'referrals', data: [completedReferral] })
                    });
                    
                    console.log('✅ Referral status updated via DELETE+INSERT');
                } catch (fallbackError) {
                    console.error('❌ Both methods failed:', fallbackError.message);
                }
            }

            // 6. Show notification to user
            this.showRewardNotification(referrer.name, referrer.referral_code);

        } catch (error) {
            console.error('❌ Error completing referral:', error);
        }
    }

    /**
     * Generate referral code from name
     * @param {string} name - User name
     * @returns {string} Referral code
     */
    generateReferralCode(name) {
        // Take first 4 letters of name (or less if name is short)
        const prefix = name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '');
        const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
        const random = Math.random().toString(36).substring(2, 4).toUpperCase();
        return (prefix + timestamp + random).substring(0, 10); // Max 10 characters
    }

    /**
     * Show reward notification
     * @param {string} referrerName - Name of referrer who got reward
     * @param {string} referrerCode - Referral code of referrer
     */
    showRewardNotification(referrerName, referrerCode) {
        // Check if current user is the referrer
        const currentUserData = localStorage.getItem('sembako_user_data');
        if (!currentUserData) return;

        try {
            const currentUser = JSON.parse(currentUserData);
            if (currentUser.referral_code === referrerCode) {
                // Show notification
                this.displayNotification('🎉 Selamat! Anda mendapat 10.000 poin dari referral!');
            }
        } catch (e) {
            console.error('Error showing notification:', e);
        }
    }

    /**
     * Display notification banner
     * @param {string} message - Notification message
     */
    displayNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'referral-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px 30px;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideInRight 0.5s ease-out;
        `;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <span style="font-size: 2rem;">🎉</span>
                <span style="font-size: 1rem; font-weight: 600;">${message}</span>
            </div>
        `;

        // Add animation keyframes
        if (!document.getElementById('referral-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'referral-notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.5s ease-out';
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }
}

// Create global instance
const referralOrderIntegration = new ReferralOrderIntegration();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    referralOrderIntegration.init();
});

// Make it globally accessible
window.ReferralOrderIntegration = ReferralOrderIntegration;
window.referralOrderIntegration = referralOrderIntegration;
