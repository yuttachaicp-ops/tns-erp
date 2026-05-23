# 🏢 TNS ERP — Daily Operations System

> ระบบ ERP สำหรับงานประจำวัน รองรับ Windows Desktop, Android Mobile และ Web Dashboard  
> ข้อมูล Sync ทุกอุปกรณ์ผ่าน Cloud Database

---

## 🗂️ Project Structure

```
tns-erp/
├── backend/          ← Next.js API + Web Dashboard
│   ├── prisma/       ← PostgreSQL Schema + Seed
│   └── src/
│       ├── app/      ← Pages + API Routes
│       ├── components/
│       └── lib/      ← Prisma, Auth, Helpers
├── desktop/          ← Electron Windows App
├── mobile/           ← React Native Expo (Android)
├── docker-compose.yml
├── render.yaml
└── .github/workflows/
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ (or Docker)
- Git

---

## 🖥️ 1. Backend Setup (Web + API)

```bash
# 1. เข้าโฟลเดอร์ backend
cd backend

# 2. ติดตั้ง dependencies
npm install

# 3. สร้างไฟล์ .env
cp .env.example .env
# แก้ไข DATABASE_URL และ JWT_SECRET ใน .env

# 4. Setup database
npx prisma generate
npx prisma db push
npm run db:seed

# 5. รันในโหมด development
npm run dev
# เปิดได้ที่ http://localhost:3001
```

**Default Login Credentials:**
| Role  | Email               | Password    |
|-------|---------------------|-------------|
| Admin | admin@tns.co.th     | admin1234   |
| Staff | staff@tns.co.th     | staff1234   |

---

## 🪟 2. Desktop App (Windows)

### Development Mode
```bash
cd desktop
npm install

# แก้ไข .env ให้ BACKEND_URL ชี้ไปที่ backend
cp .env.example .env

# รัน (backend ต้องรันก่อน)
npm start
```

### Build Windows Installer (.exe)
```bash
cd desktop
npm install
npm run build
# ไฟล์ .exe จะอยู่ใน desktop/dist/
```

### Build Portable Version
```bash
npm run build:portable
```

---

## 📱 3. Mobile App (Android)

### Development Mode
```bash
cd mobile
npm install
cp .env.example .env
# แก้ไข EXPO_PUBLIC_API_URL ให้ชี้ไปที่ backend

npx expo start
# สแกน QR Code ด้วย Expo Go บน Android
```

### Build APK (ใช้ EAS Build)
```bash
# ติดตั้ง EAS CLI
npm install -g eas-cli

# Login Expo account
eas login

# Build APK (Preview)
cd mobile
eas build --platform android --profile preview

# Build AAB (Production)
eas build --platform android --profile production
```

---

## ☁️ 4. Deploy to Render.com

### วิธีที่ 1: ใช้ render.yaml (แนะนำ)
1. Push code ขึ้น GitHub
2. เข้า [Render.com](https://render.com) → New → Blueprint
3. เชื่อมต่อ GitHub repo
4. Render จะอ่าน `render.yaml` และสร้าง service + database อัตโนมัติ
5. รอ deploy เสร็จ (5-10 นาที)

### วิธีที่ 2: Manual Deploy
```bash
# 1. สร้าง PostgreSQL database ใน Render
# 2. สร้าง Web Service ชี้ไปที่ folder backend/
# 3. ตั้ง Environment Variables:
#    DATABASE_URL = (จาก Render database)
#    JWT_SECRET   = (random string)
#    NODE_ENV     = production
# 4. Build Command: npm ci && npx prisma generate && npm run build
# 5. Start Command: npx prisma migrate deploy && node server.js
```

---

## 🐳 5. Deploy with Docker

```bash
# Clone repo
git clone https://github.com/YOUR_USERNAME/tns-erp.git
cd tns-erp

# สร้าง .env
echo "JWT_SECRET=$(openssl rand -base64 32)" > .env

# รัน Docker Compose
docker-compose up -d

# ดู logs
docker-compose logs -f backend

# เข้าใช้งาน
# Web: http://localhost:3001
```

---

## 🔗 API Endpoints

| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| POST   | `/api/auth/login`           | เข้าสู่ระบบ              |
| POST   | `/api/auth/logout`          | ออกจากระบบ               |
| GET    | `/api/auth/me`              | ข้อมูลผู้ใช้ปัจจุบัน     |
| GET    | `/api/dashboard`            | ข้อมูล Dashboard         |
| GET    | `/api/photo-queue`          | รายการสินค้ารอถ่ายรูป    |
| POST   | `/api/photo-queue`          | เพิ่มสินค้า              |
| PUT    | `/api/photo-queue/:id`      | แก้ไขสินค้า              |
| DELETE | `/api/photo-queue/:id`      | ลบสินค้า                 |
| GET    | `/api/listing-queue`        | รายการสินค้ายังไม่ลงขาย  |
| POST   | `/api/listing-queue`        | เพิ่มสินค้า              |
| GET    | `/api/daily-logs`           | บันทึกงานประจำวัน        |
| POST   | `/api/daily-logs`           | เพิ่มงาน                 |
| GET    | `/api/users`                | รายการผู้ใช้ (Admin)     |
| POST   | `/api/users`                | สร้างผู้ใช้              |
| GET    | `/api/activity-logs`        | ประวัติการใช้งาน         |

---

## 🗄️ Database Schema

```sql
users           → id, email, password, name, role, isActive
photo_queue     → id, productName, sku, category, quantity, status, note
listing_queue   → id, productName, sku, platform, quantity, status, assignedTo
daily_logs      → id, workTitle, workDetail, workCategory, priority, status, assignedUser
activity_logs   → id, action, module, detail, userId
```

---

## 🔐 Security

- JWT Authentication (7 วัน expiry)
- bcrypt password hashing (salt rounds: 12)
- HTTP-only cookies
- Role-based access control (Admin / Staff)
- Input validation with Zod
- Protected API routes

---

## 📋 Modules

| Module              | Description                        |
|---------------------|------------------------------------|
| 📊 Dashboard         | KPI, Recent Activity, Analytics    |
| 📷 Photo Queue       | สินค้ารอถ่ายรูป (CRUD + Status)   |
| 🛒 Listing Queue     | สินค้ายังไม่ลงขาย (Multi-platform)|
| 📝 Daily Logs        | บันทึกงานประจำวัน (Priority)      |
| 👥 Users             | จัดการผู้ใช้งาน (Admin)           |
| 📋 Activity Logs     | ประวัติการใช้งานทั้งหมด           |

---

## 🛠️ Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Backend     | Next.js 14, TypeScript              |
| Database    | PostgreSQL 15                       |
| ORM         | Prisma                              |
| Auth        | JWT (jose), bcryptjs                |
| Validation  | Zod                                 |
| Desktop     | Electron 30, electron-builder       |
| Mobile      | React Native, Expo SDK 51           |
| Cloud       | Render.com                          |
| CI/CD       | GitHub Actions                      |

---

## 🐛 Troubleshooting

**Database connection error:**
```bash
# ตรวจสอบ DATABASE_URL ใน .env
npx prisma db push --force-reset
```

**Prisma generate error:**
```bash
npx prisma generate --schema=./prisma/schema.prisma
```

**Electron ไม่เชื่อมต่อ backend:**
```bash
# ตรวจสอบ BACKEND_URL ใน desktop/.env
# backend ต้องรันก่อนเปิด Electron
```

**Mobile ไม่เชื่อมต่อ API:**
```bash
# ตรวจสอบ EXPO_PUBLIC_API_URL ใน mobile/.env
# ต้องใช้ URL ที่เข้าถึงได้จากมือถือ (ไม่ใช่ localhost)
```

---

## 📦 Build Commands Summary

```bash
# Backend (Production)
cd backend && npm run build && npm start

# Desktop (.exe installer)
cd desktop && npm run build

# Mobile (APK)
cd mobile && eas build --platform android --profile preview

# Docker (All-in-one)
docker-compose up -d
```

---

## 👨‍💻 Development Team

**TNS ERP** — Daily Operations System  
Built for internal company use

---

*© 2024 TNS Company — All rights reserved*
