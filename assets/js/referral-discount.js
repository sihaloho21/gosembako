/**
 * Referral Discount Handler
 * Applies 10% discount for first-time buyers from referral
 */

const ReferralDiscount = (function() {
    'use strict';
    
    const DISCOUNT_PERCENTAGE = 10; // 10% discount
    const POINTS_REWARD = 10000; // 10,000 points for referrer
    
    /**
     * Check if phone number is first-time buyer
     */
    async function isFirstTimeBuyer(phone) {
        try {
            const API_URL = CONFIG.getMainAPI();
            const response = await fetch(`${API_URL}?sheet=orders&whatsapp=${phone}`);
            const orders = await response.json();
            
            // If no orders found, it's a first-time buyer
            return !orders || orders.length === 0;
        } catch (error) {
            console.error('Error checking first-time buyer:', error);
            return false; // Default to false for safety
        }
    }
    
    /**
     * Validate referral code exists
     */
    async function validateReferralCode(code) {
        try {
            const API_URL = CONFIG.getMainAPI();
            const response = await fetch(`${API_URL}?sheet=user_referral&referral_code=${code}`);
            const users = await response.json();
            
            if (users && users.length > 0) {
                return users[0]; // Return referrer data
            }
            return null;
        } catch (error) {
            console.error('Error validating referral code:', error);
            return null;
        }
    }
    
    /**
     * Calculate discount amount
     */
    function calculateDiscount(total) {
        return Math.round(total * (DISCOUNT_PERCENTAGE / 100));
    }
    
    /**
     * Apply referral discount to cart
     * Returns: { eligible, discount, finalTotal, referrerData }
     */
    async function applyDiscount(phone, cartTotal) {
        // Check if has referral code
        const referralCode = window.ReferralTracker ? window.ReferralTracker.getCode() : null;
        
        if (!referralCode) {
            return {
                eligible: false,
                reason: 'No referral code',
                discount: 0,
                finalTotal: cartTotal
            };
        }
        
        // Validate referral code
        const referrerData = await validateReferralCode(referralCode);
        if (!referrerData) {
            return {
                eligible: false,
                reason: 'Invalid referral code',
                discount: 0,
                finalTotal: cartTotal
            };
        }
        
        // Check if self-referral
        if (referrerData.whatsapp === phone) {
            return {
                eligible: false,
                reason: 'Cannot use own referral code',
                discount: 0,
                finalTotal: cartTotal
            };
        }
        
        // Check if first-time buyer
        const isFirstTime = await isFirstTimeBuyer(phone);
        if (!isFirstTime) {
            return {
                eligible: false,
                reason: 'Discount only for first-time buyers',
                discount: 0,
                finalTotal: cartTotal
            };
        }
        
        // Calculate discount
        const discountAmount = calculateDiscount(cartTotal);
        const finalTotal = cartTotal - discountAmount;
        
        return {
            eligible: true,
            discount: discountAmount,
            finalTotal: finalTotal,
            referrerData: referrerData,
            referralCode: referralCode
        };
    }
    
    /**
     * Show discount badge in UI
     */
    function showDiscountBadge(discountAmount) {
        // Check if badge already exists
        let badge = document.getElementById('referral-discount-badge');
        
        if (!badge) {
            // Create badge
            badge = document.createElement('div');
            badge.id = 'referral-discount-badge';
            badge.className = 'bg-green-100 border-2 border-green-500 rounded-xl p-4 mb-4';
            
            // Find order summary section and insert badge
            const orderSummary = document.querySelector('#order-modal') || document.querySelector('.order-summary');
            if (orderSummary) {
                orderSummary.insertBefore(badge, orderSummary.firstChild);
            }
        }
        
        badge.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="flex-shrink-0">
                    <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <div class="flex-1">
                    <p class="font-bold text-green-800 text-lg">🎉 Diskon Referral Aktif!</p>
                    <p class="text-green-700 text-sm">Anda mendapat diskon ${DISCOUNT_PERCENTAGE}% (Rp ${discountAmount.toLocaleString('id-ID')})</p>
                </div>
            </div>
        `;
    }
    
    /**
     * Update order total display with discount
     */
    function updateTotalDisplay(originalTotal, discount, finalTotal) {
        const totalElement = document.getElementById('order-total-display');
        if (!totalElement) return;
        
        totalElement.innerHTML = `
            <div class="space-y-2">
                <div class="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>Rp ${originalTotal.toLocaleString('id-ID')}</span>
                </div>
                <div class="flex justify-between text-green-600 font-semibold">
                    <span>Diskon Referral (${DISCOUNT_PERCENTAGE}%):</span>
                    <span>- Rp ${discount.toLocaleString('id-ID')}</span>
                </div>
                <div class="border-t-2 border-gray-300 pt-2 flex justify-between text-xl font-bold text-gray-800">
                    <span>Total Bayar:</span>
                    <span>Rp ${finalTotal.toLocaleString('id-ID')}</span>
                </div>
            </div>
        `;
    }
    
    // Public API
    return {
        applyDiscount: applyDiscount,
        showDiscountBadge: showDiscountBadge,
        updateTotalDisplay: updateTotalDisplay,
        calculateDiscount: calculateDiscount,
        DISCOUNT_PERCENTAGE: DISCOUNT_PERCENTAGE,
        POINTS_REWARD: POINTS_REWARD
    };
    
})();
