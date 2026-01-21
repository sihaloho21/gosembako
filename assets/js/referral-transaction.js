/**
 * Referral Transaction Recorder
 * Records referral transactions and credits points
 */

const ReferralTransaction = (function() {
    'use strict';
    
    /**
     * Generate unique transaction ID
     */
    function generateTransactionId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let id = 'REFTX-';
        for (let i = 0; i < 8; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }
    
    /**
     * Record referral transaction
     */
    async function recordTransaction(data) {
        const {
            referralCode,
            referrerPhone,
            refereePhone,
            refereeName,
            orderId,
            orderTotal,
            discountAmount,
            finalAmount
        } = data;
        
        try {
            const API_URL = CONFIG.getMainAPI();
            const transactionId = generateTransactionId();
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            
            const transaction = {
                transaction_id: transactionId,
                referrer_code: referralCode,
                referrer_phone: referrerPhone,
                referee_phone: refereePhone,
                referee_name: refereeName,
                order_id: orderId,
                order_total: orderTotal,
                discount_amount: discountAmount,
                final_amount: finalAmount,
                points_earned: ReferralDiscount.POINTS_REWARD,
                status: 'completed', // Auto-complete immediately
                created_at: now,
                completed_at: now // Set completed time immediately
            };
            
            const response = await fetch(`${API_URL}?sheet=referral_transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: transaction
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to record transaction');
            }
            
            console.log('✅ Referral transaction recorded:', transactionId);
            
            // Auto-credit points immediately
            await creditPoints(referrerPhone, ReferralDiscount.POINTS_REWARD);
            
            return transactionId;
            
        } catch (error) {
            console.error('Error recording referral transaction:', error);
            return null;
        }
    }
    
    /**
     * Complete transaction and credit points
     * Call this when order is completed
     */
    async function completeTransaction(transactionId) {
        try {
            const API_URL = CONFIG.getMainAPI();
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            
            // Get transaction details
            const txResponse = await fetch(`${API_URL}?sheet=referral_transactions&transaction_id=${transactionId}`);
            const transactions = await txResponse.json();
            
            if (!transactions || transactions.length === 0) {
                throw new Error('Transaction not found');
            }
            
            const transaction = transactions[0];
            
            // Update transaction status
            await fetch(`${API_URL}/transaction_id/${transactionId}?sheet=referral_transactions`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: {
                        status: 'completed',
                        completed_at: now
                    }
                })
            });
            
            // Credit points to referrer
            await creditPoints(transaction.referrer_phone, transaction.points_earned);
            
            console.log('✅ Transaction completed and points credited:', transactionId);
            return true;
            
        } catch (error) {
            console.error('Error completing transaction:', error);
            return false;
        }
    }
    
    /**
     * Credit points to referrer
     */
    async function creditPoints(referrerPhone, points) {
        try {
            const API_URL = CONFIG.getMainAPI();
            
            // Get current referrer data
            const response = await fetch(`${API_URL}?sheet=user_referral&whatsapp=${referrerPhone}`);
            const users = await response.json();
            
            if (!users || users.length === 0) {
                throw new Error('Referrer not found');
            }
            
            const referrer = users[0];
            const newTotalPoints = (parseInt(referrer.total_points) || 0) + points;
            const newCompletedReferrals = (parseInt(referrer.completed_referrals) || 0) + 1;
            
            // Update referrer points
            await fetch(`${API_URL}/whatsapp/${referrerPhone}?sheet=user_referral`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: {
                        total_points: newTotalPoints,
                        completed_referrals: newCompletedReferrals
                    }
                })
            });
            
            console.log(`✅ Credited ${points} points to ${referrerPhone}`);
            return true;
            
        } catch (error) {
            console.error('Error crediting points:', error);
            return false;
        }
    }
    
    /**
     * Cancel transaction (if order cancelled)
     */
    async function cancelTransaction(transactionId) {
        try {
            const API_URL = CONFIG.getMainAPI();
            
            await fetch(`${API_URL}/transaction_id/${transactionId}?sheet=referral_transactions`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: {
                        status: 'cancelled'
                    }
                })
            });
            
            console.log('✅ Transaction cancelled:', transactionId);
            return true;
            
        } catch (error) {
            console.error('Error cancelling transaction:', error);
            return false;
        }
    }
    
    // Public API
    return {
        record: recordTransaction,
        complete: completeTransaction,
        cancel: cancelTransaction
    };
    
})();
