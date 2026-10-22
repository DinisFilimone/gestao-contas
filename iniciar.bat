@echo off
cd /d "%~dp0"

echo A iniciar a base de dados...
docker compose up -d
timeout /t 5 /nobreak >nul

echo A iniciar a API e o frontend...
start "API (Spring Boot)" cmd /k "cd /d backend && gradle bootRun"
start "Frontend (Angular)" cmd /k "cd /d frontend && ng serve --open"