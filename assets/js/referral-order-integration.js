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
            // Search for existing user by WhatsApp number
            const response = await this.fetchWithRetry(
                `${this.apiUrl}/search?sheet=users&whatsapp_no=${phone}`
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

            const newUser = {
                user_id: userId,
                name: name,
                whatsapp_no: phone,
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
            const response = await this.fetchWithRetry(
                `${this.apiUrl}/search?sheet=orders&phone=${phone}`
            );
            const orders = await response.json();
            
            const orderCount = orders && orders.length > 0 ? orders.length : 0;
            console.log(`📊 Order count for ${phone}: ${orderCount}`);
            
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

            // 3. Calculate new points
            const currentPoints = parseInt(referrer.total_points) || 0;
            const newPoints = currentPoints + 10000;

            // 4. Update referrer points
            // Try PATCH with whatsapp_no (more reliable than id)
            try {
                await this.fetchWithRetry(
                    `${this.apiUrl}/whatsapp_no/${referrer.whatsapp_no}?sheet=users`,
                    {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            data: { total_points: newPoints }
                        })
                    }
                );
                console.log(`✅ Points updated: ${referrer.name} now has ${newPoints} points`);
            } catch (patchError) {
                console.error('⚠️ PATCH failed, trying alternative method:', patchError.message);
                // Fallback: Could implement delete + insert, but skip for now
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
