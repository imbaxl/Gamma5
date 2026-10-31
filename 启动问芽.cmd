@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Please run npm install first.
  pause
  exit /b 1
)
echo Open http://127.0.0.1:3210 in your browser.
npm start
