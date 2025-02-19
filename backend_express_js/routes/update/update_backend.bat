@echo off


:: Notify the user about starting the process
echo Updating backend repository...

:: Clean up the repository (reset changes and remove untracked files)
echo Cleaning backend repository...
git reset --hard HEAD
git clean -fd

:: Pull the latest changes from the main branch
echo Pulling latest changes from backend repository...
git pull origin main

:: Check if the pull was successful
IF %ERRORLEVEL% EQU 0 (
    echo backend repository updated successfully.
) ELSE (
    echo Failed to update backend repository. Please check for issues.
    exit /b 1
)

:: Install backend dependencies (if necessary)
echo Installing backend dependencies...
npm install

:: Check if npm install was successful
IF %ERRORLEVEL% EQU 0 (
    echo backend dependencies installed successfully.
) ELSE (
    echo Failed to install backend dependencies. Please check for issues.
    exit /b 1
)

:: Verify installed packages
echo Verifying installed packages...
npm list --depth=0

:: Run npm audit fix to address vulnerabilities (optional)
echo Running npm audit fix to address vulnerabilities...
npm audit fix

:: Final success message when all steps are complete
echo backend update completed successfully.
