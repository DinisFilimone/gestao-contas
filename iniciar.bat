@echo off
chcp 65001 >nul
title Gestao de Contas - Arranque do Ambiente de Desenvolvimento

echo ========================================================
echo A iniciar o ambiente de desenvolvimento (Gestao de Contas)...
echo ========================================================

:: 1. Parar eventuais instancias anteriores para evitar conflitos
echo [1/2] A limpar contentores anteriores...
docker compose down >nul 2>&1

:: 2. Subir toda a aplicacao via Docker (Base de Dados, Backend na 8081 e Frontend na 4201)
echo [2/2] A iniciar todos os servicos via Docker...
docker compose up --build -d

echo ========================================================
echo Processo concluido com sucesso! 
echo - Frontend (Browser): http://localhost:4201
echo - Backend (API):      http://localhost:8081
echo ========================================================

:: 3. Abrir automaticamente o browser na pagina da aplicacao
timeout /t 3 /nobreak >nul
start http://localhost:4201

pause