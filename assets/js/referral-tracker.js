/**
 * Referral Tracking System
 * Detects and stores referral code from URL parameter
 */

(function() {
    'use strict';
    
    // Get referral code from URL parameter
    function getReferralCodeFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('ref');
    }
    
    // Save referral code to localStorage
    function saveReferralCode(code) {
        if (!code) return;
        
        // Store referral code with timestamp
        const referralData = {
            code: code,
            timestamp: new Date().toISOString(),
            source_url: window.location.href
        };
        
        localStorage.setItem('sembako_referral_code', JSON.stringify(referralData));
        console.log('✅ Referral code saved:', code);
    }
    
    // Get stored referral code
    function getStoredReferralCode() {
        const stored = localStorage.getItem('sembako_referral_code');
        if (!stored) return null;
        
        try {
            const data = JSON.parse(stored);
            
            // Check if referral code is still valid (30 days)
            const timestamp = new Date(data.timestamp);
            const now = new Date();
            const daysDiff = (now - timestamp) / (1000 * 60 * 60 * 24);
            
            if (daysDiff > 30) {
                // Expired, remove it
                localStorage.removeItem('sembako_referral_code');
                return null;
            }
            
            return data.code;
        } catch (e) {
            return null;
        }
    }
    
    // Clear referral code (after successful order)
    function clearReferralCode() {
        localStorage.removeItem('sembako_referral_code');
        console.log('✅ Referral code cleared');
    }
    
    // Initialize tracking on page load
    function init() {
        const refCode = getReferralCodeFromURL();
        
        if (refCode) {
            saveReferralCode(refCode);
            
            // Show notification to user
            showReferralNotification();
            
            // Clean URL (remove ref parameter) - optional
            // This keeps the URL clean without reloading
            if (window.history && window.history.replaceState) {
                const url = new URL(window.location.href);
                url.searchParams.delete('ref');
                window.history.replaceState({}, document.title, url.toString());
            }
        }
    }
    
    // Show notification that referral discount is available
    function showReferralNotification() {
        // Create notification element
        const notification = document.createElement('div');
        notification.id = 'referral-notification';
        notification.className = 'fixed top-20 right-4 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-slide-in-right max-w-sm';
        notification.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="flex-shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <div class="flex-1">
                    <p class="font-bold mb-1">🎉 Selamat!</p>
                    <p class="text-sm">Anda mendapat diskon 10% untuk pesanan pertama!</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="flex-shrink-0 text-white hover:text-green-200">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (notification && notification.parentElement) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
    
    // Add CSS for animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slide-in-right {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        .animate-slide-in-right {
            animation: slide-in-right 0.3s ease-out;
        }
        #referral-notification {
            transition: all 0.3s ease-out;
        }
    `;
    document.head.appendChild(style);
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Expose functions globally for use in checkout
    window.ReferralTracker = {
        getCode: getStoredReferralCode,
        clear: clearReferralCode,
        hasReferral: function() {
            return getStoredReferralCode() !== null;
        }
    };
    
})();
