@echo off

cd ../../../cyber_khata_frontend
:: Notify the user about starting the process
echo Updating frontend repository...

:: Clean up the repository (reset changes and remove untracked files)
echo Cleaning frontend repository...
git reset --hard HEAD
git clean -fd

:: Pull the latest changes from the main branch
echo Pulling latest changes from frontend repository...
git pull origin main

:: Check if the pull was successful
IF %ERRORLEVEL% EQU 0 (
    echo frontend repository updated successfully.
) ELSE (
    echo Failed to update frontend repository. Please check for issues.
    exit /b 1
)

:: Install frontend dependencies (if necessary)
echo Installing frontend dependencies...
npm install

:: Check if npm install was successful
IF %ERRORLEVEL% EQU 0 (
    echo frontend dependencies installed successfully.
) ELSE (
    echo Failed to install frontend dependencies. Please check for issues.
    exit /b 1
)

:: Verify installed packages
echo Verifying installed packages...
npm list --depth=0

:: Run npm audit fix to address vulnerabilities (optional)
echo Running npm audit fix to address vulnerabilities...
npm audit fix

:: Final success message when all steps are complete
echo frontend update completed successfully.
