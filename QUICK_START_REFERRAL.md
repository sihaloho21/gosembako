# Quick Start: Program Referral

**⏱️ Setup Time: 10 menit**

---

## 🚀 Langkah Cepat

### 1. Setup Database (5 menit)

Buka Google Sheets Anda:
```
https://docs.google.com/spreadsheets/d/174qAwA2hddfQOFUFDx7czOtpRlD9WUiiIaf6Yao8WRc/edit
```

Buat **3 sheet baru** dengan nama dan header berikut:

#### Sheet: `users`
```
id | user_id | name | whatsapp_no | referral_code | referrer_code | total_points | created_at
```

#### Sheet: `referrals`
```
id | referral_id | referrer_code | referred_user_id | referred_name | status | reward_points | created_at | completed_at
```

#### Sheet: `orders`
```
id | order_id | user_id | whatsapp_no | order_details | total_amount | payment_method | created_at
```

**⚠️ PENTING:** Nama sheet harus persis seperti di atas (huruf kecil semua).

---

### 2. Test Akses (2 menit)

Buka browser dan coba akses:
```
https://sheetdb.io/api/v1/f1ioa83a268s8?sheet=users
```

Jika berhasil, akan muncul `[]` (array kosong). Jika error 404, cek nama sheet.

---

### 3. Deploy ke Netlify (3 menit)

Kode sudah di-push ke GitHub. Netlify akan auto-deploy dalam beberapa menit.

Cek status deploy di:
```
https://app.netlify.com/sites/[your-site-name]/deploys
```

---

### 4. Test di Production

Setelah deploy selesai, test:

1. **Test Referral Link:**
   ```
   https://[your-site].netlify.app/?ref=TEST001
   ```
   ✅ Welcome banner harus muncul

2. **Test Dashboard:**
   ```
   https://[your-site].netlify.app/referral.html
   ```
   ✅ Halaman dashboard harus load

3. **Test Registration:**
   - Klik "Daftar Sekarang"
   - Isi nama dan WhatsApp
   - Submit
   ✅ Cek Google Sheets → sheet `users` → harus ada data baru

---

## ✅ Checklist

- [ ] Sheet `users` sudah dibuat dengan header yang benar
- [ ] Sheet `referrals` sudah dibuat dengan header yang benar
- [ ] Sheet `orders` sudah dibuat dengan header yang benar
- [ ] Test akses SheetDB berhasil (return `[]`)
- [ ] Deploy Netlify selesai
- [ ] Test referral link di production berhasil
- [ ] Test registration di production berhasil

---

## 🎉 Selesai!

Program referral sudah siap digunakan. Sekarang Anda bisa:

1. **Daftar di dashboard referral** untuk dapat link referral unik
2. **Bagikan link** ke teman/keluarga
3. **Dapatkan 10.000 poin** setiap teman selesai order pertama

---

## 📚 Dokumentasi Lengkap

Untuk detail lebih lanjut, baca:
- `DATABASE_SETUP_REFERRAL.md` - Panduan database detail
- `REFERRAL_IMPLEMENTATION_GUIDE.md` - Panduan implementasi lengkap
- `REFERRAL_ANALYSIS_GAS_VS_SHEETDB.md` - Analisis teknis

---

**Setup by Manus AI**  
**Tanggal: 20 Januari 2026**
