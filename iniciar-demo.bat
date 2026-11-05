@echo off
title Mirador de la Cascada - Demo
echo Iniciando backend y frontend...
start "Backend (no cerrar)" cmd /k "cd /d %~dp0backend && npm run dev"
start "Frontend (no cerrar)" cmd /k "cd /d %~dp0frontend && npm run dev"
echo Esperando a que arranque todo...
timeout /t 8 >nul
start http://localhost:5173
