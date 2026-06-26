@echo off
echo ========================================
echo  Avvio Ndovado - Backend + Frontend
echo ========================================

set ROOT=%~dp0
set FRONTEND=%ROOT%frontend

echo [1/2] Avvio Frontend Angular (porta 4200)...
start "Ndovado Frontend" cmd /k "cd /d %FRONTEND% && npm install && npm start"

echo [2/2] Avvio Backend Spring Boot (porta 8080)...
cd /d %ROOT%
call gradlew.bat bootRun

pause
