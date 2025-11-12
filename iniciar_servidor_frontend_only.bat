@echo off
REM ============================================================================
REM Script para Iniciar Apenas o Frontend React
REM ============================================================================
REM Este script inicia apenas o servidor TypeScript (frontend React)
REM ============================================================================

echo.
echo ============================================================================
echo   Iniciando Apenas o Frontend React
echo ============================================================================
echo.

REM Chamar o script principal apenas com frontend
call iniciar_servidor.bat --no-backend

