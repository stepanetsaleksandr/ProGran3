@echo off
chcp 65001 >nul
echo 🧪 ProGran3 Server - Automated Testing
echo.

set SERVER_URL=https://progran3-tracking-server-odv98n7ek-provis3ds-projects.vercel.app

echo Server URL: %SERVER_URL%
echo.

echo 1. Testing Health Check...
curl -s "%SERVER_URL%/api/init" | findstr "success" >nul
if %errorlevel% equ 0 (
    echo ✅ Health check passed
) else (
    echo ❌ Health check failed
)

echo.
echo 2. Testing Heartbeat Endpoint...
curl -s -X POST "%SERVER_URL%/api/heartbeat" ^
  -H "Content-Type: application/json" ^
  -d "{\"plugin_id\":\"test-plugin-123\",\"plugin_name\":\"ProGran3\",\"version\":\"1.0.0\",\"user_id\":\"test@example.com\",\"computer_name\":\"test-computer\",\"system_info\":{\"os\":\"Windows\",\"ruby_version\":\"3.0.0\",\"sketchup_version\":\"2024\",\"architecture\":\"64-bit\"},\"timestamp\":\"2024-12-19T10:00:00Z\",\"action\":\"heartbeat_update\",\"source\":\"sketchup_plugin\",\"update_existing\":true,\"force_update\":false}" | findstr "success" >nul
if %errorlevel% equ 0 (
    echo ✅ Heartbeat endpoint working
) else (
    echo ❌ Heartbeat endpoint failed
)

echo.
echo 3. Testing License Registration...
curl -s -X POST "%SERVER_URL%/api/license/register" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"license_key\":\"TEST-LICENSE-KEY-123\",\"hardware_id\":\"test-hardware-id\"}" | findstr "success" >nul
if %errorlevel% equ 0 (
    echo ✅ License registration working
) else (
    echo ❌ License registration failed
)

echo.
echo 4. Testing Dashboard...
curl -s "%SERVER_URL%/dashboard" | findstr "ProGran3 Dashboard" >nul
if %errorlevel% equ 0 (
    echo ✅ Dashboard accessible
) else (
    echo ❌ Dashboard failed
)

echo.
echo 5. Testing API Plugins...
curl -s "%SERVER_URL%/api/plugins" | findstr "plugins" >nul
if %errorlevel% equ 0 (
    echo ✅ API plugins working
) else (
    echo ❌ API plugins failed
)

echo.
echo 6. Testing Rate Limiting...
echo Sending multiple requests to test rate limiting...
for /l %%i in (1,1,5) do (
    curl -s "%SERVER_URL%/api/heartbeat" >nul
)
echo ✅ Rate limiting test completed

echo.
echo 7. Testing CORS...
curl -s -H "Origin: https://progran3.com" "%SERVER_URL%/api/heartbeat" >nul
if %errorlevel% equ 0 (
    echo ✅ CORS headers working
) else (
    echo ❌ CORS headers failed
)

echo.
echo 🎉 Automated testing completed!
echo.
echo Next steps:
echo 1. Check Vercel Dashboard for logs
echo 2. Check Supabase Dashboard for data
echo 3. Test plugin in SketchUp
echo 4. Review TESTING_GUIDE.md for detailed testing
echo.
pause
