// Referral Authentication System
// Use the same API as configured in admin settings
function getSheetAPI() {
    // Get from CONFIG if available, otherwise use default
    return CONFIG && CONFIG.getMainAPI ? CONFIG.getMainAPI() : 'https://sheetdb.io/api/v1/j29539mbwzs2c';
}

// Tab Switching
function switchTab(tab) {
    const loginTab = document.getElementById('tab-login');
    const registerTab = document.getElementById('tab-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (tab === 'login') {
        loginTab.classList.add('bg-green-600', 'text-white');
        loginTab.classList.remove('text-gray-600', 'hover:bg-gray-100');
        registerTab.classList.remove('bg-green-600', 'text-white');
        registerTab.classList.add('text-gray-600', 'hover:bg-gray-100');
        
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        registerTab.classList.add('bg-green-600', 'text-white');
        registerTab.classList.remove('text-gray-600', 'hover:bg-gray-100');
        loginTab.classList.remove('bg-green-600', 'text-white');
        loginTab.classList.add('text-gray-600', 'hover:bg-gray-100');
        
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }
}

// Generate unique referral code
function generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'REF-';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Show loading overlay
function showLoading() {
    document.getElementById('loading-overlay').classList.remove('hidden');
}

// Hide loading overlay
function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
}

// Show error message
function showError(formType, message) {
    const errorDiv = document.getElementById(`${formType}-error`);
    const errorText = errorDiv.querySelector('p');
    errorText.textContent = message;
    errorDiv.classList.remove('hidden');
    
    setTimeout(() => {
        errorDiv.classList.add('hidden');
    }, 5000);
}

// Show success message
function showSuccess(message) {
    const successDiv = document.getElementById('register-success');
    const successText = successDiv.querySelector('p');
    successText.textContent = message;
    successDiv.classList.remove('hidden');
    
    setTimeout(() => {
        successDiv.classList.add('hidden');
    }, 3000);
}

// Normalize phone number
function normalizePhone(phone) {
    let p = phone.replace(/[^0-9]/g, '');
    if (p.startsWith('62')) p = '0' + p.slice(2);
    else if (p.startsWith('8')) p = '0' + p;
    return p;
}

// Handle Login
async function handleLogin(event) {
    event.preventDefault();
    
    const whatsapp = normalizePhone(document.getElementById('login-whatsapp').value);
    const pin = document.getElementById('login-pin').value;
    
    // Validate format
    if (!whatsapp.startsWith('08') || whatsapp.length < 10 || whatsapp.length > 13) {
        showError('login', 'Format nomor WhatsApp tidak valid. Harus dimulai dengan 08 dan 10-13 digit.');
        return;
    }
    
    if (pin.length !== 6 || !/^[0-9]{6}$/.test(pin)) {
        showError('login', 'PIN harus 6 angka.');
        return;
    }
    
    showLoading();
    
    try {
        // Check if user exists
        const SHEET_API = getSheetAPI();
        const response = await fetch(`${SHEET_API}?sheet=user_referral&whatsapp=${whatsapp}`);
        const data = await response.json();
        
        if (!data || data.length === 0) {
            hideLoading();
            showError('login', 'Nomor WhatsApp tidak terdaftar. Silakan daftar terlebih dahulu.');
            return;
        }
        
        const user = data[0];
        
        // Verify PIN
        if (user.pin !== pin) {
            hideLoading();
            showError('login', 'PIN salah. Silakan coba lagi.');
            return;
        }
        
        // Update last login
        const SHEET_API_UPDATE = getSheetAPI();
        await fetch(`${SHEET_API_UPDATE}/whatsapp/${whatsapp}?sheet=user_referral`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: {
                    last_login: new Date().toISOString().slice(0, 19).replace('T', ' ')
                }
            })
        });
        
        // Save session
        sessionStorage.setItem('referral_user', JSON.stringify({
            whatsapp: user.whatsapp,
            nama: user.nama,
            referral_code: user.referral_code
        }));
        
        hideLoading();
        
        // Redirect to referral dashboard
        window.location.href = 'referral.html';
        
    } catch (error) {
        hideLoading();
        console.error('Login error:', error);
        showError('login', 'Terjadi kesalahan. Silakan coba lagi.');
    }
}

// Handle Register
async function handleRegister(event) {
    event.preventDefault();
    
    const whatsapp = normalizePhone(document.getElementById('register-whatsapp').value);
    const nama = document.getElementById('register-nama').value.trim() || '';
    const pin = document.getElementById('register-pin').value;
    const pinConfirm = document.getElementById('register-pin-confirm').value;
    
    // Validate format
    if (!whatsapp.startsWith('08') || whatsapp.length < 10 || whatsapp.length > 13) {
        showError('register', 'Format nomor WhatsApp tidak valid. Harus dimulai dengan 08 dan 10-13 digit.');
        return;
    }
    
    if (pin.length !== 6 || !/^[0-9]{6}$/.test(pin)) {
        showError('register', 'PIN harus 6 angka.');
        return;
    }
    
    if (pin !== pinConfirm) {
        showError('register', 'PIN dan Konfirmasi PIN tidak sama.');
        return;
    }
    
    showLoading();
    
    try {
        // Check if user already exists
        const SHEET_API = getSheetAPI();
        const checkResponse = await fetch(`${SHEET_API}?sheet=user_referral&whatsapp=${whatsapp}`);
        const existingUser = await checkResponse.json();
        
        if (existingUser && existingUser.length > 0) {
            hideLoading();
            showError('register', 'Nomor WhatsApp sudah terdaftar. Silakan login.');
            return;
        }
        
        // Generate referral code
        const referralCode = generateReferralCode();
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        // Create new user
        const newUser = {
            whatsapp: whatsapp,
            pin: pin,
            nama: nama,
            referral_code: referralCode,
            total_referrals: 0,
            completed_referrals: 0,
            total_points: 0,
            created_at: now,
            last_login: now
        };
        
        const SHEET_API_POST = getSheetAPI();
        const response = await fetch(`${SHEET_API_POST}?sheet=user_referral`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: newUser
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to register');
        }
        
        hideLoading();
        
        // Show success message
        showSuccess('Pendaftaran berhasil! Silakan login dengan nomor WhatsApp dan PIN Anda.');
        
        // Clear form
        document.getElementById('register-whatsapp').value = '';
        document.getElementById('register-nama').value = '';
        document.getElementById('register-pin').value = '';
        document.getElementById('register-pin-confirm').value = '';
        
        // Switch to login tab after 2 seconds
        setTimeout(() => {
            switchTab('login');
            // Pre-fill login whatsapp
            document.getElementById('login-whatsapp').value = whatsapp;
        }, 2000);
        
    } catch (error) {
        hideLoading();
        console.error('Register error:', error);
        showError('register', 'Terjadi kesalahan. Silakan coba lagi.');
    }
}

// Check if already logged in
window.addEventListener('DOMContentLoaded', () => {
    const user = sessionStorage.getItem('referral_user');
    if (user) {
        // Already logged in, redirect to dashboard
        window.location.href = 'referral.html';
    }
});
