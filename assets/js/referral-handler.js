/**
 * Referral Handler
 * Handles referral code tracking from URL parameters
 * Stores referral code in localStorage for later use during registration
 */

class ReferralHandler {
    constructor() {
        this.STORAGE_KEY = 'sembako_referral_code';
        this.REFERRER_NAME_KEY = 'sembako_referrer_name';
    }

    /**
     * Initialize referral handler
     * Call this on page load
     */
    init() {
        this.checkUrlForReferralCode();
        this.showWelcomeBannerIfReferred();
    }

    /**
     * Check URL for referral code parameter (?ref=CODE)
     * If found, save to localStorage
     */
    checkUrlForReferralCode() {
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');

        if (refCode) {
            // Save referral code to localStorage
            localStorage.setItem(this.STORAGE_KEY, refCode);
            console.log(`✅ Referral code "${refCode}" saved to localStorage`);

            // Fetch referrer name for better UX
            this.fetchReferrerName(refCode);

            // Clean URL (remove ?ref= parameter)
            this.cleanUrl();
        }
    }

    /**
     * Fetch referrer name from database
     * @param {string} refCode - Referral code
     */
    async fetchReferrerName(refCode) {
        try {
            const apiUrl = CONFIG.getMainApiUrl();
            const response = await fetch(`${apiUrl}/search?sheet=users&referral_code=${refCode}`);
            const data = await response.json();

            if (data && data.length > 0) {
                const referrerName = data[0].name;
                localStorage.setItem(this.REFERRER_NAME_KEY, referrerName);
                console.log(`✅ Referrer name "${referrerName}" saved`);
            }
        } catch (error) {
            console.error('Error fetching referrer name:', error);
        }
    }

    /**
     * Clean URL by removing ?ref= parameter
     * Uses history.replaceState to avoid page reload
     */
    cleanUrl() {
        const url = new URL(window.location.href);
        url.searchParams.delete('ref');
        window.history.replaceState({}, document.title, url.toString());
    }

    /**
     * Show welcome banner if user came from referral link
     */
    showWelcomeBannerIfReferred() {
        const refCode = this.getReferralCode();
        const referrerName = localStorage.getItem(this.REFERRER_NAME_KEY);

        if (refCode) {
            this.displayWelcomeBanner(refCode, referrerName);
        }
    }

    /**
     * Display welcome banner at top of page
     * @param {string} refCode - Referral code
     * @param {string} referrerName - Name of referrer (optional)
     */
    displayWelcomeBanner(refCode, referrerName) {
        // Check if banner already exists
        if (document.getElementById('referral-welcome-banner')) {
            return;
        }

        const banner = document.createElement('div');
        banner.id = 'referral-welcome-banner';
        banner.className = 'referral-welcome-banner';
        
        const message = referrerName 
            ? `🎁 Selamat Datang! <strong>${referrerName}</strong> mengajak Anda. Dapatkan <strong>diskon 10%</strong> untuk pesanan pertama!`
            : `🎁 Selamat Datang! Dapatkan <strong>diskon 10%</strong> untuk pesanan pertama Anda!`;

        banner.innerHTML = `
            <div class="banner-content">
                <p>${message}</p>
                <button class="banner-close" onclick="ReferralHandler.closeBanner()">×</button>
            </div>
        `;

        // Insert banner at top of body
        document.body.insertBefore(banner, document.body.firstChild);

        // Adjust body padding to prevent content from being hidden
        document.body.style.paddingTop = '70px';
    }

    /**
     * Close welcome banner
     */
    static closeBanner() {
        const banner = document.getElementById('referral-welcome-banner');
        if (banner) {
            banner.style.display = 'none';
            document.body.style.paddingTop = '0';
        }
    }

    /**
     * Get stored referral code from localStorage
     * @returns {string|null} Referral code or null if not found
     */
    getReferralCode() {
        return localStorage.getItem(this.STORAGE_KEY);
    }

    /**
     * Clear stored referral code
     * Call this after user successfully registers
     */
    clearReferralCode() {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.REFERRER_NAME_KEY);
        console.log('✅ Referral code cleared from localStorage');
    }

    /**
     * Check if user came from referral link
     * @returns {boolean}
     */
    hasReferralCode() {
        return !!this.getReferralCode();
    }
}

// Initialize on page load
const referralHandler = new ReferralHandler();
document.addEventListener('DOMContentLoaded', () => {
    referralHandler.init();
});

// Make it globally accessible
window.ReferralHandler = ReferralHandler;
window.referralHandler = referralHandler;
