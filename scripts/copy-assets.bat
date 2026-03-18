@echo off
setlocal enabledelayedexpansion

:: Change to the script's directory to ensure relative paths work correctly
cd /d "%~dp0"

:: Create dist directory if it doesn't exist
if not exist "..\dist" mkdir "..\dist"

:: Read from assets.csv and copy files
for /f "tokens=1,2 delims=," %%a in (..\assets.csv) do (
    set "src=%%a"
    set "dest=%%b"
    
    :: Remove any quotes from src and dest
    set "src=!src:"=!"
    set "dest=!dest:"=!"
    
    :: Create destination directory
    for %%f in ("..\!dest!") do (
        if not exist "%%~dpf" mkdir "%%~dpf"
    )
    
    :: Copy files
    xcopy "..\!src!" "..\!dest!" /E /I /Y /Q
)