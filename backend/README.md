# TNS ERP — ระบบจัดการภายใน

ระบบ ERP สำหรับธุรกิจ e-commerce และบริหารการเงินส่วนตัว สร้างด้วย Next.js 14, Prisma, SQLite (local) / PostgreSQL (production)

---

## 🚀 ติดตั้งและรันบนเครื่องใหม่

### สิ่งที่ต้องมี
- [Node.js](https://nodejs.org/) version 18 ขึ้นไป
- [Git](https://git-scm.com/)
- Editor เช่น [VS Code](https://code.visualstudio.com/)

### ขั้นตอน

**1. Clone โปรเจค**
```bash
git clone <your-repo-url> tns-erp
cd tns-erp/backend
```

**2. ติดตั้ง dependencies**
```bash
npm install
```

**3. สร้างไฟล์ `.env`**

สร้างไฟล์ชื่อ `.env` ใน folder `backend/` แล้วใส่:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="tns-secret-key-2024"
```

**4. สร้างฐานข้อมูลและ seed ข้อมูลเริ่มต้น**
```bash
npx prisma migrate dev --name init
npm run db:seed
```

**5. รันเว็บ**
```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ `http://localhost:3001`

---

## 🔐 บัญชีเริ่มต้น

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tns.co.th | admin1234 |
| Staff | staff@tns.co.th | staff1234 |

> แนะนำให้เปลี่ยน password หลังจาก login ครั้งแรก

---

## 📋 ฟีเจอร์ทั้งหมด

### สำหรับงาน
| หน้า | URL | คำอธิบาย |
|------|-----|----------|
| Dashboard | `/dashboard` | ภาพรวมงานทั้งหมด |
| คิวถ่ายรูป | `/photo-queue` | จัดการสินค้าที่รอถ่ายรูป |
| ลงขาย | `/listing-queue` | สินค้าที่รอลงขาย Shopee/Lazada/TikTok |
| บันทึกงาน | `/daily-logs` | บันทึกงานประจำวัน |
| ปิดสต็อก | `/stock-close` | แจ้งสินค้าหมดสต็อก |

### ส่วนตัว
| หน้า | URL | คำอธิบาย |
|------|-----|----------|
| Dashboard | `/personal` | ภาพรวมการเงินส่วนตัว |
| รายรับ-รายจ่าย | `/income-expense` | บันทึกรายรับ-รายจ่ายรายเดือน |
| ผ่อนบ้าน | `/personal/mortgage` | ติดตามยอดผ่อนบ้านแต่ละหลัง |
| ผ่อนรถ | `/personal/car-loans` | ติดตามยอดผ่อนรถแต่ละคัน |
| เป้าหมายออม | `/personal/savings-goals` | ตั้งและติดตามเป้าหมายการออม |
| สุขภาพแมว | `/personal/cat-health` | บันทึกสุขภาพแมว วัคซีน พบหมอ |
| บิลรายเดือน | `/bills` | จัดการบิลประจำเดือน |

### ตั้งค่า
| หน้า | URL | คำอธิบาย |
|------|-----|----------|
| ผู้ใช้งาน | `/users` | จัดการ user (Admin เท่านั้น) |
| Activity Logs | `/activity-logs` | ประวัติการใช้งานระบบ |

---

## 🛠 คำสั่งที่ใช้บ่อย

```bash
# รัน development server
npm run dev

# เพิ่ม/แก้ไข schema แล้ว migrate
npx prisma migrate dev --name <ชื่อการเปลี่ยนแปลง>

# ดู database ผ่าน GUI
npx prisma studio

# Reset database และ seed ใหม่
npx prisma migrate reset
npm run db:seed

# Build สำหรับ production
npm run build
```

---

## 🏗 โครงสร้างโปรเจค

```
backend/
├── prisma/
│   ├── schema.prisma              # Schema สำหรับ local (SQLite)
│   ├── schema.production.prisma   # Schema สำหรับ production (PostgreSQL)
│   └── seed.ts                    # ข้อมูลเริ่มต้น
├── src/
│   ├── app/
│   │   ├── api/                   # API Routes ทั้งหมด
│   │   │   ├── auth/
│   │   │   ├── transactions/
│   │   │   ├── bills/
│   │   │   ├── mortgage/
│   │   │   ├── car-loans/
│   │   │   ├── savings-goals/
│   │   │   ├── cat-health/
│   │   │   └── ...
│   │   ├── personal/              # หน้าส่วนตัว
│   │   │   ├── page.tsx           # Dashboard ส่วนตัว
│   │   │   ├── mortgage/
│   │   │   ├── car-loans/
│   │   │   ├── savings-goals/
│   │   │   └── cat-health/
│   │   ├── dashboard/             # Dashboard งาน
│   │   ├── photo-queue/
│   │   ├── listing-queue/
│   │   └── ...
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   └── ui/
│   │       └── Modal.tsx
│   └── lib/
│       ├── auth.ts                # JWT authentication
│       └── prisma.ts              # Prisma client
└── .env                           # Environment variables (ไม่ commit)
```

---

## ☁️ Deploy บน Render

โปรเจคนี้ deploy บน [Render.com](https://render.com) โดยอัตโนมัติเมื่อ push ขึ้น `main` branch

**Environment Variables บน Render:**
```
DATABASE_URL=<PostgreSQL connection string จาก Neon>
JWT_SECRET=<secret key>
```

**Production URL:** https://tns-erp.onrender.com

---

## ✏️ การเพิ่มฟีเจอร์ใหม่

1. แก้ไขโค้ดบนเครื่อง
2. ถ้าเพิ่ม model ใหม่ ให้แก้ทั้ง `schema.prisma` และ `schema.production.prisma`
3. รัน `npx prisma migrate dev` เพื่ออัพเดท local database
4. Commit และ push:
```bash
git add .
git commit -m "feat: <ชื่อฟีเจอร์>"
git push
```
5. Render จะ deploy ให้อัตโนมัติภายใน 3-5 นาที
