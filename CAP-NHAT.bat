@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Dang cap nhat trang web tu data/*.csv ...
python tools\build.py
echo Hoan tat! Hay nhan Ctrl + F5 tren trinh duyet de xem thay doi.
pause
