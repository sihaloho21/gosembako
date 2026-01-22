/**
 * Configuration Manager
 * Mengelola konfigurasi API URL melalui localStorage
 * Memungkinkan perubahan URL tanpa mengedit kode
 */

const CONFIG = {
    // Default API URLs (Fallback)
    DEFAULTS: {
        MAIN_API: 'https://sheetdb.io/api/v1/ff8zi9lbwbk77',
        ADMIN_API: 'https://sheetdb.io/api/v1/ff8zi9lbwbk77',
        VERSION: '1.0.0'
    },
    
    // Storage keys
    STORAGE_KEYS: {
        BOOTSTRAP_API: 'sembako_bootstrap_api_url',
        MAIN_API: 'sembako_main_api_url',
        ADMIN_API: 'sembako_admin_api_url',
        GAJIAN_CONFIG: 'sembako_gajian_config',
        REWARD_CONFIG: 'sembako_reward_config',
        STORE_CLOSED: 'sembako_store_closed'
    },
    
    // Session storage for fetched settings
    _settingsFetched: false,
    
    /**
     * Mendapatkan Bootstrap API URL
     * @returns {string} Bootstrap API URL
     */
    getBootstrapApiUrl() {
        return localStorage.getItem(this.STORAGE_KEYS.BOOTSTRAP_API) || '';
    },
    
    /**
     * Menyimpan Bootstrap API URL
     * @param {string} url - Bootstrap API URL
     */
    setBootstrapApiUrl(url) {
        if (url && url.trim()) {
            localStorage.setItem(this.STORAGE_KEYS.BOOTSTRAP_API, url.trim());
            return true;
        }
        return false;
    },
    
    /**
     * Fetch settings dari Bootstrap API
     * @returns {Promise<boolean>} true jika berhasil
     */
    async fetchSettings() {
        const bootstrapApi = this.getBootstrapApiUrl();
        
        // Jika tidak ada bootstrap API, skip
        if (!bootstrapApi) {
            console.log('⚠️ [CONFIG] No bootstrap API configured, using localStorage');
            return false;
        }
        
        // Jika sudah fetch di session ini, skip
        if (this._settingsFetched) {
            console.log('✅ [CONFIG] Settings already fetched this session');
            return true;
        }
        
        try {
            console.log('🔄 [CONFIG] Fetching settings from bootstrap API...');
            const response = await fetch(`${bootstrapApi}?sheet=settings`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const settings = await response.json();
            console.log('📥 [CONFIG] Settings received:', settings);
            
            // Parse settings array menjadi object
            const settingsObj = {};
            settings.forEach(item => {
                settingsObj[item.key] = item.value;
            });
            
            // Update sessionStorage dengan settings dari server
            if (settingsObj.main_api_url) {
                sessionStorage.setItem('runtime_main_api_url', settingsObj.main_api_url);
                console.log('✅ [CONFIG] Main API URL updated:', settingsObj.main_api_url);
            }
            
            if (settingsObj.admin_api_url) {
                sessionStorage.setItem('runtime_admin_api_url', settingsObj.admin_api_url);
                console.log('✅ [CONFIG] Admin API URL updated:', settingsObj.admin_api_url);
            }
            
            this._settingsFetched = true;
            return true;
            
        } catch (error) {
            console.error('❌ [CONFIG] Failed to fetch settings:', error);
            return false;
        }
    },
    
    /**
     * Mendapatkan URL API untuk halaman utama
     * Priority: sessionStorage (bootstrap) > localStorage (manual) > default
     * @returns {string} URL API
     */
    getMainApiUrl() {
        // Priority 1: Runtime dari bootstrap API
        const runtime = sessionStorage.getItem('runtime_main_api_url');
        if (runtime) return runtime;
        
        // Priority 2: Manual dari localStorage
        const manual = localStorage.getItem(this.STORAGE_KEYS.MAIN_API);
        if (manual) return manual;
        
        // Priority 3: Default (Fallback)
        return this.DEFAULTS.MAIN_API;
    },
    
    /**
     * Mendapatkan URL API untuk halaman admin
     * Priority: sessionStorage (bootstrap) > localStorage (manual) > default
     * @returns {string} URL API
     */
    getAdminApiUrl() {
        // Priority 1: Runtime dari bootstrap API
        const runtime = sessionStorage.getItem('runtime_admin_api_url');
        if (runtime) return runtime;
        
        // Priority 2: Manual dari localStorage
        const manual = localStorage.getItem(this.STORAGE_KEYS.ADMIN_API);
        if (manual) return manual;
        
        // Priority 3: Default (Fallback)
        return this.DEFAULTS.ADMIN_API;
    },
    
    /**
     * Menyimpan URL API untuk halaman utama
     * @param {string} url - URL API baru
     */
    setMainApiUrl(url) {
        if (url && url.trim()) {
            localStorage.setItem(this.STORAGE_KEYS.MAIN_API, url.trim());
            // ✅ Clear cache saat API berubah
            if (typeof ApiService !== 'undefined') {
                ApiService.clearCache();
                console.log('✅ API cache cleared after URL change');
            }
            // ✅ Clear sessionStorage runtime cache
            sessionStorage.removeItem('runtime_main_api_url');
            return true;
        }
        return false;
    },
    
    /**
     * Menyimpan URL API untuk halaman admin
     * @param {string} url - URL API baru
     */
    setAdminApiUrl(url) {
        if (url && url.trim()) {
            localStorage.setItem(this.STORAGE_KEYS.ADMIN_API, url.trim());
            // ✅ Clear cache saat API berubah
            if (typeof ApiService !== 'undefined') {
                ApiService.clearCache();
                console.log('✅ API cache cleared after URL change');
            }
            // ✅ Clear sessionStorage runtime cache
            sessionStorage.removeItem('runtime_admin_api_url');
            return true;
        }
        return false;
    },
    
    /**
     * Mereset URL API ke default
     * @param {string} type - 'main' atau 'admin'
     */
    resetToDefault(type = 'main') {
        if (type === 'main') {
            localStorage.removeItem(this.STORAGE_KEYS.MAIN_API);
        } else if (type === 'admin') {
            localStorage.removeItem(this.STORAGE_KEYS.ADMIN_API);
        }
        // ✅ Clear cache saat reset
        if (typeof ApiService !== 'undefined') {
            ApiService.clearCache();
            console.log('✅ API cache cleared after reset to default');
        }
        // ✅ Clear sessionStorage runtime cache
        sessionStorage.removeItem('runtime_main_api_url');
        sessionStorage.removeItem('runtime_admin_api_url');
    },
    
    /**
     * Mendapatkan konfigurasi Bayar Gajian
     * @returns {object} Konfigurasi gajian
     */
    getGajianConfig() {
        const saved = localStorage.getItem(this.STORAGE_KEYS.GAJIAN_CONFIG);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Error parsing gajian config', e);
            }
        }
        return {
            targetDay: 7,
            markups: [
                { minDays: 29, rate: 0.20 },
                { minDays: 26, rate: 0.18 },
                { minDays: 23, rate: 0.16 },
                { minDays: 20, rate: 0.14 },
                { minDays: 17, rate: 0.12 },
                { minDays: 14, rate: 0.10 },
                { minDays: 11, rate: 0.08 },
                { minDays: 8, rate: 0.06 },
                { minDays: 3, rate: 0.04 },
                { minDays: 0, rate: 0.02 }
            ],
            defaultMarkup: 0.25
        };
    },

    /**
     * Menyimpan konfigurasi Bayar Gajian
     * @param {object} config - Konfigurasi baru
     */
    setGajianConfig(config) {
        localStorage.setItem(this.STORAGE_KEYS.GAJIAN_CONFIG, JSON.stringify(config));
    },

    /**
     * Mendapatkan konfigurasi Reward Poin
     * @returns {object} Konfigurasi reward
     */
    getRewardConfig() {
        const saved = localStorage.getItem(this.STORAGE_KEYS.REWARD_CONFIG);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Error parsing reward config', e);
            }
        }
        return {
            pointValue: 10000, // 10.000 IDR = 1 point
            minPoint: 0.1,
            manualOverrides: {} // { productName: points }
        };
    },

    /**
     * Menyimpan konfigurasi Reward Poin
     * @param {object} config - Konfigurasi baru
     */
    setRewardConfig(config) {
        localStorage.setItem(this.STORAGE_KEYS.REWARD_CONFIG, JSON.stringify(config));
    },

    /**
     * Mendapatkan status toko (tutup/buka)
     * @returns {boolean} true jika toko tutup
     */
    isStoreClosed() {
        return localStorage.getItem(this.STORAGE_KEYS.STORE_CLOSED) === 'true';
    },

    /**
     * Mengatur status toko
     * @param {boolean} closed - true untuk menutup toko
     */
    setStoreClosed(closed) {
        localStorage.setItem(this.STORAGE_KEYS.STORE_CLOSED, closed ? 'true' : 'false');
    },

    /**
     * Mendapatkan Google Apps Script URL untuk referral backend
     * @returns {string} GAS Web App URL
     */
    getGASUrl() {
        // Priority: sessionStorage > localStorage > defaults
        const runtime = sessionStorage.getItem('runtime_gas_url');
        if (runtime) return runtime;
        
        const stored = localStorage.getItem('sembako_gas_url');
        if (stored) return stored;
        
        return ''; // Default kosong (belum dikonfigurasi)
    },
    
    /**
     * Menyimpan Google Apps Script URL
     * @param {string} url - GAS Web App URL
     * @returns {boolean} true jika berhasil
     */
    setGASUrl(url) {
        if (!url || !url.trim()) {
            console.error('❌ GAS URL tidak valid');
            return false;
        }
        
        url = url.trim();
        
        // Validate URL format
        if (!url.startsWith('https://script.google.com/')) {
            console.error('❌ GAS URL harus dari script.google.com');
            return false;
        }
        
        localStorage.setItem('sembako_gas_url', url);
        sessionStorage.setItem('runtime_gas_url', url);
        
        // Clear API cache untuk ensure fresh start
        if (typeof ApiService !== 'undefined') {
            ApiService.clearCache();
        }
        
        console.log('✅ GAS URL berhasil diupdate:', url);
        return true;
    },
    
    /**
     * Test koneksi ke GAS backend
     * @returns {Promise<boolean>} true jika GAS online
     */
    async testGASConnection() {
        const gasUrl = this.getGASUrl();
        
        if (!gasUrl) {
            console.warn('⚠️ GAS URL tidak dikonfigurasi');
            return false;
        }
        
        try {
            const testUrl = gasUrl + '?action=getStats';
            const response = await fetch(testUrl);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ GAS Connection OK:', data);
                return true;
            } else {
                console.error('❌ GAS HTTP Error:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ GAS Connection Error:', error);
            return false;
        }
    },
    
    /**
     * Mendapatkan semua konfigurasi saat ini
     * @returns {object} Objek berisi semua konfigurasi
     */
    getAllConfig() {
        return {
            mainApi: this.getMainApiUrl(),
            adminApi: this.getAdminApiUrl(),
            gasUrl: this.getGASUrl(),
            gajian: this.getGajianConfig(),
            reward: this.getRewardConfig(),
            storeClosed: this.isStoreClosed()
        };
    }
};
