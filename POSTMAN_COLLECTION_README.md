# Backend Customer Care API - Postman Collection

Koleksi Postman lengkap untuk testing semua endpoint di Backend Customer Care API.

## 📁 File Yang Disertakan

1. **Backend_Customer_Care_API.postman_collection.json** - Koleksi utama dengan semua endpoint
2. **Backend_Customer_Care_Local.postman_environment.json** - Environment untuk development lokal

## 🚀 Cara Import ke Postman

### 1. Import Collection
1. Buka Postman
2. Klik **Import** di bagian atas kiri
3. Pilih file `Backend_Customer_Care_API.postman_collection.json`
4. Klik **Import**

### 2. Import Environment
1. Klik ikon **Environment** di sidebar kiri
2. Klik **Import**
3. Pilih file `Backend_Customer_Care_Local.postman_environment.json`
4. Klik **Import**
5. Aktifkan environment dengan memilih "Backend Customer Care - Local" di dropdown environment

## 🔧 Setup dan Konfigurasi

### 1. Pastikan Server Berjalan
```bash
# Masuk ke direktori mock
cd mock

# Install dependencies (jika belum)
npm install

# Jalankan server
npm start
```

Server akan berjalan di `http://localhost:5000`

### 2. Konfigurasi Environment Variables
Environment sudah dikonfigurasi dengan nilai default:
- **base_url**: `http://localhost:5000/v1`
- **customer_email**: `andi.saputra@example.com`
- **customer_password**: `password123`
- **employee_email**: `admin@company.com`
- **employee_password**: `admin123`

## 📋 Struktur Collection

### 1. **Health Check**
- Health Check - Cek status server
- Socket Status - Cek status Socket.IO

### 2. **Authentication**
- Customer Login - Login sebagai customer
- Employee Login - Login sebagai employee
- Get Current User - Dapatkan info user yang sedang login
- Refresh Token - Refresh JWT token
- Logout - Logout user

### 3. **Tickets**
- Get All Tickets - List semua tickets
- Get Ticket by ID - Detail ticket berdasarkan ID
- Create Ticket - Buat ticket baru
- Update Ticket - Update ticket (employee only)
- Delete Ticket - Hapus ticket
- Get Ticket Activities - List aktivitas ticket
- Add Ticket Activity - Tambah aktivitas ke ticket
- Get Ticket Attachments - List lampiran ticket
- Get Ticket Feedback - Dapatkan feedback ticket
- Submit Ticket Feedback - Submit feedback untuk ticket

### 4. **Activities**
- Get Activity by ID - Detail aktivitas berdasarkan ID

### 5. **Feedback**
- Get All Feedback - List semua feedback (employee only)
- Get Feedback Detail - Detail feedback
- Update Feedback - Update komentar feedback

### 6. **Customers**
- Get All Customers - List semua customer (employee only)
- Get Customer by ID - Detail customer
- Get Customer Accounts - List akun customer
- Get Customer Cards - List kartu customer

### 7. **Reference Data**
- Get Channels - List semua channel
- Get Complaint Categories - List kategori keluhan
- Get SLAs - List SLA data
- Get UICs - List UIC (divisi)
- Get Priorities - List prioritas
- Get Sources - List sumber intake
- Get Terminals - List terminal
- Get Policies - List kebijakan

### 8. **FAQ**
- Get FAQs - List FAQ dengan filter

### 9. **Attachments**
- Upload Attachment to Ticket - Upload file ke ticket
- Get Attachment - Download/view attachment
- Delete Attachment - Hapus attachment

### 10. **Chat**
- Create Chat Session - Buat sesi chat baru
- Send Chat Message - Kirim pesan chat
- Get Chat Messages - List pesan dalam sesi chat

### 11. **Notifications**
- Register FCM Token - Daftar token FCM untuk notifikasi
- Get Notification History - Riwayat notifikasi
- Mark Notification as Read - Tandai notifikasi sudah dibaca
- Test Notification - Test kirim notifikasi

### 12. **Socket.IO**
- Get Online Users - List user yang sedang online
- Send Message via REST - Kirim pesan melalui REST API

## 🔐 Authentication Flow

### 1. Login Pertama Kali
1. Jalankan request **Customer Login** atau **Employee Login**
2. Token akan otomatis disimpan ke variable `auth_token`
3. Semua request selanjutnya akan menggunakan token ini

### 2. Authorization
- **Customer**: Bisa akses ticket sendiri, submit feedback, chat
- **Employee**: Bisa akses semua data, update ticket, lihat customer data
- **Admin**: Level tertinggi untuk operasi delete

## 📝 Testing Scenarios

### Scenario 1: Customer Journey
1. **Customer Login** - Login sebagai customer
2. **Create Ticket** - Buat ticket baru
3. **Get All Tickets** - Lihat tickets (hanya milik sendiri)
4. **Add Ticket Activity** - Tambah komentar/aktivitas
5. **Submit Ticket Feedback** - Berikan feedback

### Scenario 2: Employee Journey
1. **Employee Login** - Login sebagai employee
2. **Get All Tickets** - Lihat semua tickets
3. **Get Ticket by ID** - Lihat detail ticket
4. **Update Ticket** - Update status/assign ticket
5. **Get All Customers** - Lihat data customer

### Scenario 3: Chat System
1. **Create Chat Session** - Mulai chat baru
2. **Send Chat Message** - Kirim beberapa pesan
3. **Get Chat Messages** - Lihat riwayat chat

### Scenario 4: File Upload
1. **Login** (customer atau employee)
2. **Upload Attachment to Ticket** - Upload file
3. **Get Ticket Attachments** - Lihat file yang diupload
4. **Get Attachment** - Download file

## 🐛 Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Pastikan sudah login dan token valid
   - Cek apakah environment sudah diaktifkan

2. **403 Forbidden**
   - Cek role/permission user
   - Employee tidak bisa akses endpoint customer tertentu

3. **404 Not Found**
   - Pastikan server berjalan di port 5000
   - Cek apakah endpoint URL benar

4. **500 Internal Server Error**
   - Cek log server di console
   - Pastikan database/JSON file tidak corrupt

### Debug Tips

1. **Cek Server Logs**: Lihat output di terminal tempat server berjalan
2. **Cek Response**: Perhatikan response body untuk error details
3. **Validate Data**: Pastikan format JSON request benar
4. **Check Variables**: Pastikan collection variables terisi dengan benar

## 🔄 Auto-Generated Variables

Collection ini menggunakan beberapa script yang otomatis menyimpan data:

- **auth_token**: Otomatis disimpan saat login berhasil
- **chat_session_id**: Otomatis disimpan saat create chat session

## 📊 Expected Response Format

Semua endpoint menggunakan format response yang konsisten:

```json
{
  "success": true,
  "message": "Success message",
  "data": {
    // Response data
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

Error response:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

## 🛠️ Customization

### Menambah Environment Baru
1. Duplicate environment "Backend Customer Care - Local"
2. Ganti `base_url` sesuai server target (staging/production)
3. Update credentials sesuai environment

### Menambah Request Baru
1. Klik kanan pada folder yang sesuai
2. Pilih "Add Request"
3. Set method, URL, headers, dan body sesuai kebutuhan
4. Tambahkan test script jika perlu

## 📞 Support

Jika ada masalah atau pertanyaan, silakan:
1. Cek dokumentasi API di `/api-docs`
2. Lihat log server untuk error details
3. Contact team development

---

**Happy Testing! 🚀**
