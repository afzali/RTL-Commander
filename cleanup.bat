@echo off
echo RTL Commander - Cleanup Script
echo ==============================
echo.
echo This script will remove the legacy files that are no longer needed
echo after the migration to the modular structure.
echo.
echo Files to be removed:
echo  - background.js
echo  - content.js
echo  - popup\popup.js
echo.
set /p CONFIRM=Are you sure you want to proceed? (Y/N): 

if /i "%CONFIRM%"=="Y" (
    echo.
    echo Removing legacy files...
    
    if exist background.js (
        del background.js
        echo - background.js removed
    ) else (
        echo - background.js not found
    )
    
    if exist content.js (
        del content.js
        echo - content.js removed
    ) else (
        echo - content.js not found
    )
    
    if exist popup\popup.js (
        del popup\popup.js
        echo - popup\popup.js removed
    ) else (
        echo - popup\popup.js not found
    )
    
    echo.
    echo Cleanup completed successfully!
) else (
    echo.
    echo Cleanup cancelled.
)

echo.
pause
