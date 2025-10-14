@echo off
echo ==========================================
echo   Comprehensive Office Test Data Generator
echo ==========================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js first: https://nodejs.org/
    pause
    exit /b 1
)

:: Check if server is running
echo Checking if server is running on localhost:3004...
curl -s http://localhost:3004 >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Server is not running on localhost:3004
    echo Please start your development server first:
    echo   cd "D:\internship\account sql\accounting-app"
    echo   npm run dev
    pause
    exit /b 1
)

echo Server is running! Starting data population...
echo.

:: Run the Node.js script
node populate-test-data.js

echo.
echo ==========================================
echo Process completed! Check the results above.
echo ==========================================
echo.
echo Next steps:
echo 1. Go to http://localhost:3004/accounts to see your accounts
echo 2. Go to http://localhost:3004/transactions to see transactions
echo 3. Go to http://localhost:3004/reports to see beautiful charts!
echo.
pause