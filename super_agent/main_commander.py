"""
Main Commander - Exemplo de uso do AutoGen Commander
AutoGen comanda tudo, Open Interpreter pensa e executa localmente
"""
import asyncio
import logging
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

from super_agent.core.autogen_commander import build_commander


async def main():
    """
    Função principal - Testa o Comandante AutoGen v2
    """
    logger.info("=" * 60)
    logger.info("🧠 AutoGen Commander - Inicializando")
    logger.info("=" * 60)
    
    # Criar comandante
    try:
        commander = build_commander(
            model=os.getenv("DEFAULT_MODEL", "deepseek-coder-v2-16b-q4_k_m-rtx"),
            api_base=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        )
        logger.info("✅ Comandante criado com sucesso")
    except Exception as e:
        logger.error(f"❌ Erro ao criar comandante: {e}")
        return
    
    logger.info("=" * 60)
    logger.info("🚀 Comandante ativo")
    logger.info("📡 Open Interpreter está subordinado e com LLM via Ollama")
    logger.info("=" * 60)
    logger.info("")
    
    # Tarefa de teste
    task = """Crie um script Python que:
1) imprime data/hora atual;
2) cria a pasta 'out' no WORKDIR se não existir;
3) grava 'timestamp.txt' em out/ com a data/hora.
Mostre o código e execute."""
    
    logger.info(f"📋 Tarefa: {task}")
    logger.info("")
    
    try:
        # Executar tarefa
        # O AutoGen vai decidir quando usar o Open Interpreter
        result = await commander.run(task)
        
        logger.info("")
        logger.info("=" * 60)
        logger.info("✅ Resultado Final:")
        logger.info("=" * 60)
        logger.info(result)
        logger.info("=" * 60)
    
    except Exception as e:
        logger.error(f"❌ Erro ao executar tarefa: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())

