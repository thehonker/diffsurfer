@echo off
setlocal enabledelayedexpansion

:: Change to the project root directory to ensure paths work correctly
cd /d "%~dp0.."

:: Create dist directory if it doesn't exist
if not exist "dist" mkdir "dist"

:: Read from assets.csv and copy files
for /f "tokens=1,2 delims=," %%a in (assets.csv) do (
    set "src=%%a"
    set "dest=%%b"
    
    :: Remove any quotes from src and dest
    set "src=!src:"=!"
    set "dest=!dest:"=!"
    
    :: Handle wildcard copies differently
    echo !src! | findstr /C:"*" >nul
    if !errorlevel! equ 0 (
        :: This is a wildcard copy
        for %%f in ("!dest!") do (
            if not exist "%%~dpf" mkdir "%%~dpf"
        )
        robocopy "!src!" "!dest!" /E /NFL /NDL /NJH /NJS /NP /XC /XN /XO
    ) else (
        :: This is a single file or directory copy
        for %%f in ("!dest!") do (
            if not exist "%%~dpf" mkdir "%%~dpf"
        )
        xcopy "!src!" "!dest!" /E /I /Y /Q
    )
)