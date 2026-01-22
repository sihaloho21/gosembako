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
