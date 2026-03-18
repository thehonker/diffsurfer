@echo off
setlocal enabledelayedexpansion

:: Create dist directory if it doesn't exist
if not exist "dist" mkdir "dist"

:: Read from assets.csv and copy files
for /f "tokens=1,2 delims=," %%a in (assets.csv) do (
    set "src=%%a"
    set "dest=%%b"
    
    :: Create destination directory
    for %%f in ("!dest!") do (
        if not exist "%%~dpf" mkdir "%%~dpf"
    )
    
    :: Copy files
    if "!src!" == "*" (
        xcopy "!src!" "!dest!" /E /I /Y
    ) else (
        xcopy "!src!" "!dest!" /E /I /Y
    )
)