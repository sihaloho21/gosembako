/**
 * Admin Referral Transactions Management
 */

let referralTransactions = [];

/**
 * Load and display referral transactions
 */
async function loadReferralTransactions() {
    try {
        const API_URL = await getAdminApiUrl();
        const response = await fetch(`${API_URL}?sheet=referral_transactions`);
        const data = await response.json();
        
        referralTransactions = data || [];
        displayReferralTransactions();
        updateReferralStats();
        
    } catch (error) {
        console.error('Error loading referral transactions:', error);
        showToast('Gagal memuat data transaksi referral', 'error');
    }
}

/**
 * Display transactions in table
 */
function displayReferralTransactions() {
    const tbody = document.getElementById('referral-transactions-table');
    
    if (!referralTransactions || referralTransactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-8 text-center text-gray-500">
                    Belum ada transaksi referral
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort by created_at descending
    const sorted = [...referralTransactions].sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
    });
    
    tbody.innerHTML = sorted.map(tx => {
        const statusBadge = getStatusBadge(tx.status);
        const actionButton = getActionButton(tx);
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                    <span class="font-mono text-sm font-bold text-gray-800">${tx.transaction_id}</span>
                    <div class="text-xs text-gray-500">${formatDate(tx.created_at)}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="font-semibold text-gray-800">${tx.referrer_phone}</div>
                    <div class="text-xs text-gray-500">${tx.referrer_code}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="font-semibold text-gray-800">${tx.referee_name || '-'}</div>
                    <div class="text-xs text-gray-500">${tx.referee_phone}</div>
                </td>
                <td class="px-6 py-4">
                    <span class="font-mono text-sm text-gray-700">${tx.order_id}</span>
                </td>
                <td class="px-6 py-4">
                    <span class="text-green-600 font-semibold">Rp ${parseInt(tx.discount_amount || 0).toLocaleString('id-ID')}</span>
                </td>
                <td class="px-6 py-4">
                    <span class="text-amber-600 font-bold">${parseInt(tx.points_earned || 0).toLocaleString('id-ID')}</span>
                </td>
                <td class="px-6 py-4">
                    ${statusBadge}
                </td>
                <td class="px-6 py-4">
                    ${actionButton}
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Get status badge HTML
 */
function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">Pending</span>',
        'completed': '<span class="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Completed</span>',
        'cancelled': '<span class="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">Cancelled</span>'
    };
    return badges[status] || badges['pending'];
}

/**
 * Get action button HTML
 */
function getActionButton(tx) {
    if (tx.status === 'pending') {
        return `
            <button onclick="completeReferralOrder('${tx.transaction_id}')" 
                class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition">
                ✅ Complete
            </button>
        `;
    } else if (tx.status === 'completed') {
        return `<span class="text-xs text-gray-400">Poin sudah di-credit</span>`;
    } else {
        return `<span class="text-xs text-gray-400">Dibatalkan</span>`;
    }
}

/**
 * Complete referral order and credit points
 */
async function completeReferralOrder(transactionId) {
    if (!confirm('Apakah Anda yakin ingin menyelesaikan transaksi ini dan credit poin ke referrer?')) {
        return;
    }
    
    try {
        showToast('Memproses transaksi...', 'info');
        
        const API_URL = await getAdminApiUrl();
        
        // Get transaction details
        const txResponse = await fetch(`${API_URL}?sheet=referral_transactions&transaction_id=${transactionId}`);
        const transactions = await txResponse.json();
        
        if (!transactions || transactions.length === 0) {
            throw new Error('Transaksi tidak ditemukan');
        }
        
        const transaction = transactions[0];
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        // Update transaction status
        await fetch(`${API_URL}/transaction_id/${transactionId}?sheet=referral_transactions`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: {
                    status: 'completed',
                    completed_at: now
                }
            })
        });
        
        // Get referrer data
        const referrerResponse = await fetch(`${API_URL}?sheet=user_referral&whatsapp=${transaction.referrer_phone}`);
        const referrers = await referrerResponse.json();
        
        if (!referrers || referrers.length === 0) {
            throw new Error('Referrer tidak ditemukan');
        }
        
        const referrer = referrers[0];
        const newTotalPoints = (parseInt(referrer.total_points) || 0) + parseInt(transaction.points_earned);
        const newCompletedReferrals = (parseInt(referrer.completed_referrals) || 0) + 1;
        
        // Update referrer points
        await fetch(`${API_URL}/whatsapp/${transaction.referrer_phone}?sheet=user_referral`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: {
                    total_points: newTotalPoints,
                    completed_referrals: newCompletedReferrals
                }
            })
        });
        
        showToast(`✅ Transaksi completed! ${transaction.points_earned} poin di-credit ke ${transaction.referrer_phone}`, 'success');
        
        // Reload data
        await loadReferralTransactions();
        
    } catch (error) {
        console.error('Error completing transaction:', error);
        showToast('Gagal menyelesaikan transaksi: ' + error.message, 'error');
    }
}

/**
 * Update statistics cards
 */
function updateReferralStats() {
    const totalCount = referralTransactions.length;
    const pendingCount = referralTransactions.filter(tx => tx.status === 'pending').length;
    const completedCount = referralTransactions.filter(tx => tx.status === 'completed').length;
    const totalPoints = referralTransactions
        .filter(tx => tx.status === 'completed')
        .reduce((sum, tx) => sum + parseInt(tx.points_earned || 0), 0);
    
    document.getElementById('ref-total-count').textContent = totalCount;
    document.getElementById('ref-pending-count').textContent = pendingCount;
    document.getElementById('ref-completed-count').textContent = completedCount;
    document.getElementById('ref-total-points').textContent = totalPoints.toLocaleString('id-ID');
}

/**
 * Refresh transactions
 */
async function refreshReferralTransactions() {
    showToast('Memuat ulang data...', 'info');
    await loadReferralTransactions();
    showToast('Data berhasil dimuat ulang', 'success');
}

/**
 * Format date
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Load when section is shown
document.addEventListener('DOMContentLoaded', function() {
    // Hook into showSection function
    const originalShowSection = window.showSection;
    window.showSection = function(section) {
        if (originalShowSection) {
            originalShowSection(section);
        }
        
        if (section === 'referral-transactions') {
            loadReferralTransactions();
        }
    };
});
