@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title TNS ERP — Windows Setup

echo.
echo  ████████╗███╗   ██╗███████╗    ███████╗██████╗ ██████╗
echo     ██╔══╝████╗  ██║██╔════╝    ██╔════╝██╔══██╗██╔══██╗
echo     ██║   ██╔██╗ ██║███████╗    █████╗  ██████╔╝██████╔╝
echo     ██║   ██║╚██╗██║╚════██║    ██╔══╝  ██╔══██╗██╔═══╝
echo     ██║   ██║ ╚████║███████║    ███████╗██║  ██║██║
echo     ╚═╝   ╚═╝  ╚═══╝╚══════╝    ╚══════╝╚═╝  ╚═╝╚═╝
echo.
echo  Daily Operations System — Windows Setup
echo  ==========================================
echo  Database: SQLite (ไม่ต้องติดตั้งอะไรเพิ่ม!)
echo.

:: ── ตรวจสอบ Node.js ──────────────────────────────────────
echo [1/5] ตรวจสอบ Node.js...
node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ❌ ไม่พบ Node.js!
    echo  ════════════════════════════════════════════
    echo   กรุณาติดตั้ง Node.js ก่อน:
    echo   1. เปิด https://nodejs.org
    echo   2. ดาวน์โหลด LTS version
    echo   3. ติดตั้ง แล้วรัน setup-windows.bat ใหม่
    echo  ════════════════════════════════════════════
    pause
    start https://nodejs.org/en/download
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  ✅ Node.js %NODE_VER%

:: ── ตรวจสอบ folder structure ─────────────────────────────
echo.
echo [2/5] ตรวจสอบโครงสร้างโปรเจกต์...
IF NOT EXIST "backend\package.json" (
    echo  ❌ ไม่พบโฟลเดอร์ backend!
    echo  กรุณารัน setup-windows.bat จากโฟลเดอร์ tns-erp
    pause
    exit /b 1
)
echo  ✅ พบโฟลเดอร์ backend

:: ── ติดตั้ง Dependencies ─────────────────────────────────
echo.
echo [3/5] ติดตั้ง Backend Dependencies...
echo  (ครั้งแรกอาจใช้เวลา 2-5 นาที กรุณารอ...)
echo.
cd backend
call npm install
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ❌ npm install ล้มเหลว!
    echo  ลอง: npm install --legacy-peer-deps
    pause
    exit /b 1
)
echo.
echo  ✅ ติดตั้ง Dependencies เสร็จ

:: ── Prisma Generate ──────────────────────────────────────
echo.
echo [4/5] สร้าง Prisma Client + Database...
call npx prisma generate
IF %ERRORLEVEL% NEQ 0 (
    echo  ❌ Prisma generate ล้มเหลว
    pause
    exit /b 1
)
echo  ✅ Prisma Client สร้างเสร็จ

call npx prisma db push
IF %ERRORLEVEL% NEQ 0 (
    echo  ❌ prisma db push ล้มเหลว
    pause
    exit /b 1
)
echo  ✅ สร้าง Database Tables เสร็จ (SQLite: dev.db)

:: ── Seed Data ────────────────────────────────────────────
echo.
echo [5/5] ใส่ข้อมูลเริ่มต้น...
call npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" prisma/seed.ts
IF %ERRORLEVEL% NEQ 0 (
    echo  ⚠️  Seed ล้มเหลว (ข้ามได้ — อาจมี data อยู่แล้ว)
) ELSE (
    echo  ✅ Seed Data เสร็จสิ้น
)

:: ── สรุปและรันระบบ ──────────────────────────────────────
echo.
echo.
echo  ╔═══════════════════════════════════════════════════════╗
echo  ║     ✅  ติดตั้ง TNS ERP เสร็จสมบูรณ์!               ║
echo  ╠═══════════════════════════════════════════════════════╣
echo  ║  🌐 Web Dashboard : http://localhost:3001             ║
echo  ║  👑 Admin Login   : admin@tns.co.th / admin1234       ║
echo  ║  👤 Staff Login   : staff@tns.co.th / staff1234       ║
echo  ╠═══════════════════════════════════════════════════════╣
echo  ║  📁 Database file : backend\prisma\dev.db             ║
echo  ║  🔄 ครั้งต่อไป   : รัน start.bat                     ║
echo  ╚═══════════════════════════════════════════════════════╝
echo.
echo  กำลังเปิด Browser และรันระบบ...
echo  (กด Ctrl+C เพื่อหยุด)
echo.
start http://localhost:3001
call npm run dev
