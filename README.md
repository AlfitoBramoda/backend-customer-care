# Backend Customer Care B-Care (Havis)

Sistem Backend API untuk Customer Care B-Care menggunakan Node.js, Express, dan PostgreSQL.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 atau lebih tinggi)
- PostgreSQL
- npm atau yarn

### Installation

1. **Clone repository**
   ```bash
   git clone https://github.com/AlfitoBramoda/backend-customer-care.git
   cd backend-customer-care
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   ```
   Edit file `.env` dengan konfigurasi database Anda.

4. **Setup database**
   ```bash
   # Buat database PostgreSQL
   # Update config/config.json sesuai dengan database Anda
   ```

5. **Run application**
   ```bash
   npm start
   ```

## 📁 Project Structure

```
backend-customer-care/
├── config/          # Konfigurasi database
├── migrations/      # Database migrations
├── models/          # Sequelize models
├── seeders/         # Database seeders
├── app.js          # Main application file
└── package.json    # Dependencies dan scripts
```

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT + bcrypt
- **Documentation**: Swagger

## 📖 API Documentation

Setelah menjalankan aplikasi, akses dokumentasi API di:
```
http://localhost:3000/api-docs
```

## 🔄 Development Workflow

### ⚠️ PENTING: Aturan Branch dan Pull Request

1. **JANGAN PERNAH push langsung ke branch `main`**
2. **SELALU buat branch baru untuk setiap fitur**
3. **WAJIB membuat Pull Request untuk merge ke main**

### Workflow Steps

1. **Update branch main lokal**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Buat branch baru untuk fitur**
   ```bash
   git checkout -b feature/nama-fitur
   # atau
   git checkout -b fix/nama-bug
   ```

3. **Develop dan commit**
   ```bash
   git add .
   git commit -m "feat: deskripsi fitur yang ditambahkan"
   ```

4. **Push branch ke remote**
   ```bash
   git push origin feature/nama-fitur
   ```

5. **Buat Pull Request**
   - Buka GitHub repository
   - Klik "New Pull Request"
   - Base: `main` ← Compare: `feature/nama-fitur`
   - Tambahkan deskripsi yang jelas
   - Request review dari team member

6. **Setelah PR di-approve dan merge**
   ```bash
   git checkout main
   git pull origin main
   git branch -d feature/nama-fitur
   ```

### Branch Naming Convention

- **Feature**: `feature/nama-fitur`
- **Bug Fix**: `fix/nama-bug`
- **Hotfix**: `hotfix/nama-hotfix`
- **Documentation**: `docs/nama-doc`

### Commit Message Convention

- `feat:` untuk fitur baru
- `fix:` untuk bug fix
- `docs:` untuk dokumentasi
- `refactor:` untuk refactoring
- `test:` untuk testing

## 🧪 Testing

```bash
npm test
```

## 📝 Environment Variables

Buat file `.env` dengan variabel berikut:

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=customer_care_db
DB_USER=your_username
DB_PASS=your_password
JWT_SECRET=your_jwt_secret
```

## 🤝 Contributing

1. Fork repository ini
2. Buat branch fitur (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

### Code Review Process

- Setiap PR harus di-review minimal oleh 1 team member
- Pastikan semua test passing
- Pastikan tidak ada conflict dengan main branch
- Gunakan descriptive commit messages

## 📞 Support

Jika ada pertanyaan atau masalah, silakan:
1. Buat issue di GitHub repository
2. Hubungi tim development
3. Check dokumentasi API di `/api-docs`

## 📄 License

ISC License - Tim Backend B-Care

---

**⚠️ REMINDER UNTUK SEMUA COLLABORATOR:**
- **TIDAK ADA yang boleh push langsung ke main**
- **SELALU gunakan Pull Request**
- **SELALU buat branch baru untuk setiap fitur**
- **SELALU update branch main sebelum membuat branch baru**