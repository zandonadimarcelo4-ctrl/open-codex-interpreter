"""
AutoGen v2 Orchestrator - Script Python para ser chamado do TypeScript
Este script permite que o TypeScript chame o AutoGen v2 Python que orquestra TUDO

⚠️ IMPORTANTE: AutoGen v2 (Python) comanda TUDO - sem conflitos
- Orquestra todos os agentes
- Controla todas as ferramentas (Open Interpreter, UFO, Browser-Use, etc.)
- Gerencia memória ChromaDB
- Integra sistema cognitivo ANIMA
- Executa código, comandos, arquivos, etc.
"""
import sys
import json
import os
import asyncio
from pathlib import Path

# Adicionar caminho do super_agent
super_agent_path = Path(__file__).parent.parent.resolve()
sys.path.insert(0, str(super_agent_path))

# Configurar variáveis de ambiente
os.environ.setdefault("OLLAMA_BASE_URL", os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"))
os.environ.setdefault("DEFAULT_MODEL", os.getenv("DEFAULT_MODEL", "deepseek-coder-v2-16b-q4_k_m-rtx"))

try:
    from super_agent.core.orchestrator import SuperAgentOrchestrator, SuperAgentConfig
    
    async def main():
        # Ler payload do stdin
        payload_str = sys.stdin.read()
        payload = json.loads(payload_str)
        
        # Configurar AutoGen v2
        config = SuperAgentConfig(
            autogen_model=payload.get("model", "deepseek-coder-v2-16b-q4_k_m-rtx"),
            autogen_base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            autogen_api_key=None,  # Usar Ollama
            workspace=Path(os.getcwd()),
            memory_enabled=True,
            chromadb_path=Path(os.getcwd()) / "super_agent" / "memory",
            open_interpreter_enabled=True,
            open_interpreter_auto_run=True,
            ufo_enabled=False,  # Desabilitar por enquanto (sem sandbox)
            multimodal_enabled=False,
            enable_generator=True,
            enable_critic=True,
            enable_planner=True,
            enable_executor=True,
        )
        
        # Criar orchestrator
        orchestrator = SuperAgentOrchestrator(config)
        
        # Executar tarefa
        try:
            result = await orchestrator.execute(
                task=payload["task"],
                context=payload.get("context", {})
            )
            
            # Retornar resultado
            response = {
                "success": True,
                "result": str(result.get("result", result)),
                "executionTime": result.get("executionTime", 0),
                "agent": result.get("agent", "autogen_v2"),
                "tools": result.get("tools", [])
            }
            print(json.dumps(response))
            
        except Exception as e:
            response = {
                "success": False,
                "error": str(e)
            }
            print(json.dumps(response))
            sys.exit(1)
    
    # Executar async
    if __name__ == "__main__":
        asyncio.run(main())
        
except ImportError as e:
    response = {
        "success": False,
        "error": f"AutoGen v2 não disponível: {e}. Execute: pip install autogen-agentchat autogen-ext[ollama] chromadb"
    }
    print(json.dumps(response))
    sys.exit(1)
except Exception as e:
    response = {
        "success": False,
        "error": f"Erro ao executar: {e}"
    }
    print(json.dumps(response))
    sys.exit(1)

