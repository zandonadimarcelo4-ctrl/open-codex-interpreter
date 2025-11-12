#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para organizar arquivos do projeto em categorias
"""

import os
import shutil
from pathlib import Path

# Diretório raiz do projeto
ROOT = Path(__file__).parent

# Categorias de arquivos
CATEGORIAS = {
    'docs/iniciantes': [
        'COMECE_AQUI.md',
        'COMO_PROGRAMAR.md',
        'ONDE_ESTAMOS.md',
        'GUIA_PARA_INICIANTES.md',
        'EXEMPLO_PRATICO.md',
        'GUIA_TYPESCRIPT_PARA_INICIANTES.md',
        'GUIA_PYTHON_PURO.md',
        'BACKEND_PYTHON_SIMPLES.md',
        'DIAGRAMA_VISUAL.md',
        'PRIMEIRO_PASSO.md',
        'COMO_INICIAR.md',
        'GUIA_DEV_JUNIOR.md',
        'QUICK_START.md',
        'INICIO_RAPIDO.md',
        'INICIO_COMPLETO.md',
        'INICIAR_AGORA.md',
        'INICIAR_MANUAL.md',
        'TESTAR_AGORA.md',
    ],
    'docs/arquitetura': [
        'ARQUITETURA_FINAL.md',
        'ARQUITETURA_HIBRIDA_CLOUD_LOCAL.md',
        'ARQUITETURA_HIBRIDA_QWEN32B.md',
        'AUTOGEN_ANALISE_VERSÃO.md',
        'AUTOGEN_COMANDA_TUDO.md',
        'AUTOGEN_V2_COMANDA_TUDO.md',
        'RESUMO_BACKEND_PYTHON.md',
        'RESUMO_SIMPLIFICACAO.md',
        'RESUMO_ATUALIZACAO_AUTOGEN_V2.md',
        'STATUS_FINAL.md',
        'STATUS_ATUAL.md',
        'STATUS_IMPLEMENTACAO.md',
        'STATUS_SERVIDORES.md',
        'STATUS_SINCRONIZACAO.md',
        'STATUS_50_ETAPAS.md',
        'MENOS_TYPESCRIPT_POSSIVEL.md',
        'NADA_PERDIDO.md',
        'O_QUE_FOI_CRIADO.md',
        'SIMPLIFICACAO_COMPLETA.md',
        'SIMPLIFICACAO_IMPLEMENTADA.md',
        'MIGRACAO_AUTOGEN_V2_COMPLETA.md',
        'MIGRACAO_AUTOGEN_V2.md',
        'FUNCIONALIDADES_STATUS.md',
        'DEPLOY.md',
        'CHANGELOG.md',
        'LEIA-ME.md',
        'README_SETUP_COMPLETO.md',
        'README_TAREFAS.md',
    ],
    'docs/analises': [
        'ANALISE_AGENTICSEEK_OPENMANUS.md',
        'ANALISE_AI_MANUS.md',
        'ANALISE_BROWSER_USE.md',
        'ANALISE_COMPLETA_MANUS.md',
        'ANALISE_COMPLETA_MODELOS_FALLBACK.md',
        'ANALISE_GPT5_CODEX_E_INTEGRACAO_ANIMA.md',
        'ANALISE_MANUS_AI_2025.md',
        'ANALISE_MODELOS_CODER_EXECUTOR.md',
        'ANALISE_NEW_FOLDER.md',
        'ANALISE_OPENAI_CODEX.md',
        'ANALISE_ORCHESTRATOR.md',
        'ANALISE_QWEN3_MODELOS.md',
        'ANALISE_TECNICA_IMPARCIAL.md',
        'ANALISE_THINKING_MODELOS.md',
        'THINKING_VS_INTELIGENCIA.md',
        'THINKING_VS_NON_THINKING.md',
        'MODELOS_RECOMENDADOS_ANALISE.md',
        'ORQUESTRACAO_INTELIGENTE_MODELOS.md',
        'RESUMO_QWEN3_MODELOS.md',
        'RESUMO_THINKING_VS_NON_THINKING.md',
        'RESUMO_REUTILIZACAO_COMPLETA.md',
        'RESUMO_PROGRESSO_RECENTE.md',
        'RESUMO_IMPLEMENTACAO_COGNITIVA.md',
        'RESUMO_IMPLEMENTACOES_RECENTES.md',
        'RESUMO_INTEGRACAO_GPT5_CODEX.md',
        'RESUMO_PROGRESSO_ANIMA.md',
        'RESUMO_FINAL_COGNITIVO.md',
        'ANIMA_BRANDING_MARKETING_KIT.md',
        'ANIMA_COGNITIVE_SYSTEM.md',
        'ANIMA_COMPLETE_OVERVIEW.md',
        'ANIMA_MANIFESTO.md',
        'MANUS_PLUS_PLUS_ARCHITECTURE.md',
        'ROADMAP_MANUS_COMPLETO.md',
        'INTENT_DETECTION_PROJECTS.md',
        'intent_detection_research.md',
    ],
    'docs/instalacao': [
        'INSTALAR_DEEPSEEK_CODER_V2_RTX.md',
        'INSTALAR_RTX_4080_SUPER.md',
        'INSTALACAO_RAPIDA_QWEN32B.md',
        'INSTRUCOES_INSTALACAO_QWEN2.5.md',
        'CONFIGURACAO_OLLAMA_CLOUD_COMPLETA.md',
        'SETUP_FRONTEND_COMPLETO.md',
        'SETUP_GUIDE.md',
        'GUIA_BACKEND_PYTHON.md',
        'GUIA_DEEPSEEK_CODER_V2_OLLAMA.md',
        'GUIA_OLLAMA_CLOUD.md',
        'GUIA_QUANTIZACAO_DEEPSEEK_CODER_V2.md',
        'GUIA_RESOLVER_ERRO_MODELO_OLLAMA.md',
        'VERIFICACAO_MODELO_QUANTIZADO.md',
        'VERIFICAR_GPU_USAGE.md',
        'TESTAR_GPU_RAPIDO.md',
        'MODELO_CONFIGURADO_SUCESSO.md',
        'MODELO_QWEN2.5_SETUP.md',
        'CORRECAO_DEPENDENCIAS.md',
        'CORRECAO_MEMORIA_E_TIMEOUT.md',
        'CORRECAO_OPEN_INTERPRETER.md',
        'CORRECOES_JSON_E_OPEN_INTERPRETER.md',
        'RESUMO_CONFIGURACAO_RTX_4080_SUPER.md',
    ],
    'docs/integracao': [
        'INTEGRACAO_AFTER_EFFECTS_MCP.md',
        'INTEGRACAO_COGNITIVA.md',
        'INTEGRACAO_UFO_PYAUTOGUI.md',
        'QUICK_START_AFTER_EFFECTS_MCP.md',
        'CLASSIFICADOR_INTENCAO_MISTRAL.md',
    ],
    'docs/tarefas': [
        'TAREFAS_DASHBOARD.md',
        'TAREFAS_ORGANIZADAS_POR_NIVEL.md',
        'TAREFAS_POR_PRIORIDADE.md',
        'TAREFAS_POR_UTILIDADE.md',
        'PLANO_DE_ACAO_IMEDIATO.md',
        'PLANO_REUTILIZACAO_COMPLETA.md',
        'PLANO_SIMPLIFICACAO.md',
        'O_QUE_FAZER_COMPARACAO_PRATICA.md',
        'O_QUE_FALTA_PARA_TERMINAR.md',
        'TODAS_TAREFAS_COMPLETAS.md',
        'DECISAO_RAPIDA.md',
        'DECISAO_TECNICA_FINAL.md',
        'FORMA_MAIS_EFICIENTE.md',
        'PROJETO_ESTATICO_PERFEITO.md',
        'PROGRESSO_CONTINUO.md',
        'REUTILIZAR_TODA_LOGICA_OI.md',
        'ROTEIRO_REUTILIZACAO_COMPLETA_SUPERAR_MANUS.md',
        'IMPLEMENTACAO_MELHORIAS.md',
        'IMPLEMENTACAO_REUTILIZACAO_COMPLETA.md',
        'RESPOSTA_REUTILIZACAO_COMPLETA.md',
        'MESMA_INSTANCIA_MODELO.md',
        'MILESTONE_1_RESILIENCIA.md',
    ],
    'lixo': [
        'Downloads.zip',
        'Improving Open Codex Interpreter for Innovation.zip',
        'open-webui-backend.zip',
        # Arquivos TypeScript/TSX soltos na raiz (já estão em autogen_agent_interface/client/src/)
        '3DAgentCard.tsx',
        'AdvancedChatInterface.tsx',
        'AgentTeamVisualization.tsx',
        'AIChatBox.tsx',
        'AnimatedBackground.tsx',
        'App.tsx',
        'ChatInterface.tsx',
        'ComponentShowcase.tsx',
        'DashboardLayout.tsx',
        'DashboardLayoutSkeleton.tsx',
        'ErrorBoundary.tsx',
        'FloatingOrb.tsx',
        'GlassCard.tsx',
        'HeroSection.tsx',
        'Home.tsx',
        'Landing.tsx',
        'ManusDialog.tsx',
        'Map.tsx',
        'NotFound.tsx',
        'ResultsShowcase.tsx',
        'RightPanel.tsx',
        'Showcase.tsx',
        'Sidebar.tsx',
        'TaskExecutionPanel.tsx',
        # Arquivos TypeScript soltos na raiz
        'const.ts',
        'context.ts',
        'cookies.ts',
        'dataApi.ts',
        'dev-server.ts',
        'env.ts',
        'imageGeneration.ts',
        'index.ts',
        'llm.ts',
        'map.ts',
        'main.tsx',
        'notification.ts',
        'oauth.ts',
        'sdk.ts',
        'systemRouter.ts',
        'trpc.ts',
        'useAuth.ts',
        'vite.config.ts',
        'vite.ts',
        'voiceTranscription.ts',
        # Arquivos Python soltos na raiz (provavelmente não utilizados)
        'auths.py',
        'channels.py',
        'chats.py',
        'config.py',
        'constants.py',
        'env.py',
        'feedbacks.py',
        'files.py',
        'folders.py',
        'functions.py',
        'groups.py',
        'knowledge.py',
        'memories.py',
        'messages.py',
        'models.py',
        'notes.py',
        'oauth_sessions.py',
        'prompts.py',
        'tags.py',
        'tasks.py',
        'tools.py',
        'users.py',
        'main.py',
        'temp_interpreter_wrapper.py',
        'test_autonomous_agent.py',
    ],
}

def organizar_arquivos():
    """Organiza arquivos do projeto em categorias"""
    movidos = 0
    nao_encontrados = []
    
    for categoria, arquivos in CATEGORIAS.items():
        categoria_path = ROOT / categoria
        categoria_path.mkdir(parents=True, exist_ok=True)
        
        for arquivo in arquivos:
            origem = ROOT / arquivo
            destino = categoria_path / arquivo
            
            if origem.exists():
                try:
                    # Se o arquivo já existe no destino, não sobrescreve
                    if destino.exists():
                        print(f"[AVISO] {arquivo} ja existe em {categoria}, pulando...")
                        continue
                    
                    shutil.move(str(origem), str(destino))
                    print(f"[OK] Movido: {arquivo} -> {categoria}/")
                    movidos += 1
                except Exception as e:
                    print(f"[ERRO] Erro ao mover {arquivo}: {e}")
            else:
                nao_encontrados.append(arquivo)
    
    print(f"\n[RESUMO]")
    print(f"   [OK] {movidos} arquivos movidos")
    print(f"   [AVISO] {len(nao_encontrados)} arquivos nao encontrados")
    
    if nao_encontrados:
        print(f"\n[AVISO] Arquivos nao encontrados:")
        for arquivo in nao_encontrados:
            print(f"   - {arquivo}")

if __name__ == '__main__':
    import sys
    import io
    # Configurar encoding UTF-8 para stdout
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    print("[INFO] Organizando arquivos do projeto...\n")
    organizar_arquivos()
    print("\n[OK] Organizacao concluida!")

