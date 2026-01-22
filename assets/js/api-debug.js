/**
 * API Debug & Diagnostic Tool
 * Membantu mengidentifikasi dan mengatasi masalah API caching
 */

const ApiDebug = {
    /**
     * Get current API configuration status
     * @returns {object} Current configuration details
     */
    getStatus() {
        return {
            mainApiUrl: CONFIG.getMainApiUrl(),
            adminApiUrl: CONFIG.getAdminApiUrl(),
            cacheSize: ApiService ? ApiService.cache.size : 0,
            pendingRequests: ApiService ? ApiService.pendingRequests.size : 0,
            storageSizeEstimate: this._estimateStorageSize(),
            localStorage: {
                bootstrap_api: localStorage.getItem(CONFIG.STORAGE_KEYS.BOOTSTRAP_API) || '(not set)',
                main_api: localStorage.getItem(CONFIG.STORAGE_KEYS.MAIN_API) || '(not set)',
                admin_api: localStorage.getItem(CONFIG.STORAGE_KEYS.ADMIN_API) || '(not set)'
            },
            sessionStorage: {
                runtime_main_api: sessionStorage.getItem('runtime_main_api_url') || '(not set)',
                runtime_admin_api: sessionStorage.getItem('runtime_admin_api_url') || '(not set)'
            }
        };
    },

    /**
     * Print debug information to console in a nice format
     */
    printDebugInfo() {
        const status = this.getStatus();
        console.clear();
        console.group('🔍 GoSembako API Debug Info');
        console.table({
            'Current Main API': status.mainApiUrl,
            'Current Admin API': status.adminApiUrl,
            'Cache Entries': status.cacheSize,
            'Pending Requests': status.pendingRequests,
            'Storage Est. Size': status.storageSizeEstimate
        });
        
        console.group('📦 localStorage Keys');
        console.table(status.localStorage);
        console.groupEnd();
        
        console.group('⚡ sessionStorage Keys');
        console.table(status.sessionStorage);
        console.groupEnd();
        
        console.groupEnd();
    },

    /**
     * Test if API is responding correctly
     * @returns {Promise<object>} Test results
     */
    async testApi() {
        const mainApi = CONFIG.getMainApiUrl();
        console.log('🧪 Testing API:', mainApi);
        
        try {
            const response = await fetch(`${mainApi}?sheet=products&limit=1`, {
                method: 'GET',
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('✅ API Test Passed! Response:', data);
            return {
                success: true,
                status: response.status,
                dataLength: Array.isArray(data) ? data.length : 1,
                message: 'API is responding correctly'
            };
        } catch (error) {
            console.error('❌ API Test Failed:', error);
            return {
                success: false,
                error: error.message,
                message: 'API connection failed'
            };
        }
    },

    /**
     * Clear all caches and storage for fresh reload
     */
    clearAllCaches() {
        console.log('🧹 Clearing all caches...');
        
        // Clear ApiService cache
        if (typeof ApiService !== 'undefined') {
            ApiService.clearCache();
        }
        
        // Clear sessionStorage
        sessionStorage.removeItem('runtime_main_api_url');
        sessionStorage.removeItem('runtime_admin_api_url');
        
        console.log('✅ All caches cleared!');
    },

    /**
     * Reset API to defaults
     */
    resetToDefaults() {
        console.log('⚠️ Resetting API to defaults...');
        CONFIG.resetToDefault('main');
        CONFIG.resetToDefault('admin');
        this.clearAllCaches();
        console.log('✅ Reset complete! Page will reload...');
        setTimeout(() => location.reload(), 1000);
    },

    /**
     * Compare current API with expected API
     * @param {string} expectedApi - Expected API URL to compare
     */
    compareApi(expectedApi) {
        const current = CONFIG.getMainApiUrl();
        const match = current === expectedApi;
        
        console.group('🔀 API Comparison');
        console.log('Expected:', expectedApi);
        console.log('Current: ', current);
        console.log('Match:   ', match ? '✅ YES' : '❌ NO');
        console.groupEnd();
        
        return match;
    },

    /**
     * Get cache contents for debugging
     */
    getCacheContents() {
        if (!ApiService || ApiService.cache.size === 0) {
            console.log('📦 Cache is empty');
            return [];
        }
        
        const contents = [];
        for (let [key, value] of ApiService.cache.entries()) {
            contents.push({
                key: key,
                dataSize: JSON.stringify(value.data).length,
                age: `${Math.round((Date.now() - value.timestamp) / 1000)}s`,
                expired: Date.now() - value.timestamp > ApiService.DEFAULT_CACHE_DURATION ? '❌ YES' : '✅ NO'
            });
        }
        
        console.table(contents);
        return contents;
    },

    /**
     * Estimate localStorage size
     * @private
     */
    _estimateStorageSize() {
        let size = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                size += localStorage[key].length + key.length;
            }
        }
        return `${(size / 1024).toFixed(2)} KB`;
    },

    /**
     * Auto-diagnose and suggest fixes
     */
    diagnose() {
        console.group('🏥 Auto-Diagnosis');
        
        const issues = [];
        const fixes = [];
        
        // Check 1: Cache size
        if (ApiService && ApiService.cache.size > 100) {
            issues.push('⚠️ High cache entries (>100)');
            fixes.push('Run: ApiDebug.clearAllCaches()');
        }
        
        // Check 2: Expired cache
        if (ApiService) {
            for (let [_, value] of ApiService.cache.entries()) {
                if (Date.now() - value.timestamp > ApiService.DEFAULT_CACHE_DURATION) {
                    issues.push('⚠️ Expired cache entries exist');
                    fixes.push('Cache will auto-refresh on next request');
                    break;
                }
            }
        }
        
        // Check 3: localStorage size
        const storageSize = this._estimateStorageSize();
        if (storageSize > '1000 KB') {
            issues.push('⚠️ Large localStorage usage');
            fixes.push('Clear unused data from localStorage');
        }
        
        // Check 4: API mismatch
        const mainApi = CONFIG.getMainApiUrl();
        const adminApi = CONFIG.getAdminApiUrl();
        if (!mainApi || !adminApi) {
            issues.push('❌ API URLs not configured');
            fixes.push('Set API URLs in admin settings');
        }
        
        console.log('📋 Issues Found:', issues.length);
        if (issues.length > 0) {
            console.table(issues);
        }
        
        console.log('\n✅ Suggested Fixes:');
        if (fixes.length > 0) {
            console.table(fixes);
        } else {
            console.log('No issues detected!');
        }
        
        console.groupEnd();
        
        return {
            issuesCount: issues.length,
            issues,
            fixes
        };
    }
};

// Expose to window for easy access in console
window.ApiDebug = ApiDebug;

console.log('✅ ApiDebug loaded. Use ApiDebug.diagnose() to check API health');
