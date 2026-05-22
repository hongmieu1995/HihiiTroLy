@echo off
setlocal enabledelayedexpansion

REM Create output folder
if not exist "build-output" mkdir build-output

REM Copy installer
echo Copying installer...
if exist "src-tauri\target\release\bundle\msi\Hihii_1.0.0_x64_en-US.msi" (
    copy "src-tauri\target\release\bundle\msi\Hihii_1.0.0_x64_en-US.msi" "build-output\Hihii-1.0.0-Installer.msi"
    echo [OK] Installer
) else (
    echo [SKIP] Installer not found
)

REM Copy portable
echo Copying portable exe...
if exist "src-tauri\target\release\app.exe" (
    copy "src-tauri\target\release\app.exe" "build-output\Hihii-1.0.0-Portable.exe"
    echo [OK] Portable
) else (
    echo [SKIP] Portable not found
)

echo.
echo ==========================================
echo Build files ready in: build-output\
echo ==========================================
dir build-output\
pause
