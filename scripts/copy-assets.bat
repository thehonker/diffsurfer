@echo off
setlocal enabledelayedexpansion

:: Change to the project root directory to ensure paths work correctly
cd /d "%~dp0.."

echo Current directory: %CD%

:: Create dist directory if it doesn't exist
if not exist "dist" mkdir "dist"

:: Read from assets.csv and copy files
for /f "tokens=1,2 delims=," %%a in (assets.csv) do (
    set "src=%%a"
    set "dest=%%b"
    
    :: Remove any quotes from src and dest
    set "src=!src:"=!"
    set "dest=!dest:"=!"
    
    echo Copying !src! to !dest!
    
    :: Handle wildcard copies differently
    echo !src! | findstr /C:"*" >nul
    if !errorlevel! equ 0 (
        :: This is a wildcard copy
        echo Wildcard copy detected
        for %%f in ("!dest!") do (
            if not exist "%%~dpf" mkdir "%%~dpf"
        )
        :: Use copy command for wildcard copies
        for %%i in (!src!) do (
            echo Copying %%i to !dest!
            copy "%%i" "!dest!" >nul 2>&1
            if errorlevel 1 echo Error copying %%i to !dest!
        )
    ) else (
        :: This is a single file or directory copy
        echo Single file/directory copy detected
        for %%f in ("!dest!") do (
            if not exist "%%~dpf" mkdir "%%~dpf"
        )
        :: Check if source is a directory
        if exist "!src!\*" (
            :: Source is a directory, use xcopy without /I flag
            echo Copying directory !src! to !dest!
            xcopy "!src!" "!dest!" /E /Y /Q >nul 2>&1
            if errorlevel 1 echo Error copying directory !src! to !dest!
        ) else (
            :: Source is a file, use copy command
            echo Copying file !src! to !dest!
            copy "!src!" "!dest!" >nul 2>&1
            if errorlevel 1 echo Error copying file !src! to !dest!
        )
    )
)