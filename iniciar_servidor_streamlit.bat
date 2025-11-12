@echo off
REM ============================================================================
REM Script para Iniciar Servidores com Streamlit
REM ============================================================================
REM Este script inicia todos os servidores, incluindo o frontend Streamlit
REM ============================================================================

echo.
echo ============================================================================
echo   Iniciando Servidores (Incluindo Streamlit)
echo ============================================================================
echo.

REM Chamar o script principal com --streamlit
call iniciar_servidor.bat --streamlit

