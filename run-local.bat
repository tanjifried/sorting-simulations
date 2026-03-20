@echo off
set PORT=%1
if "%PORT%"=="" set PORT=8080

echo Starting local server at http://localhost:%PORT%
echo Press Ctrl+C to stop

python -m http.server %PORT%
