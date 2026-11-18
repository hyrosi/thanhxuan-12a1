@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   KY YEU 12A1 - SO TAY THANH XUAN 3D
echo ============================================
echo [1/2] Dang cap nhat du lieu tu cac file CSV...
python tools\build.py
if errorlevel 1 (
    echo Loi: Can cai dat Python 3 tai https://www.python.org/downloads/
    pause
    exit /b 1
)
echo [2/2] Dang mo trinh duyet tai http://localhost:3000 ...
start "" http://localhost:3000
python -m http.server 3000
