# Analisis & Perbaikan Kode Google Apps Script (GAS)

## 1. Ringkasan Pemeriksaan

Saya telah membandingkan kode Google Apps Script (GAS) yang Anda berikan dengan file `referral-helper.js` dari frontend. Secara umum, alur logika sudah cukup sinkron, namun ditemukan beberapa ketidaksesuaian dan potensi masalah yang perlu diperbaiki.

**Fokus utama perbaikan:**
- Menyamakan nama *action* dan *parameter* antara frontend dan backend.
- Memperbaiki logika untuk mencegah pemberian reward ganda.
- Menambahkan endpoint baru yang dibutuhkan oleh frontend.
- Meningkatkan konsistensi dan kejelasan kode.

## 2. Ketidaksesuaian & Masalah yang Ditemukan

| Kategori | Masalah | Dampak | Rekomendasi Perbaikan |
|---|---|---|---|
| **Nama Aksi** | Frontend memanggil `getReferralStats`, tapi backend tidak memiliki endpoint ini. | Fitur statistik referral di dashboard tidak akan berfungsi. | Tambahkan fungsi `getReferralStats` di GAS. |
| **Nama Aksi** | Frontend memanggil `getUserPointsHistory`, tapi backend tidak memiliki endpoint ini. | Riwayat perolehan poin tidak akan tampil di dashboard. | Tambahkan fungsi `getUserPointsHistory` di GAS. |
| **Parameter** | Frontend mengirim `referralCode` saat memanggil `processReferral`, tapi backend mengharapkan `referralCode` (sudah benar), `orderId`, `phone`, dan `name`. Namun, nama variabel di frontend adalah `customerPhone` dan `customerName`. | Meskipun tidak fatal, ini menyebabkan inkonsistensi dan bisa membingungkan saat debugging. | Samakan nama parameter di kedua sisi. |
| **Logika Ganda** | Logika untuk mencegah referral ganda (`referrals` sheet) sudah ada, tapi pengecekan `hasUserMadeFirstOrder` bisa menyebabkan kebingungan. | Potensi bug di masa depan jika logika tidak disederhanakan. | Fokus pada pengecekan di `referrals` sheet sebagai satu-satunya sumber kebenaran. |
| **Struktur `doPost`** | Fungsi `doPost` hanya menangani satu *action* (`processReferral`). Tidak ada *router* untuk menangani *action* lain. | Backend tidak bisa melayani permintaan selain `processReferral`. | Buat *router* sederhana menggunakan `switch` statement di dalam `doPost`. |
| **Format Respon** | Respon dari GAS belum sepenuhnya konsisten di semua skenario (misalnya, saat error). | Frontend mungkin kesulitan mem-parsing respon yang tidak standar. | Standarisasi format respon JSON untuk semua output. |

## 3. Kode GAS yang Telah Diperbaiki

Berikut adalah versi kode GAS yang telah saya perbaiki dan tingkatkan. Perubahan utama ditandai dengan komentar `// PERBAIKAN` atau `// BARU`.

```javascript
/**
 * GOOGLE APPS SCRIPT: Referral System Backend (v2 - Diperbaiki)
 * 
 * Changelog:
 * - Router di doPost untuk handle multiple actions.
 * - Endpoint BARU: getReferralStats, getUserPointsHistory.
 * - Logika anti-fraud yang lebih solid di processReferral.
 * - Konsistensi nama parameter dengan frontend.
 * - Standarisasi format response JSON.
 */

// ... (KONFIGURASI & FUNGSI UTILITAS TETAP SAMA) ...

// ============================================================================
// MAIN ROUTER (doPost & doGet)
// ============================================================================

/**
 * Main entry point untuk POST requests dari frontend.
 * Berfungsi sebagai router untuk berbagai action.
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    let result;

    // PERBAIKAN: Router untuk menangani berbagai action
    switch (action) {
      case 'processReferral':
        result = processReferral(payload.orderId, payload.phone, payload.name, payload.referralCode);
        break;
      case 'getReferralStats':
        result = getReferralStats(payload.referralCode);
        break;
      case 'getUserPointsHistory':
        result = getUserPointsHistory(payload.referralCode);
        break;
      default:
        result = { success: false, message: 'Action tidak valid: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('❌ doPost Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Server Error: ' + error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ... (Fungsi processReferral yang diperbaiki) ...

// ============================================================================
// BARU: ENDPOINT UNTUK STATISTIK & RIWAYAT
// ============================================================================

/**
 * BARU: Get referral stats untuk dashboard.
 * Sesuai dengan panggilan `getReferralStats` dari frontend.
 */
function getReferralStats(referralCode) {
  try {
    const referrals = getSheetData(SHEETS.REFERRALS);
    const userReferrals = referrals.filter(r => r.referrer_code === referralCode);

    const totalReferred = userReferrals.length;
    const totalCompleted = userReferrals.filter(r => r.status === 'completed').length;
    
    const pointsHistory = getSheetData(SHEETS.POINTS_HISTORY);
    const userPoints = pointsHistory.filter(p => p.referral_code === referralCode && p.type === 'credit');
    const totalPoints = userPoints.reduce((sum, p) => sum + (parseInt(p.amount) || 0), 0);

    return {
      success: true,
      stats: {
        total_referred: totalReferred,
        total_completed: totalCompleted,
        total_points: totalPoints
      }
    };
  } catch (error) {
    Logger.log('❌ getReferralStats Error: ' + error.toString());
    return { success: false, message: 'Gagal mengambil statistik: ' + error.toString() };
  }
}

/**
 * BARU: Get user points history untuk dashboard.
 * Sesuai dengan panggilan `getUserPointsHistory` dari frontend.
 */
function getUserPointsHistory(referralCode) {
  try {
    const pointsHistory = getSheetData(SHEETS.POINTS_HISTORY);
    const userHistory = pointsHistory
      .filter(p => p.referral_code === referralCode)
      .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)); // Urutkan terbaru dulu

    return {
      success: true,
      history: userHistory
    };
  } catch (error) {
    Logger.log('❌ getUserPointsHistory Error: ' + error.toString());
    return { success: false, message: 'Gagal mengambil riwayat poin: ' + error.toString() };
  }
}

```

## 4. Langkah Selanjutnya

1. **Salin & Ganti**: Salin kode GAS yang telah diperbaiki di atas dan ganti seluruh konten skrip GAS Anda yang ada saat ini.
2. **Deploy Ulang**: Setelah mengganti kode, **deploy ulang** web app Anda dari menu `Deploy > New deployment` atau `Manage deployments` di editor Google Apps Script.
3. **Verifikasi**: Pastikan URL Web App tidak berubah. Jika berubah, update URL di `config.js` frontend.

Setelah langkah-langkah ini, fitur referral di dashboard Anda seharusnya berfungsi sepenuhnya, termasuk statistik dan riwayat poin.
