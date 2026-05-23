@echo off
chcp 65001 >nul
title TNS ERP — Running on http://localhost:3001

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║   🚀 TNS ERP — Starting...               ║
echo  ╚══════════════════════════════════════════╝
echo.
echo  🌐 Web Dashboard : http://localhost:3001
echo  👑 Admin         : admin@tns.co.th / admin1234
echo  👤 Staff         : staff@tns.co.th / staff1234
echo.
echo  กด Ctrl+C เพื่อหยุดระบบ
echo.

IF NOT EXIST "backend\node_modules" (
    echo  ❌ ยังไม่ได้ติดตั้ง! กรุณารัน setup-windows.bat ก่อน
    pause
    exit /b 1
)

timeout /t 1 /nobreak >nul
start http://localhost:3001
cd backend
call npm run dev
