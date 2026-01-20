# Setup Database untuk Program Referral

**Tanggal:** 20 Januari 2026  
**Untuk:** Paket Sembako - Program Referral MVP

---

## Langkah 1: Buka Google Sheets Anda

Buka spreadsheet yang terhubung dengan SheetDB:
**URL:** https://docs.google.com/spreadsheets/d/174qAwA2hddfQOFUFDx7czOtpRlD9WUiiIaf6Yao8WRc/edit

---

## Langkah 2: Buat Sheet Baru - `users`

Jika belum ada sheet `users`, buat sheet baru dengan nama **`users`** (huruf kecil semua).

### Kolom-kolom yang diperlukan:

| Kolom (Header) | Contoh Data | Keterangan |
|----------------|-------------|------------|
| `id` | `1` | ID auto-increment (untuk SheetDB) |
| `user_id` | `USR-1737356084123` | ID unik user (generated dari frontend) |
| `name` | `Budi Santoso` | Nama lengkap user |
| `whatsapp_no` | `6281234567890` | Nomor WhatsApp (dengan kode negara) |
| `referral_code` | `BUDI78A1` | Kode referral unik milik user ini |
| `referrer_code` | `RIDO21A2` | Kode referral dari orang yang mengajak (kosong jika tidak ada) |
| `total_points` | `10000` | Total poin yang dimiliki user |
| `created_at` | `2026-01-20 10:00:00` | Waktu pendaftaran |

**Cara membuat:**
1. Klik tombol **+** di bagian bawah untuk menambah sheet baru
2. Rename sheet menjadi `users`
3. Di baris pertama (row 1), isi header sesuai tabel di atas
4. Biarkan kosong untuk data (akan diisi otomatis dari website)

---

## Langkah 3: Buat Sheet Baru - `referrals`

Buat sheet baru dengan nama **`referrals`** (huruf kecil semua).

### Kolom-kolom yang diperlukan:

| Kolom (Header) | Contoh Data | Keterangan |
|----------------|-------------|------------|
| `id` | `1` | ID auto-increment (untuk SheetDB) |
| `referral_id` | `REF-1737356084456` | ID unik referral |
| `referrer_code` | `RIDO21A2` | Kode referral si pengajak |
| `referred_user_id` | `USR-1737356084123` | User ID teman yang diajak |
| `referred_name` | `Budi Santoso` | Nama teman yang diajak |
| `status` | `pending` | Status: `pending` atau `completed` |
| `reward_points` | `10000` | Jumlah poin reward (default 10000) |
| `created_at` | `2026-01-20 10:00:00` | Waktu teman mendaftar |
| `completed_at` | `2026-01-21 14:30:00` | Waktu referral selesai (kosong jika pending) |

**Cara membuat:**
1. Klik tombol **+** untuk menambah sheet baru
2. Rename sheet menjadi `referrals`
3. Di baris pertama, isi header sesuai tabel di atas

---

## Langkah 4: Buat Sheet Baru - `orders`

Buat sheet baru dengan nama **`orders`** (huruf kecil semua).

### Kolom-kolom yang diperlukan:

| Kolom (Header) | Contoh Data | Keterangan |
|----------------|-------------|------------|
| `id` | `1` | ID auto-increment (untuk SheetDB) |
| `order_id` | `ORD-1737356084789` | ID unik pesanan |
| `user_id` | `USR-1737356084123` | User ID yang memesan |
| `whatsapp_no` | `6281234567890` | Nomor WhatsApp pemesan |
| `order_details` | `Paket A x2, Paket B x1` | Detail pesanan |
| `total_amount` | `150000` | Total nilai pesanan |
| `payment_method` | `cash` | Metode pembayaran: cash/gajian |
| `created_at` | `2026-01-21 14:30:00` | Waktu pesanan dibuat |

**Cara membuat:**
1. Klik tombol **+** untuk menambah sheet baru
2. Rename sheet menjadi `orders`
3. Di baris pertama, isi header sesuai tabel di atas

---

## Langkah 5: Verifikasi Setup

Setelah membuat 3 sheet baru, pastikan:

✅ Sheet `users` ada dengan 8 kolom header  
✅ Sheet `referrals` ada dengan 9 kolom header  
✅ Sheet `orders` ada dengan 8 kolom header  
✅ Semua nama sheet menggunakan huruf kecil  
✅ Semua header di row 1 (baris pertama)

---

## Langkah 6: Test Akses SheetDB

Buka browser dan test akses ke SheetDB:

**Test 1 - Read Users:**
```
https://sheetdb.io/api/v1/f1ioa83a268s8?sheet=users
```
Harusnya return array kosong `[]` atau data yang ada.

**Test 2 - Read Referrals:**
```
https://sheetdb.io/api/v1/f1ioa83a268s8?sheet=referrals
```

**Test 3 - Read Orders:**
```
https://sheetdb.io/api/v1/f1ioa83a268s8?sheet=orders
```

Jika semua test berhasil (tidak error 404), database sudah siap!

---

## Langkah 7: Data Sample (Opsional)

Untuk testing, Anda bisa menambahkan 1 baris data sample di sheet `users`:

| id | user_id | name | whatsapp_no | referral_code | referrer_code | total_points | created_at |
|----|---------|------|-------------|---------------|---------------|--------------|------------|
| 1 | USR-TEST001 | Test User | 6281234567890 | TEST001 | | 0 | 2026-01-20 10:00:00 |

---

## Troubleshooting

**Problem:** Error 404 saat akses SheetDB  
**Solution:** Pastikan nama sheet persis `users`, `referrals`, `orders` (huruf kecil semua, tanpa spasi)

**Problem:** SheetDB return data kosong  
**Solution:** Ini normal jika belum ada data. Tunggu sampai implementasi frontend selesai.

**Problem:** Error "sheet not found"  
**Solution:** Refresh SheetDB cache dengan menambahkan `?_t=timestamp` di URL, contoh:
```
https://sheetdb.io/api/v1/f1ioa83a268s8?sheet=users&_t=1737356084
```

---

## Next Steps

Setelah database setup selesai, lanjut ke implementasi frontend:
1. Referral handler (tracking kode referral dari URL)
2. User registration system
3. Referral dashboard
4. Order integration

---

**Setup Guide by Manus AI**  
**Tanggal: 20 Januari 2026**
