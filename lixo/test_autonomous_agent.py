"""
Script de teste para AutonomousInterpreterAgent

Testa a reutilização completa do Open Interpreter dentro do AutoGen.
"""
import asyncio
import os
import sys
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Adicionar super_agent ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "super_agent"))

try:
    from super_agent.core.llm_client import get_llm_client
    from super_agent.agents.autonomous_interpreter_agent import create_autonomous_interpreter_agent
    IMPORTS_AVAILABLE = True
except ImportError as e:
    logger.error(f"Erro ao importar módulos: {e}")
    IMPORTS_AVAILABLE = False


async def test_autonomous_agent():
    """Testa o agente autônomo"""
    if not IMPORTS_AVAILABLE:
        logger.error("Imports não disponíveis. Verifique se os módulos foram copiados corretamente.")
        return
    
    try:
        # Criar model_client
        logger.info("🔧 Criando model_client...")
        model_client = get_llm_client()
        logger.info("✅ Model_client criado")
        
        # Criar agente autônomo
        logger.info("🔧 Criando AutonomousInterpreterAgent...")
        workdir = os.path.join(os.path.dirname(__file__), "test_workspace")
        os.makedirs(workdir, exist_ok=True)
        
        agent = create_autonomous_interpreter_agent(
            model_client=model_client,
            workdir=workdir,
            auto_run=True,
            max_retries=3,
        )
        logger.info("✅ AutonomousInterpreterAgent criado")
        
        # Teste 1: Executar código Python simples
        logger.info("\n🧪 Teste 1: Executar código Python simples")
        test_prompt = "Crie um script Python que calcula 2 + 2 e imprime o resultado"
        
        try:
            response = await agent.process_message(test_prompt)
            logger.info(f"✅ Resposta recebida: {response[:200]}...")
        except Exception as e:
            logger.error(f"❌ Erro no teste 1: {e}")
            import traceback
            logger.error(traceback.format_exc())
        
        # Teste 2: Executar código com erro (testar auto-correção)
        logger.info("\n🧪 Teste 2: Executar código com erro (testar auto-correção)")
        test_prompt_error = "Crie um script Python que tenta calcular 10 / 0 e trata o erro"
        
        try:
            response = await agent.process_message(test_prompt_error)
            logger.info(f"✅ Resposta recebida: {response[:200]}...")
        except Exception as e:
            logger.error(f"❌ Erro no teste 2: {e}")
            import traceback
            logger.error(traceback.format_exc())
        
        logger.info("\n✅ Testes concluídos!")
        
    except Exception as e:
        logger.error(f"❌ Erro geral: {e}")
        import traceback
        logger.error(traceback.format_exc())


if __name__ == "__main__":
    asyncio.run(test_autonomous_agent())

