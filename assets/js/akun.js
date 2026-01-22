/**
 * Akun Pengguna - GoSembako
 * Handles user authentication and order history
 */

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
    const loggedInUser = getLoggedInUser();
    
    if (loggedInUser) {
        // User already logged in, show dashboard
        showDashboard(loggedInUser);
    } else {
        // Show login form
        showLogin();
    }
});

/**
 * Show login section
 */
function showLogin() {
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('dashboard-section').classList.add('hidden');
}

/**
 * Show dashboard section
 */
function showDashboard(user) {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    
    // Display user info
    document.getElementById('user-name').textContent = user.nama;
    document.getElementById('user-whatsapp').textContent = `+62 ${user.whatsapp}`;
    
    // Load order history
    loadOrderHistory(user);
}

/**
 * Handle login form submission
 */
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const whatsapp = document.getElementById('login-whatsapp').value.trim();
    const pin = document.getElementById('login-pin').value.trim();
    const loginBtn = document.getElementById('login-btn');
    const errorDiv = document.getElementById('login-error');
    const errorText = document.getElementById('login-error-text');
    
    // Validate input
    if (!whatsapp || !pin) {
        showError('Mohon lengkapi semua field');
        return;
    }
    
    if (pin.length !== 6) {
        showError('PIN harus 6 digit');
        return;
    }
    
    // Show loading state
    loginBtn.disabled = true;
    loginBtn.innerHTML = `
        <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Memproses...</span>
    `;
    errorDiv.classList.add('hidden');
    
    try {
        // Fetch user from API
        const apiUrl = CONFIG.getMainApiUrl();
        const response = await fetch(`${apiUrl}?sheet=users&whatsapp=${whatsapp}`);
        
        if (!response.ok) {
            throw new Error('Gagal terhubung ke server');
        }
        
        const users = await response.json();
        
        // Check if user exists
        if (!users || users.length === 0) {
            showError('Nomor WhatsApp tidak terdaftar');
            resetLoginButton();
            return;
        }
        
        const user = users[0];
        
        // Validate PIN
        if (user.pin !== pin) {
            showError('PIN salah. Silakan coba lagi.');
            resetLoginButton();
            return;
        }
        
        // Check if account is active
        if (user.status && user.status.toLowerCase() !== 'aktif') {
            showError('Akun Anda tidak aktif. Hubungi admin.');
            resetLoginButton();
            return;
        }
        
        // Login successful
        saveLoggedInUser(user);
        showDashboard(user);
        
    } catch (error) {
        console.error('Login error:', error);
        showError('Terjadi kesalahan. Silakan coba lagi.');
        resetLoginButton();
    }
});

/**
 * Show error message
 */
function showError(message) {
    const errorDiv = document.getElementById('login-error');
    const errorText = document.getElementById('login-error-text');
    
    errorText.textContent = message;
    errorDiv.classList.remove('hidden');
}

/**
 * Reset login button to default state
 */
function resetLoginButton() {
    const loginBtn = document.getElementById('login-btn');
    loginBtn.disabled = false;
    loginBtn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
        </svg>
        Masuk
    `;
}

/**
 * Save logged in user to localStorage
 */
function saveLoggedInUser(user) {
    localStorage.setItem('gosembako_user', JSON.stringify({
        id: user.id,
        nama: user.nama,
        whatsapp: user.whatsapp,
        tanggal_daftar: user.tanggal_daftar
    }));
}

/**
 * Get logged in user from localStorage
 */
function getLoggedInUser() {
    const userJson = localStorage.getItem('gosembako_user');
    return userJson ? JSON.parse(userJson) : null;
}

/**
 * Logout user
 */
function logout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        localStorage.removeItem('gosembako_user');
        window.location.reload();
    }
}

/**
 * Load order history for user
 */
async function loadOrderHistory(user) {
    const loadingDiv = document.getElementById('order-loading');
    const emptyDiv = document.getElementById('order-empty');
    const orderList = document.getElementById('order-list');
    
    // Show loading
    loadingDiv.classList.remove('hidden');
    emptyDiv.classList.add('hidden');
    orderList.innerHTML = '';
    
    try {
        const apiUrl = CONFIG.getMainApiUrl();
        
        // Try to fetch by id_pengguna first, fallback to whatsapp
        let response = await fetch(`${apiUrl}?sheet=orders&id_pengguna=${user.id}`);
        
        if (!response.ok) {
            throw new Error('Gagal memuat riwayat pesanan');
        }
        
        let orders = await response.json();
        
        // If no orders found by id_pengguna, try by whatsapp
        if (!orders || orders.length === 0) {
            response = await fetch(`${apiUrl}?sheet=orders&whatsapp=${user.whatsapp}`);
            orders = await response.json();
        }
        
        // Hide loading
        loadingDiv.classList.add('hidden');
        
        // Check if orders exist
        if (!orders || orders.length === 0) {
            emptyDiv.classList.remove('hidden');
            return;
        }
        
        // Sort orders by date (newest first)
        orders.sort((a, b) => {
            const dateA = new Date(a.tanggal_pesanan || a.timestamp || 0);
            const dateB = new Date(b.tanggal_pesanan || b.timestamp || 0);
            return dateB - dateA;
        });
        
        // Display orders
        orders.forEach(order => {
            const orderCard = createOrderCard(order);
            orderList.appendChild(orderCard);
        });
        
    } catch (error) {
        console.error('Error loading order history:', error);
        loadingDiv.classList.add('hidden');
        orderList.innerHTML = `
            <div class="text-center py-8 text-red-600">
                <svg class="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="text-sm">Gagal memuat riwayat pesanan</p>
                <button onclick="location.reload()" class="mt-3 text-green-600 hover:underline text-sm font-bold">Coba Lagi</button>
            </div>
        `;
    }
}

/**
 * Create order card element
 */
function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'border border-gray-200 rounded-xl p-4 hover:border-green-300 transition';
    
    // Format date
    const orderDate = formatDate(order.tanggal_pesanan || order.timestamp);
    
    // Format price
    const totalBayar = formatCurrency(order.total_bayar || order.total || 0);
    
    // Get status badge
    const statusBadge = getStatusBadge(order.status_pesanan || order.status || 'Menunggu Konfirmasi');
    
    card.innerHTML = `
        <div class="flex justify-between items-start mb-3">
            <div>
                <p class="text-xs text-gray-500 mb-1">${orderDate}</p>
                <p class="font-bold text-gray-800">Order ID: <span class="text-green-600">${order.id_pesanan || order.order_id || 'N/A'}</span></p>
            </div>
            ${statusBadge}
        </div>
        
        <div class="border-t border-gray-100 pt-3 space-y-2">
            <div class="flex justify-between text-sm">
                <span class="text-gray-600">Produk:</span>
                <span class="font-semibold text-gray-800 text-right">${order.produk || order.items || 'N/A'}</span>
            </div>
            <div class="flex justify-between text-sm">
                <span class="text-gray-600">Total Bayar:</span>
                <span class="font-bold text-green-600">${totalBayar}</span>
            </div>
            <div class="flex justify-between text-sm">
                <span class="text-gray-600">Pembayaran:</span>
                <span class="font-semibold text-gray-800">${order.metode_pembayaran || order.payment_method || 'N/A'}</span>
            </div>
            <div class="flex justify-between text-sm">
                <span class="text-gray-600">Pengiriman:</span>
                <span class="font-semibold text-gray-800">${order.metode_pengiriman || order.shipping_method || 'N/A'}</span>
            </div>
        </div>
        
        <div class="mt-4 pt-3 border-t border-gray-100">
            <a href="index.html" class="block w-full text-center bg-green-50 hover:bg-green-100 text-green-700 font-bold py-2 rounded-lg transition text-sm">
                Belanja Lagi
            </a>
        </div>
    `;
    
    return card;
}

/**
 * Get status badge HTML
 */
function getStatusBadge(status) {
    const statusMap = {
        'Menunggu Konfirmasi': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Menunggu' },
        'Diproses': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Diproses' },
        'Dikirim': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Dikirim' },
        'Selesai': { bg: 'bg-green-100', text: 'text-green-700', label: 'Selesai' },
        'Dibatalkan': { bg: 'bg-red-100', text: 'text-red-700', label: 'Dibatalkan' }
    };
    
    const statusInfo = statusMap[status] || statusMap['Menunggu Konfirmasi'];
    
    return `
        <span class="${statusInfo.bg} ${statusInfo.text} text-xs font-bold px-3 py-1 rounded-full">
            ${statusInfo.label}
        </span>
    `;
}

/**
 * Format date to Indonesian format
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) return 'N/A';
    
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return date.toLocaleDateString('id-ID', options);
}

/**
 * Format currency to Indonesian Rupiah
 */
function formatCurrency(amount) {
    const number = parseInt(amount) || 0;
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
}

/**
 * Show register info (placeholder)
 */
function showRegisterInfo() {
    alert('Untuk mendaftar, silakan hubungi admin GoSembako melalui WhatsApp.\n\nAnda akan diberikan akun dengan nomor WhatsApp dan PIN untuk login.');
}


/**
 * ========================================
 * NEW FEATURES: Registration, Forgot PIN, Edit Profile, Tracking, Loyalty
 * ========================================
 */

/**
 * Show registration form
 */
function showRegister() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('register-section').classList.remove('hidden');
    document.getElementById('forgot-pin-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.add('hidden');
}

/**
 * Show forgot PIN form
 */
function showForgotPIN() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('register-section').classList.add('hidden');
    document.getElementById('forgot-pin-section').classList.remove('hidden');
    document.getElementById('dashboard-section').classList.add('hidden');
}

/**
 * Handle registration form submission
 */
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value.trim();
    const whatsapp = document.getElementById('register-whatsapp').value.trim();
    const pin = document.getElementById('register-pin').value.trim();
    const pinConfirm = document.getElementById('register-pin-confirm').value.trim();
    
    const errorDiv = document.getElementById('register-error');
    const errorText = document.getElementById('register-error-text');
    const successDiv = document.getElementById('register-success');
    const registerBtn = document.getElementById('register-btn');
    
    // Hide messages
    errorDiv.classList.add('hidden');
    successDiv.classList.add('hidden');
    
    // Validate name (same as login validation)
    const nameWithoutSpaces = name.replace(/\s/g, '');
    if (nameWithoutSpaces.length < 4) {
        errorText.textContent = 'Masukkan Nama Lengkap';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    // Check name patterns
    const nameLower = nameWithoutSpaces.toLowerCase();
    const invalidNamePatterns = [
        /^(.)\1{3,}$/,
        /^(.{2})\1{2,}$/,
        /^(.{3})\1{2,}$/,
        /^([a-z])([a-z])\1\2{2,}$/,
    ];
    
    for (const pattern of invalidNamePatterns) {
        if (pattern.test(nameLower)) {
            errorText.textContent = 'Masukkan Nama Lengkap';
            errorDiv.classList.remove('hidden');
            return;
        }
    }
    
    // Validate WhatsApp
    const cleanPhone = whatsapp.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
        errorText.textContent = 'Nomor WhatsApp tidak valid';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    // Check phone patterns
    const invalidPhonePatterns = [
        /^(\d)\1{9,}$/,
        /^08(\d)\1{8,}$/,
        /^(\d{2})\1{4,}$/,
        /^(\d{3})\1{3,}$/
    ];
    
    for (const pattern of invalidPhonePatterns) {
        if (pattern.test(cleanPhone)) {
            errorText.textContent = 'Nomor WhatsApp tidak valid';
            errorDiv.classList.remove('hidden');
            return;
        }
    }
    
    // Validate PIN
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
        errorText.textContent = 'PIN harus 6 digit angka';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    if (pin !== pinConfirm) {
        errorText.textContent = 'PIN tidak cocok';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    // Show loading
    registerBtn.disabled = true;
    registerBtn.innerHTML = '<svg class="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
    
    try {
        const apiUrl = CONFIG.getMainApiUrl();
        
        // Check if WhatsApp already registered
        const checkResponse = await fetch(`${apiUrl}?sheet=users&whatsapp=${whatsapp}`);
        const existingUsers = await checkResponse.json();
        
        if (existingUsers && existingUsers.length > 0) {
            errorText.textContent = 'Nomor WhatsApp sudah terdaftar';
            errorDiv.classList.remove('hidden');
            registerBtn.disabled = false;
            registerBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg> Daftar';
            return;
        }
        
        // Generate user ID
        const userId = `USR-${Date.now().toString().slice(-6)}`;
        const today = new Date().toISOString().split('T')[0];
        
        // Create new user
        const createResponse = await fetch(`${apiUrl}?sheet=users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: userId,
                nama: name,
                whatsapp: whatsapp,
                pin: pin,
                tanggal_daftar: today,
                status: 'aktif'
            })
        });
        
        if (!createResponse.ok) {
            throw new Error('Gagal mendaftar');
        }
        
        // Show success
        successDiv.classList.remove('hidden');
        
        // Reset form
        document.getElementById('register-form').reset();
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
            showLogin();
        }, 2000);
        
    } catch (error) {
        console.error('Registration error:', error);
        errorText.textContent = 'Terjadi kesalahan. Silakan coba lagi.';
        errorDiv.classList.remove('hidden');
    } finally {
        registerBtn.disabled = false;
        registerBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg> Daftar';
    }
});

/**
 * Handle forgot PIN form submission
 */
document.getElementById('forgot-pin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const whatsapp = document.getElementById('forgot-whatsapp').value.trim();
    const errorDiv = document.getElementById('forgot-error');
    const errorText = document.getElementById('forgot-error-text');
    const forgotBtn = document.getElementById('forgot-btn');
    
    errorDiv.classList.add('hidden');
    
    // Show loading
    forgotBtn.disabled = true;
    forgotBtn.innerHTML = '<svg class="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
    
    try {
        const apiUrl = CONFIG.getMainApiUrl();
        const response = await fetch(`${apiUrl}?sheet=users&whatsapp=${whatsapp}`);
        const users = await response.json();
        
        if (!users || users.length === 0) {
            errorText.textContent = 'Nomor WhatsApp tidak terdaftar';
            errorDiv.classList.remove('hidden');
            forgotBtn.disabled = false;
            forgotBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg> Kirim Kode Verifikasi';
            return;
        }
        
        // Simulate sending verification code
        alert(`Kode verifikasi telah dikirim ke WhatsApp +62${whatsapp}.\n\nUntuk sementara, hubungi admin untuk reset PIN.`);
        
        // Redirect to WhatsApp admin
        window.open(`https://wa.me/628993370200?text=Halo, saya ingin reset PIN akun saya. Nomor WhatsApp: ${whatsapp}`, '_blank');
        
        // Back to login
        setTimeout(() => {
            showLogin();
        }, 1000);
        
    } catch (error) {
        console.error('Forgot PIN error:', error);
        errorText.textContent = 'Terjadi kesalahan. Silakan coba lagi.';
        errorDiv.classList.remove('hidden');
    } finally {
        forgotBtn.disabled = false;
        forgotBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg> Kirim Kode Verifikasi';
    }
});

/**
 * Open edit profile modal
 */
function openEditProfile() {
    const user = getLoggedInUser();
    if (!user) return;
    
    // Populate form
    document.getElementById('edit-name').value = user.nama;
    
    // Clear PIN fields
    document.getElementById('edit-old-pin').value = '';
    document.getElementById('edit-new-pin').value = '';
    document.getElementById('edit-confirm-pin').value = '';
    
    // Hide error
    document.getElementById('edit-error').classList.add('hidden');
    
    // Show modal
    document.getElementById('edit-profile-modal').classList.remove('hidden');
}

/**
 * Close edit profile modal
 */
function closeEditProfile() {
    document.getElementById('edit-profile-modal').classList.add('hidden');
}

/**
 * Handle edit profile form submission
 */
document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const user = getLoggedInUser();
    if (!user) return;
    
    const name = document.getElementById('edit-name').value.trim();
    const oldPin = document.getElementById('edit-old-pin').value.trim();
    const newPin = document.getElementById('edit-new-pin').value.trim();
    const confirmPin = document.getElementById('edit-confirm-pin').value.trim();
    
    const errorDiv = document.getElementById('edit-error');
    const errorText = document.getElementById('edit-error-text');
    const saveBtn = document.getElementById('edit-save-btn');
    
    errorDiv.classList.add('hidden');
    
    // Validate name
    const nameWithoutSpaces = name.replace(/\s/g, '');
    if (nameWithoutSpaces.length < 4) {
        errorText.textContent = 'Masukkan Nama Lengkap';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    // If changing PIN, validate
    if (oldPin || newPin || confirmPin) {
        if (!oldPin || !newPin || !confirmPin) {
            errorText.textContent = 'Lengkapi semua field PIN';
            errorDiv.classList.remove('hidden');
            return;
        }
        
        if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
            errorText.textContent = 'PIN baru harus 6 digit angka';
            errorDiv.classList.remove('hidden');
            return;
        }
        
        if (newPin !== confirmPin) {
            errorText.textContent = 'PIN baru tidak cocok';
            errorDiv.classList.remove('hidden');
            return;
        }
    }
    
    // Show loading
    saveBtn.disabled = true;
    saveBtn.textContent = 'Menyimpan...';
    
    try {
        const apiUrl = CONFIG.getMainApiUrl();
        
        // Fetch current user data to verify old PIN
        const response = await fetch(`${apiUrl}?sheet=users&id=${user.id}`);
        const users = await response.json();
        
        if (!users || users.length === 0) {
            throw new Error('User not found');
        }
        
        const currentUser = users[0];
        
        // If changing PIN, verify old PIN
        if (oldPin) {
            if (currentUser.pin !== oldPin) {
                errorText.textContent = 'PIN lama salah';
                errorDiv.classList.remove('hidden');
                saveBtn.disabled = false;
                saveBtn.textContent = 'Simpan';
                return;
            }
        }
        
        // Update user data
        const updateData = {
            nama: name
        };
        
        if (newPin) {
            updateData.pin = newPin;
        }
        
        const updateResponse = await fetch(`${apiUrl}/id/${user.id}?sheet=users`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        if (!updateResponse.ok) {
            throw new Error('Failed to update');
        }
        
        // Update localStorage
        user.nama = name;
        saveLoggedInUser(user);
        
        // Update display
        document.getElementById('user-name').textContent = name;
        
        // Close modal
        closeEditProfile();
        
        alert('Profil berhasil diperbarui!');
        
    } catch (error) {
        console.error('Edit profile error:', error);
        errorText.textContent = 'Terjadi kesalahan. Silakan coba lagi.';
        errorDiv.classList.remove('hidden');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Simpan';
    }
});

/**
 * Open order tracking modal
 */
function openOrderTracking(order) {
    // Populate order info
    document.getElementById('tracking-order-id').textContent = order.id_pesanan || order.order_id || 'N/A';
    document.getElementById('tracking-order-date').textContent = formatDate(order.tanggal_pesanan || order.timestamp);
    document.getElementById('tracking-products').textContent = order.produk || order.items || 'N/A';
    document.getElementById('tracking-total').textContent = formatCurrency(order.total_bayar || order.total || 0);
    document.getElementById('tracking-payment').textContent = order.metode_pembayaran || order.payment_method || 'N/A';
    document.getElementById('tracking-shipping').textContent = order.metode_pengiriman || order.shipping_method || 'N/A';
    
    // Set status badge
    const status = order.status_pesanan || order.status || 'Menunggu Konfirmasi';
    const statusBadge = document.getElementById('tracking-status-badge');
    statusBadge.textContent = status;
    statusBadge.className = getStatusClass(status);
    
    // Create timeline
    const timeline = document.getElementById('tracking-timeline');
    timeline.innerHTML = createTimeline(status);
    
    // Show modal
    document.getElementById('order-tracking-modal').classList.remove('hidden');
}

/**
 * Close order tracking modal
 */
function closeOrderTracking() {
    document.getElementById('order-tracking-modal').classList.add('hidden');
}

/**
 * Create timeline based on status
 */
function createTimeline(status) {
    const statuses = [
        { name: 'Menunggu Konfirmasi', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
        { name: 'Diproses', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
        { name: 'Dikirim', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' },
        { name: 'Selesai', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }
    ];
    
    const currentIndex = statuses.findIndex(s => s.name === status);
    
    return statuses.map((s, index) => {
        const isActive = index <= currentIndex;
        const isLast = index === statuses.length - 1;
        
        return `
            <div class="flex gap-4">
                <div class="flex flex-col items-center">
                    <div class="${isActive ? 'bg-green-500' : 'bg-gray-300'} w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${s.icon}"></path>
                        </svg>
                    </div>
                    ${!isLast ? `<div class="${isActive ? 'bg-green-500' : 'bg-gray-300'} w-0.5 h-12"></div>` : ''}
                </div>
                <div class="flex-1 ${!isLast ? 'pb-4' : ''}">
                    <p class="font-bold ${isActive ? 'text-gray-800' : 'text-gray-400'}">${s.name}</p>
                    <p class="text-xs text-gray-500">${isActive && index === currentIndex ? 'Status saat ini' : ''}</p>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Get status class for badge
 */
function getStatusClass(status) {
    const statusMap = {
        'Menunggu Konfirmasi': 'bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full',
        'Diproses': 'bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full',
        'Dikirim': 'bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full',
        'Selesai': 'bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full',
        'Dibatalkan': 'bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full'
    };
    
    return statusMap[status] || statusMap['Menunggu Konfirmasi'];
}

/**
 * Open loyalty modal
 */
function openLoyaltyModal() {
    // For now, just show the modal with dummy points
    // Logic will be implemented later
    const points = parseInt(document.getElementById('loyalty-points').textContent) || 0;
    document.getElementById('loyalty-modal-points').textContent = points;
    
    document.getElementById('loyalty-modal').classList.remove('hidden');
}

/**
 * Close loyalty modal
 */
function closeLoyaltyModal() {
    document.getElementById('loyalty-modal').classList.add('hidden');
}

/**
 * Redeem reward (placeholder)
 */
function redeemReward(points, rewardName) {
    const userPoints = parseInt(document.getElementById('loyalty-points').textContent) || 0;
    
    if (userPoints < points) {
        alert(`Poin Anda tidak cukup.\n\nDibutuhkan: ${points} poin\nPoin Anda: ${userPoints} poin`);
        return;
    }
    
    // Placeholder - logic will be implemented later
    alert(`Fitur penukaran reward akan segera hadir!\n\nReward: ${rewardName}\nPoin: ${points}`);
}

/**
 * Update order card to add tracking button
 */
const originalCreateOrderCard = createOrderCard;
createOrderCard = function(order) {
    const card = originalCreateOrderCard(order);
    
    // Add click event to open tracking
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
        openOrderTracking(order);
    });
    
    return card;
};
