# Instruksi Mode Pengujian Fitur Referral

Dokumen ini menjelaskan cara mengaktifkan dan menggunakan mode pengujian untuk fitur referral, di mana validasi "pembelian pertama" dihilangkan.

## 1. Ringkasan Perubahan

Sesuai permintaan Anda, saya telah memodifikasi kode Google Apps Script (GAS) untuk **menonaktifkan pengecekan pembelian pertama**. Ini berarti **setiap pembelian** yang dilakukan oleh pengguna yang direferensikan akan memicu pemberian poin reward kepada referrer.

Perubahan ini hanya dilakukan di sisi backend (Google Apps Script). **Tidak ada perubahan yang diperlukan pada file `referral-helper.js`** atau kode frontend lainnya.

## 2. File yang Disediakan

Saya telah membuat file baru untuk mode pengujian ini:

- **`REFERRAL_BACKEND_GAS_TESTING.gs`**: Versi kode backend yang telah dimodifikasi untuk pengujian. Validasi pembelian pertama telah dinonaktifkan di file ini.

File produksi asli tetap tersedia:
- **`REFERRAL_BACKEND_GAS_FIXED.gs`**: Versi kode backend standar dengan validasi pembelian pertama yang aktif.

## 3. Cara Mengaktifkan Mode Pengujian

Ikuti langkah-langkah berikut untuk menggunakan skrip pengujian:

1.  **Buka Editor Google Apps Script** proyek Anda.
2.  **Hapus semua kode** yang ada di editor saat ini.
3.  **Salin seluruh konten** dari file **`REFERRAL_BACKEND_GAS_TESTING.gs`** yang saya lampirkan.
4.  **Tempelkan** kode tersebut ke dalam editor GAS Anda.
5.  **Deploy Ulang Proyek**:
    - Klik `Deploy` > `New deployment` (atau `Manage deployments` untuk memperbarui yang sudah ada).
    - Pastikan Anda mendeploynya sebagai **Web App** dengan akses `Anyone`.

Setelah Anda melakukan deploy ulang, sistem referral akan berjalan dalam **mode pengujian**. Setiap kali Anda mensimulasikan pesanan dari pengguna yang direferensikan, referrer akan menerima poin, terlepas dari apakah itu pembelian pertama atau bukan.

## 4. Cara Kembali ke Mode Produksi

Setelah selesai melakukan pengujian, sangat penting untuk mengembalikan sistem ke mode produksi agar poin tidak diberikan secara berlebihan.

1.  **Buka kembali Editor Google Apps Script** Anda.
2.  **Hapus semua kode** mode pengujian yang ada di editor.
3.  **Salin seluruh konten** dari file produksi **`REFERRAL_BACKEND_GAS_FIXED.gs`**.
4.  **Tempelkan** kode tersebut ke dalam editor.
5.  **Deploy Ulang Proyek** seperti yang Anda lakukan pada langkah 3.

Dengan ini, sistem referral Anda akan kembali normal, di mana poin hanya akan diberikan untuk pembelian pertama.

## 5. Detail Teknis Perubahan

Di dalam file `REFERRAL_BACKEND_GAS_TESTING.gs`, saya telah mengomentari blok kode berikut di dalam fungsi `processReferral`:

```javascript
// ===================================================================
// MODIFIKASI: Validasi pembelian pertama/status 'completed' dihilangkan untuk testing.
// Kode di bawah ini akan selalu berjalan untuk setiap pembelian oleh referred user.
/*
const referralsSheet = getSheetData(SHEETS.REFERRALS);
const existingReferral = referralsSheet.find(r => 
    normalizePhone(r.referred_phone) === normalizePhone(customerPhone) && 
    r.referrer_code === buyer.referrer_id
);

if (existingReferral && existingReferral.status === 'completed') {
    Logger.log('ℹ️ Validasi pembelian pertama di-skip untuk testing.');
    // return { success: true, message: 'Reward referral sudah pernah diberikan.', referralProcessed: false };
}
*/
// ===================================================================
```

Dengan mengomentari blok ini, skrip tidak akan lagi memeriksa apakah referral sudah pernah `completed` dan akan langsung melanjutkan ke proses pemberian poin.
