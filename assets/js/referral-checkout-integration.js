/**
 * Referral Checkout Integration
 * Integrates referral discount into the checkout flow
 */

(function() {
    'use strict';
    
    // Store referral discount data
    let referralDiscountData = null;
    
    /**
     * Override the original updateOrderTotal function to include referral discount
     */
    function integrateReferralDiscount() {
        // Store original function
        const originalUpdateOrderTotal = window.updateOrderTotal;
        
        // Override with new function that includes referral discount
        window.updateOrderTotal = async function() {
            // Call original function first
            if (originalUpdateOrderTotal) {
                originalUpdateOrderTotal();
            }
            
            // Get customer phone
            const phoneInput = document.getElementById('customer-whatsapp');
            if (!phoneInput || !phoneInput.value) {
                return; // No phone yet, can't check referral
            }
            
            const phone = normalizePhone(phoneInput.value);
            
            // Calculate current total
            const payEl = document.querySelector('input[name="pay-method"]:checked');
            const shipEl = document.querySelector('input[name="ship-method"]:checked');
            const isGajian = payEl && payEl.value === 'Bayar Gajian';
            const isDelivery = shipEl && shipEl.value === 'Antar Nikomas';
            
            let subtotal = 0;
            cart.forEach(item => {
                const price = isGajian ? item.hargaGajian : item.harga;
                const effectivePrice = calculateTieredPrice(price, item.qty, item.grosir);
                subtotal += effectivePrice * item.qty;
            });
            
            const shippingFee = isDelivery ? 2000 : 0;
            const originalTotal = subtotal + shippingFee;
            
            // Check and apply referral discount
            if (window.ReferralDiscount) {
                const result = await ReferralDiscount.applyDiscount(phone, originalTotal);
                
                if (result.eligible) {
                    // Store for later use in order submission
                    referralDiscountData = result;
                    
                    // Show discount badge
                    ReferralDiscount.showDiscountBadge(result.discount);
                    
                    // Update total display with discount
                    const totalEl = document.getElementById('sticky-order-total');
                    if (totalEl) {
                        totalEl.innerHTML = `
                            <div>
                                <div class="text-sm text-gray-500 line-through">Rp ${originalTotal.toLocaleString('id-ID')}</div>
                                <div class="text-2xl font-bold text-green-600">Rp ${result.finalTotal.toLocaleString('id-ID')}</div>
                                <div class="text-xs text-green-600">Diskon ${ReferralDiscount.DISCOUNT_PERCENTAGE}% diterapkan!</div>
                            </div>
                        `;
                    }
                } else {
                    // Clear discount data
                    referralDiscountData = null;
                    
                    // Remove badge if exists
                    const badge = document.getElementById('referral-discount-badge');
                    if (badge) {
                        badge.remove();
                    }
                }
            }
        };
    }
    
    /**
     * Hook into order submission to record referral transaction
     */
    function hookOrderSubmission() {
        // Listen for order modal open
        const originalOpenOrderModal = window.openOrderModal;
        if (originalOpenOrderModal) {
            window.openOrderModal = function() {
                originalOpenOrderModal();
                
                // Trigger discount check when phone is entered
                const phoneInput = document.getElementById('customer-whatsapp');
                if (phoneInput) {
                    // Check on blur (when user leaves field)
                    phoneInput.addEventListener('blur', function() {
                        if (window.updateOrderTotal && phoneInput.value.length >= 10) {
                            window.updateOrderTotal();
                        }
                    });
                    
                    // Also check on input change (real-time)
                    phoneInput.addEventListener('input', function() {
                        // Only check when phone number is complete (at least 10 digits)
                        const cleaned = phoneInput.value.replace(/[^0-9]/g, '');
                        if (cleaned.length >= 10 && window.updateOrderTotal) {
                            // Debounce to avoid too many API calls
                            clearTimeout(phoneInput._checkTimeout);
                            phoneInput._checkTimeout = setTimeout(() => {
                                window.updateOrderTotal();
                            }, 500);
                        }
                    });
                }
            };
        }
    }
    
    /**
     * Record referral transaction after order is created
     * Call this after order is successfully submitted
     */
    window.recordReferralTransaction = async function(orderId, customerPhone, customerName) {
        if (!referralDiscountData || !referralDiscountData.eligible) {
            return null; // No referral discount applied
        }
        
        const data = {
            referralCode: referralDiscountData.referralCode,
            referrerPhone: referralDiscountData.referrerData.whatsapp,
            refereePhone: customerPhone,
            refereeName: customerName,
            orderId: orderId,
            orderTotal: referralDiscountData.finalTotal + referralDiscountData.discount, // Original total
            discountAmount: referralDiscountData.discount,
            finalAmount: referralDiscountData.finalTotal
        };
        
        const transactionId = await ReferralTransaction.record(data);
        
        if (transactionId) {
            // Clear referral code from localStorage after successful use
            if (window.ReferralTracker) {
                window.ReferralTracker.clear();
            }
            
            console.log('✅ Referral transaction recorded:', transactionId);
        }
        
        return transactionId;
    };
    
    /**
     * Get current referral discount amount (for WhatsApp message)
     */
    window.getReferralDiscountAmount = function() {
        return referralDiscountData && referralDiscountData.eligible ? referralDiscountData.discount : 0;
    };
    
    /**
     * Get final total with referral discount
     */
    window.getFinalTotalWithReferral = function() {
        if (referralDiscountData && referralDiscountData.eligible) {
            return referralDiscountData.finalTotal;
        }
        
        // Calculate normal total
        const payEl = document.querySelector('input[name="pay-method"]:checked');
        const shipEl = document.querySelector('input[name="ship-method"]:checked');
        const isGajian = payEl && payEl.value === 'Bayar Gajian';
        const isDelivery = shipEl && shipEl.value === 'Antar Nikomas';
        
        let subtotal = 0;
        cart.forEach(item => {
            const price = isGajian ? item.hargaGajian : item.harga;
            const effectivePrice = calculateTieredPrice(price, item.qty, item.grosir);
            subtotal += effectivePrice * item.qty;
        });
        
        const shippingFee = isDelivery ? 2000 : 0;
        return subtotal + shippingFee;
    };
    
    // Initialize integration
    function init() {
        // Wait for DOM and other scripts to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(function() {
                    integrateReferralDiscount();
                    hookOrderSubmission();
                }, 500);
            });
        } else {
            setTimeout(function() {
                integrateReferralDiscount();
                hookOrderSubmission();
            }, 500);
        }
    }
    
    init();
    
})();
