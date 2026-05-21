@echo off
echo ========================================
echo   MD Code - Test Suite
echo ========================================
echo.
echo Running main.cjs tests...
node test\test_main_cjs.cjs
if %ERRORLEVEL% neq 0 echo FAILED: main.cjs tests & exit /b 1
echo.
echo Running app.js tests...
node test\test_app_js.cjs
if %ERRORLEVEL% neq 0 echo FAILED: app.js tests & exit /b 1
echo.
echo ========================================
echo   ALL TESTS PASSED
echo ========================================
pause
