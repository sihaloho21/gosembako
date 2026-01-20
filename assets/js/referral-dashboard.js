/**
 * Referral Dashboard
 * Handles display of referral statistics, link sharing, and history
 */

let currentUser = null;
let referralLink = '';

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', async () => {
    await initializeDashboard();
});

/**
 * Initialize referral dashboard
 */
async function initializeDashboard() {
    try {
        // Check if user is "logged in" (has user data in localStorage)
        const userData = getUserData();
        
        if (!userData) {
            // User not registered yet - show registration prompt
            showRegistrationPrompt();
            return;
        }

        currentUser = userData;
        
        // Load dashboard data
        await loadReferralStats();
        await loadReferralHistory();
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showError('Gagal memuat data. Silakan refresh halaman.');
    }
}

/**
 * Get user data from localStorage
 * @returns {Object|null} User data or null if not found
 */
function getUserData() {
    const userDataStr = localStorage.getItem('sembako_user_data');
    if (!userDataStr) return null;
    
    try {
        return JSON.parse(userDataStr);
    } catch (e) {
        return null;
    }
}

/**
 * Show registration prompt if user not logged in
 */
function showRegistrationPrompt() {
    const container = document.querySelector('.referral-container');
    container.innerHTML = `
        <div class="referral-link-section text-center">
            <div class="text-6xl mb-6">🎁</div>
            <h2 class="text-2xl mb-4">Mulai Program Referral</h2>
            <p class="text-gray-600 mb-6">Untuk menggunakan program referral, silakan daftarkan diri Anda terlebih dahulu.</p>
            <button onclick="showRegistrationForm()" class="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition">
                Daftar Sekarang
            </button>
            <p class="mt-4 text-sm text-gray-500">Sudah pernah belanja? <a href="#" onclick="showLoginForm()" class="text-purple-600 underline">Login di sini</a></p>
        </div>
    `;
}

/**
 * Show registration form
 */
function showRegistrationForm() {
    const container = document.querySelector('.referral-container');
    const referrerCode = localStorage.getItem('sembako_referral_code') || '';
    const referrerName = localStorage.getItem('sembako_referrer_name') || '';
    
    let referrerInfo = '';
    if (referrerCode && referrerName) {
        referrerInfo = `
            <div class="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <p class="text-purple-800">
                    <i class="fas fa-gift"></i> Anda diajak oleh <strong>${referrerName}</strong>. 
                    Dapatkan diskon 10% untuk pesanan pertama!
                </p>
            </div>
        `;
    }
    
    container.innerHTML = `
        <div class="referral-link-section max-w-md mx-auto">
            <h2 class="text-2xl mb-6 text-center">Daftar Program Referral</h2>
            ${referrerInfo}
            <form id="registration-form" onsubmit="handleRegistration(event)">
                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2">Nama Lengkap</label>
                    <input type="text" id="reg-name" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                           placeholder="Masukkan nama lengkap">
                </div>
                <div class="mb-6">
                    <label class="block text-gray-700 font-semibold mb-2">Nomor WhatsApp</label>
                    <input type="tel" id="reg-whatsapp" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                           placeholder="628123456789" pattern="[0-9]{10,15}">
                    <p class="text-sm text-gray-500 mt-1">Format: 628xxx (dengan kode negara, tanpa +)</p>
                </div>
                <button type="submit" 
                        class="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition">
                    Daftar Sekarang
                </button>
            </form>
            <p class="mt-4 text-center text-sm text-gray-500">
                Sudah pernah daftar? <a href="#" onclick="showLoginForm()" class="text-purple-600 underline">Login di sini</a>
            </p>
        </div>
    `;
}

/**
 * Show login form (simple version using WhatsApp number)
 */
function showLoginForm() {
    const container = document.querySelector('.referral-container');
    container.innerHTML = `
        <div class="referral-link-section max-w-md mx-auto">
            <h2 class="text-2xl mb-6 text-center">Login Program Referral</h2>
            <form id="login-form" onsubmit="handleLogin(event)">
                <div class="mb-6">
                    <label class="block text-gray-700 font-semibold mb-2">Nomor WhatsApp</label>
                    <input type="tel" id="login-whatsapp" required 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                           placeholder="628123456789" pattern="[0-9]{10,15}">
                    <p class="text-sm text-gray-500 mt-1">Masukkan nomor WhatsApp yang terdaftar</p>
                </div>
                <button type="submit" 
                        class="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition">
                    Login
                </button>
            </form>
            <p class="mt-4 text-center text-sm text-gray-500">
                Belum punya akun? <a href="#" onclick="showRegistrationForm()" class="text-purple-600 underline">Daftar di sini</a>
            </p>
        </div>
    `;
}

/**
 * Handle user registration
 */
async function handleRegistration(event) {
    event.preventDefault();
    
    const name = document.getElementById('reg-name').value.trim();
    const whatsappNo = document.getElementById('reg-whatsapp').value.trim();
    const referrerCode = localStorage.getItem('sembako_referral_code') || '';
    
    try {
        // Show loading
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Mendaftar...';
        
        // Generate user ID and referral code
        const userId = 'USR-' + Date.now();
        const referralCode = generateReferralCode(name);
        
        // Check if WhatsApp number already exists
        const apiUrl = CONFIG.getMainApiUrl();
        const checkResponse = await fetch(`${apiUrl}/search?sheet=users&whatsapp_no=${whatsappNo}`);
        const existingUsers = await checkResponse.json();
        
        if (existingUsers && existingUsers.length > 0) {
            alert('Nomor WhatsApp sudah terdaftar. Silakan login.');
            showLoginForm();
            return;
        }
        
        // Create new user
        const newUser = {
            user_id: userId,
            name: name,
            whatsapp_no: whatsappNo,
            referral_code: referralCode,
            referrer_code: referrerCode,
            total_points: 0,
            created_at: new Date().toISOString()
        };
        
        // Save to database
        await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sheet: 'users', data: newUser })
        });
        
        // If user came from referral, create referral record
        if (referrerCode) {
            const referralId = 'REF-' + Date.now();
            const referralData = {
                referral_id: referralId,
                referrer_code: referrerCode,
                referred_user_id: userId,
                referred_name: name,
                status: 'pending',
                reward_points: 10000,
                created_at: new Date().toISOString(),
                completed_at: ''
            };
            
            await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sheet: 'referrals', data: referralData })
            });
            
            // Clear referral code from localStorage
            localStorage.removeItem('sembako_referral_code');
            localStorage.removeItem('sembako_referrer_name');
        }
        
        // Save user data to localStorage
        localStorage.setItem('sembako_user_data', JSON.stringify(newUser));
        
        // Reload dashboard
        location.reload();
        
    } catch (error) {
        console.error('Registration error:', error);
        alert('Gagal mendaftar. Silakan coba lagi.');
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Daftar Sekarang';
    }
}

/**
 * Handle user login
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const whatsappNo = document.getElementById('login-whatsapp').value.trim();
    
    try {
        // Show loading
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Login...';
        
        // Find user by WhatsApp number
        const apiUrl = CONFIG.getMainApiUrl();
        const response = await fetch(`${apiUrl}/search?sheet=users&whatsapp_no=${whatsappNo}`);
        const users = await response.json();
        
        if (!users || users.length === 0) {
            alert('Nomor WhatsApp tidak ditemukan. Silakan daftar terlebih dahulu.');
            showRegistrationForm();
            return;
        }
        
        const userData = users[0];
        
        // Save user data to localStorage
        localStorage.setItem('sembako_user_data', JSON.stringify(userData));
        
        // Reload dashboard
        location.reload();
        
    } catch (error) {
        console.error('Login error:', error);
        alert('Gagal login. Silakan coba lagi.');
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
}

/**
 * Generate referral code from name
 * @param {string} name - User name
 * @returns {string} Referral code
 */
function generateReferralCode(name) {
    const prefix = name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return prefix + random;
}

/**
 * Load referral statistics
 */
async function loadReferralStats() {
    try {
        const apiUrl = CONFIG.getMainApiUrl();
        
        // Set referral link
        referralLink = `${window.location.origin}/?ref=${currentUser.referral_code}`;
        document.getElementById('referral-link').value = referralLink;
        
        // Fetch referral data
        const response = await fetch(`${apiUrl}/search?sheet=referrals&referrer_code=${currentUser.referral_code}`);
        const referrals = await response.json();
        
        // Calculate stats
        const totalReferrals = referrals ? referrals.length : 0;
        const completedReferrals = referrals ? referrals.filter(r => r.status === 'completed').length : 0;
        const totalPoints = currentUser.total_points || 0;
        
        // Update UI
        document.getElementById('total-referrals').textContent = totalReferrals;
        document.getElementById('completed-referrals').textContent = completedReferrals;
        document.getElementById('total-points').textContent = totalPoints.toLocaleString('id-ID');
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

/**
 * Load referral history
 */
async function loadReferralHistory() {
    try {
        const apiUrl = CONFIG.getMainApiUrl();
        const response = await fetch(`${apiUrl}/search?sheet=referrals&referrer_code=${currentUser.referral_code}`);
        const referrals = await response.json();
        
        const container = document.getElementById('history-container');
        
        if (!referrals || referrals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <p>Belum ada referral. Mulai ajak teman Anda sekarang!</p>
                </div>
            `;
            return;
        }
        
        // Sort by created_at (newest first)
        referrals.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Build table
        let tableHTML = `
            <table class="history-table">
                <thead>
                    <tr>
                        <th>Nama Teman</th>
                        <th>Tanggal Daftar</th>
                        <th>Status</th>
                        <th>Poin</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        referrals.forEach(ref => {
            const date = new Date(ref.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
            
            const statusClass = ref.status === 'completed' ? 'completed' : 'pending';
            const statusText = ref.status === 'completed' ? 'Berhasil' : 'Menunggu';
            const points = ref.status === 'completed' ? ref.reward_points.toLocaleString('id-ID') : '-';
            
            tableHTML += `
                <tr>
                    <td>${ref.referred_name}</td>
                    <td>${date}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${points}</td>
                </tr>
            `;
        });
        
        tableHTML += `
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
        
    } catch (error) {
        console.error('Error loading history:', error);
        document.getElementById('history-container').innerHTML = `
            <p class="text-center text-red-500">Gagal memuat riwayat. Silakan refresh halaman.</p>
        `;
    }
}

/**
 * Copy referral link to clipboard
 */
function copyReferralLink() {
    const input = document.getElementById('referral-link');
    input.select();
    input.setSelectionRange(0, 99999); // For mobile
    
    navigator.clipboard.writeText(input.value).then(() => {
        // Show success message
        const successMsg = document.getElementById('copy-success');
        successMsg.style.display = 'flex';
        
        setTimeout(() => {
            successMsg.style.display = 'none';
        }, 3000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Gagal menyalin link. Silakan salin manual.');
    });
}

/**
 * Share to WhatsApp
 */
function shareToWhatsApp() {
    const message = `Halo! 🎁 Yuk belanja sembako di Paket Sembako dan dapatkan diskon 10% untuk pesanan pertama kamu! Gunakan link referral saya: ${referralLink}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

/**
 * Share to Facebook
 */
function shareToFacebook() {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
    window.open(url, '_blank', 'width=600,height=400');
}

/**
 * Share to Twitter
 */
function shareToTwitter() {
    const text = `Belanja sembako hemat di Paket Sembako! Dapatkan diskon 10% dengan link referral saya 🎁`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`;
    window.open(url, '_blank', 'width=600,height=400');
}

/**
 * Show error message
 */
function showError(message) {
    const container = document.querySelector('.referral-container');
    container.innerHTML = `
        <div class="referral-link-section text-center">
            <div class="text-6xl mb-6">⚠️</div>
            <h2 class="text-2xl mb-4">Terjadi Kesalahan</h2>
            <p class="text-gray-600 mb-6">${message}</p>
            <button onclick="location.reload()" class="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition">
                Refresh Halaman
            </button>
        </div>
    `;
}
