/**
 * Referral Order Integration
 * Handles order tracking and automatic reward distribution
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
     * Call this function after user confirms order via WhatsApp
     * @param {Object} orderData - Order information
     * @param {string} orderData.whatsappNo - Customer WhatsApp number
     * @param {Array} orderData.items - Cart items
     * @param {number} orderData.totalAmount - Total order amount
     * @param {string} orderData.paymentMethod - Payment method (cash/gajian)
     */
    async processOrder(orderData) {
        try {
            // 1. Check if user exists, if not create user
            const user = await this.findOrCreateUser(orderData.whatsappNo);
            
            if (!user) {
                console.error('Failed to find or create user');
                return { success: false, message: 'User creation failed' };
            }

            // 2. Create order record
            const orderId = 'ORD-' + Date.now();
            const orderDetails = orderData.items.map(item => 
                `${item.nama} x${item.quantity}`
            ).join(', ');

            const orderRecord = {
                order_id: orderId,
                user_id: user.user_id,
                whatsapp_no: orderData.whatsappNo,
                order_details: orderDetails,
                total_amount: orderData.totalAmount,
                payment_method: orderData.paymentMethod,
                created_at: new Date().toISOString()
            };

            await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sheet: 'orders', data: orderRecord })
            });

            console.log('✅ Order recorded:', orderId);

            // 3. Check if this is first order and process referral reward
            const isFirstOrder = await this.isFirstOrder(user.user_id);
            
            if (isFirstOrder && user.referrer_code) {
                await this.completeReferralAndGiveReward(user);
                console.log('✅ Referral reward processed');
            }

            return {
                success: true,
                orderId: orderId,
                isFirstOrder: isFirstOrder,
                referralProcessed: isFirstOrder && user.referrer_code
            };

        } catch (error) {
            console.error('Error processing order:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Find user by WhatsApp number or create new user
     * @param {string} whatsappNo - WhatsApp number
     * @returns {Object|null} User object or null
     */
    async findOrCreateUser(whatsappNo) {
        try {
            // Search for existing user
            const response = await fetch(`${this.apiUrl}/search?sheet=users&whatsapp_no=${whatsappNo}`);
            const users = await response.json();

            if (users && users.length > 0) {
                return users[0];
            }

            // User not found - check if there's a pending referral code
            const referrerCode = localStorage.getItem('sembako_referral_code') || '';
            
            // Create new user (without name, will be updated later if needed)
            const userId = 'USR-' + Date.now();
            const referralCode = this.generateReferralCode(whatsappNo);

            const newUser = {
                user_id: userId,
                name: 'Customer-' + whatsappNo.slice(-4), // Temporary name
                whatsapp_no: whatsappNo,
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
                await this.createReferralRecord(referrerCode, userId, newUser.name);
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
     * @param {string} userId - User ID
     * @returns {boolean} True if first order
     */
    async isFirstOrder(userId) {
        try {
            const response = await fetch(`${this.apiUrl}/search?sheet=orders&user_id=${userId}`);
            const orders = await response.json();
            return orders && orders.length === 1; // True if only 1 order (the one just created)
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

            // 1. Find the pending referral record
            const refResponse = await fetch(
                `${this.apiUrl}/search?sheet=referrals&referrer_code=${referrerCode}&referred_user_id=${referredUserId}&status=pending`
            );
            const referrals = await refResponse.json();

            if (!referrals || referrals.length === 0) {
                console.log('No pending referral found');
                return;
            }

            const referral = referrals[0];

            // 2. Update referral status to completed
            // Note: SheetDB update by search is tricky, we'll use the ID if available
            // For now, we'll create a new completed record (workaround for SheetDB limitation)
            
            // 3. Find referrer user
            const referrerResponse = await fetch(`${this.apiUrl}/search?sheet=users&referral_code=${referrerCode}`);
            const referrers = await referrerResponse.json();

            if (!referrers || referrers.length === 0) {
                console.log('Referrer not found');
                return;
            }

            const referrer = referrers[0];

            // 4. Add points to referrer
            const newPoints = (parseInt(referrer.total_points) || 0) + 10000;

            // Update referrer points using SheetDB
            // We need to use the 'id' field for SheetDB updates
            if (referrer.id) {
                await fetch(`${this.apiUrl}/id/${referrer.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        data: { total_points: newPoints }
                    })
                });
            }

            // 5. Update referral status
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
            }

            console.log(`✅ Reward given: ${referrer.name} received 10,000 points`);

            // 6. Show notification to user (if they're the referrer and currently on site)
            this.showRewardNotification(referrer.name);

        } catch (error) {
            console.error('Error completing referral:', error);
        }
    }

    /**
     * Generate referral code from WhatsApp number
     * @param {string} whatsappNo - WhatsApp number
     * @returns {string} Referral code
     */
    generateReferralCode(whatsappNo) {
        const prefix = whatsappNo.slice(-4);
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return prefix + random;
    }

    /**
     * Show reward notification
     * @param {string} referrerName - Name of referrer who got reward
     */
    showRewardNotification(referrerName) {
        // Check if current user is the referrer
        const currentUserData = localStorage.getItem('sembako_user_data');
        if (!currentUserData) return;

        try {
            const currentUser = JSON.parse(currentUserData);
            if (currentUser.name === referrerName) {
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
