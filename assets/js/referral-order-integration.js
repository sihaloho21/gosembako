/**
 * Referral Order Integration
 * Handles order tracking and automatic reward distribution
 * UPDATED: Uses existing orders sheet structure (phone-based)
 */

class ReferralOrderIntegration {
    constructor() {
        this.apiUrl = null;
    }

    /**
     * Initialize the integration
     */
    async init() {
        this.apiUrl = CONFIG.getMainApiUrl();
    }

    /**
     * Process order and handle referral rewards
     * Call this function after order is logged to existing orders sheet
     * @param {string} phone - Customer phone number (normalized)
     * @param {string} customerName - Customer name
     */
    async processOrder(phone, customerName) {
        try {
            console.log('🔄 Processing referral for phone:', phone);
            
            // 1. Check if user exists, if not create user
            const user = await this.findOrCreateUser(phone, customerName);
            
            if (!user) {
                console.error('Failed to find or create user');
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

            return {
                success: true,
                isFirstOrder: isFirstOrder,
                referralProcessed: false
            };

        } catch (error) {
            console.error('Error processing order:', error);
            return { success: false, message: error.message };
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
            const response = await fetch(`${this.apiUrl}/search?sheet=users&whatsapp_no=${phone}`);
            const users = await response.json();

            if (users && users.length > 0) {
                console.log('✅ Existing user found:', users[0].name);
                return users[0];
            }

            // User not found - check if there's a pending referral code
            const referrerCode = localStorage.getItem('sembako_referral_code') || '';
            
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

            await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sheet: 'users', data: newUser })
            });

            // If user came from referral, create referral record
            if (referrerCode) {
                await this.createReferralRecord(referrerCode, userId, name);
                console.log('✅ Referral record created for code:', referrerCode);
                
                // Clear referral code after use
                localStorage.removeItem('sembako_referral_code');
                localStorage.removeItem('sembako_referrer_name');
            }

            console.log('✅ New user created:', userId);
            return newUser;

        } catch (error) {
            console.error('Error finding/creating user:', error);
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

            await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sheet: 'referrals', data: referralData })
            });

            console.log('✅ Referral record created:', referralId);
        } catch (error) {
            console.error('Error creating referral record:', error);
        }
    }

    /**
     * Check if this is user's first order
     * Uses existing orders sheet with phone column
     * @param {string} phone - Phone number
     * @returns {boolean} True if first order
     */
    async isFirstOrder(phone) {
        try {
            const response = await fetch(`${this.apiUrl}/search?sheet=orders&phone=${phone}`);
            const orders = await response.json();
            
            const orderCount = orders && orders.length > 0 ? orders.length : 0;
            console.log(`📊 Order count for ${phone}: ${orderCount}`);
            
            return orderCount === 1; // True if only 1 order (the one just created)
        } catch (error) {
            console.error('Error checking first order:', error);
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

            // 1. Find the pending referral record
            const refResponse = await fetch(
                `${this.apiUrl}/search?sheet=referrals&referrer_code=${referrerCode}&referred_user_id=${referredUserId}&status=pending`
            );
            const referrals = await refResponse.json();

            if (!referrals || referrals.length === 0) {
                console.log('⚠️ No pending referral found');
                return;
            }

            const referral = referrals[0];
            console.log('✅ Pending referral found:', referral.referral_id);

            // 2. Find referrer user
            const referrerResponse = await fetch(`${this.apiUrl}/search?sheet=users&referral_code=${referrerCode}`);
            const referrers = await referrerResponse.json();

            if (!referrers || referrers.length === 0) {
                console.log('⚠️ Referrer not found');
                return;
            }

            const referrer = referrers[0];
            console.log('✅ Referrer found:', referrer.name);

            // 3. Add points to referrer
            const currentPoints = parseInt(referrer.total_points) || 0;
            const newPoints = currentPoints + 10000;

            // Update referrer points using SheetDB (using id field)
            if (referrer.id) {
                await fetch(`${this.apiUrl}/id/${referrer.id}?sheet=users`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        data: { total_points: newPoints }
                    })
                });
                console.log(`✅ Points updated: ${referrer.name} now has ${newPoints} points`);
            }

            // 4. Update referral status
            if (referral.id) {
                await fetch(`${this.apiUrl}/id/${referral.id}?sheet=referrals`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        data: { 
                            status: 'completed',
                            completed_at: new Date().toISOString()
                        }
                    })
                });
                console.log('✅ Referral status updated to completed');
            }

            // 5. Show notification to user (if they're the referrer and currently on site)
            this.showRewardNotification(referrer.name, referrer.referral_code);

        } catch (error) {
            console.error('Error completing referral:', error);
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
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return (prefix + random).substring(0, 8); // Max 8 characters
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
