# 📧 Email Escalation System

Sistem otomatis untuk mengirim notifikasi email ketika ticket di-escalate ke divisi terkait.

## 🚀 Fitur

- ✅ Otomatis mengirim email ke semua employee di divisi target
- ✅ Template email yang informatif dengan detail lengkap ticket
- ✅ Prioritas visual dengan color coding
- ✅ Informasi SLA dan deadline
- ✅ Error handling yang robust

## 📁 File Structure

```
mock/
├── services/
│   └── emailEscalationService.js    # Service utama untuk email escalation
├── emailTest.js                     # Test email basic + escalation
├── testEscalationEmail.js          # Test khusus escalation
├── escalationDemo.js               # Demo lengkap sistem
└── EMAIL_ESCALATION_README.md      # Dokumentasi ini
```

## 🔧 Cara Kerja

### 1. Trigger Escalation
Email akan dikirim otomatis ketika:
- **Create Ticket** dengan `action: "ESCALATED"`
- **Update Ticket** dengan `action: "ESCALATED"`

### 2. Proses Email
1. System mengambil data ticket yang di-escalate
2. Mencari policy untuk menentukan target division (`uic_id`)
3. Mengambil semua employee aktif di division tersebut
4. Mengirim email ke semua employee di division target

### 3. Isi Email
Email berisi informasi lengkap:
- Nomor ticket
- Priority (dengan color coding)
- Data customer
- Jenis complaint
- Deskripsi masalah
- Jumlah transaksi
- Tanggal transaksi
- Agent yang melakukan escalate
- Target division
- SLA dan deadline
- Waktu pembuatan ticket

## 🧪 Testing

### Test Basic Email
```bash
cd mock
node emailTest.js
```

### Test Escalation Email
```bash
cd mock
node testEscalationEmail.js
```

### Demo Lengkap
```bash
cd mock
node escalationDemo.js
```

## ⚙️ Konfigurasi

Email menggunakan konfigurasi dari `.env`:
```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_pass
SMTP_FROM=noreply@bcare.my.id
```

## 📊 Data Flow

```
Ticket Escalation
       ↓
EmailEscalationService.sendEscalationEmail()
       ↓
1. Get ticket details
2. Get escalating agent info
3. Get customer info
4. Get policy → target division
5. Get all employees in target division
6. Generate email content
7. Send emails to all employees
       ↓
Email notifications sent ✅
```

## 🎯 Target Division Mapping

Berdasarkan `complaint_policy` table:
- Policy menentukan `uic_id` (target division)
- System mencari semua employee dengan `division_id = uic_id`
- Email dikirim ke semua employee aktif (`is_active: true`)

## 🔍 Example Usage

### API Call untuk Escalate Ticket
```javascript
// Update existing ticket
PUT /api/tickets/:id
{
  "action": "ESCALATED",
  "priority_id": 1,
  "record": "Urgent case needs specialist attention"
}

// Create new escalated ticket
POST /api/tickets
{
  "action": "ESCALATED",
  "customer_id": 1,
  "description": "Complex transaction issue",
  "issue_channel_id": 1,
  "complaint_id": 15,
  "priority_id": 2
}
```

### Email akan dikirim otomatis ke:
- Semua employee di division yang sesuai dengan policy
- Format email HTML yang professional
- Subject: "🚨 TICKET ESCALATION - [TICKET_NUMBER]"

## 🛠️ Troubleshooting

### Email tidak terkirim?
1. Cek konfigurasi SMTP di `.env`
2. Pastikan ada employee aktif di target division
3. Cek log console untuk error details
4. Verify policy memiliki `uic_id` yang valid

### Tidak ada target division?
1. Pastikan ticket memiliki `policy_id`
2. Cek policy memiliki `uic_id`
3. Verify division exists dengan `division_id = uic_id`

## 📈 Monitoring

System akan log:
- ✅ Berhasil kirim email: jumlah recipient dan division
- ❌ Error: detail error message
- ⚠️ Warning: tidak ada target employee

## 🔒 Security

- Email credentials disimpan di environment variables
- Tidak ada sensitive data di email content
- Error handling mencegah system crash jika email gagal