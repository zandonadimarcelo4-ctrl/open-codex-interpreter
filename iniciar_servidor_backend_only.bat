@echo off
REM ============================================================================
REM Script para Iniciar Apenas o Backend Python
REM ============================================================================
REM Este script inicia apenas o backend Python (FastAPI)
REM ============================================================================

echo.
echo ============================================================================
echo   Iniciando Apenas o Backend Python
echo ============================================================================
echo.

REM Chamar o script principal apenas com backend
call iniciar_servidor.bat --no-frontend --no-build

