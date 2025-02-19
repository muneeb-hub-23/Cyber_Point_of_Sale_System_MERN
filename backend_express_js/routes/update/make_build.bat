@echo off
:: Change to the frontend directory
cd ../../../cyber_khata_frontend

:: Notify the user about starting the build process
echo Starting the build process for frontend...

:: Run the build process for frontend
echo Running frontend build process...
npm run build

:: Check if the build process was successful
IF %ERRORLEVEL% EQU 0 (
    echo Frontend build completed successfully.
) ELSE (
    echo Frontend build failed. Please check for errors.
    exit /b 1
)

:: Final success message when all steps are complete
echo Frontend build completed successfully.
