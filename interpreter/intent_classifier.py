"""
Intent Classifier - Classificador de Intenção Baseado em LLM
Usa Ollama local para classificar intenções de forma robusta
"""
import json
import os
import logging
from typing import Literal, TypedDict, Optional

logger = logging.getLogger(__name__)

# Definir o tipo de retorno estruturado
class IntentClassification(TypedDict):
    intent: Literal['execution', 'conversation']
    reasoning: str
    action_type: Literal['code', 'web', 'file', 'search', 'general'] | None
    confidence: float

# Prompt de sistema para guiar o LLM na classificação
SYSTEM_PROMPT = """
Você é um classificador de intenção de alto desempenho para um Agente de IA.
Sua única função é analisar a mensagem do usuário e classificá-la estritamente em uma das duas categorias: 'execution' ou 'conversation'.

1.  **'execution'**: A mensagem indica que o usuário deseja que o Agente de IA **execute uma ação**, como escrever código, rodar um script, pesquisar na web, manipular arquivos, ou qualquer tarefa que exija o uso de ferramentas ou a geração de código.
2.  **'conversation'**: A mensagem é uma pergunta, saudação, comentário, feedback, ou qualquer interação que exija apenas uma **resposta em linguagem natural**, sem a necessidade de execução de código ou ferramentas.

Você DEVE responder APENAS com um objeto JSON que siga o seguinte esquema:
{{
    "intent": "execution" | "conversation",
    "reasoning": "Breve explicação do porquê você escolheu esta intenção.",
    "action_type": "code" | "web" | "file" | "search" | "general" | null,
    "confidence": 0.0-1.0
}}

O campo 'action_type' DEVE ser preenchido APENAS se a intenção for 'execution'. Caso contrário, deve ser null.
- 'code': Pedido para escrever, rodar ou debugar código.
- 'web': Pedido para navegar ou pesquisar na web.
- 'file': Pedido para ler, escrever ou manipular arquivos.
- 'search': Pedido para buscar informações (se não for uma pesquisa na web).
- 'general': Qualquer outra ação de execução que não se encaixe nas categorias acima.

O campo 'confidence' deve ser um número entre 0.0 e 1.0 indicando a confiança na classificação.

Exemplos:
Usuário: "Olá, tudo bem?"
JSON: {{"intent": "conversation", "reasoning": "É uma saudação.", "action_type": null, "confidence": 0.95}}

Usuário: "Crie um script Python para listar arquivos."
JSON: {{"intent": "execution", "reasoning": "O usuário pediu para criar um script Python.", "action_type": "code", "confidence": 0.95}}

Usuário: "Qual a capital da França?"
JSON: {{"intent": "conversation", "reasoning": "É uma pergunta factual que requer apenas uma resposta.", "action_type": null, "confidence": 0.90}}

Usuário: "Pesquise as últimas notícias sobre IA."
JSON: {{"intent": "execution", "reasoning": "O usuário pediu para pesquisar na web.", "action_type": "web", "confidence": 0.95}}

Usuário: "Eu não quero que você crie um arquivo"
JSON: {{"intent": "conversation", "reasoning": "O usuário está negando uma ação, não pedindo para executar.", "action_type": null, "confidence": 0.90}}

Usuário: "Olá, você pode criar um script Python para mim?"
JSON: {{"intent": "execution", "reasoning": "Mesmo com saudação, o usuário está pedindo para criar um script.", "action_type": "code", "confidence": 0.85}}
"""


def classify_intent_llm(message: str, model: Optional[str] = None, base_url: Optional[str] = None) -> IntentClassification:
    """
    Classifica a intenção do usuário usando um LLM local (Ollama) com saída estruturada em JSON.
    
    Args:
        message: Mensagem do usuário para classificar
        model: Modelo Ollama a usar (padrão: do ambiente)
        base_url: URL base do Ollama (padrão: http://localhost:11434)
    
    Returns:
        Classificação da intenção com intent, reasoning, action_type e confidence
    """
    try:
        import requests
        
        # Configurar modelo e URL
        base_url = base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        
        # Modelos de fallback para classificação de intenção (pequenos e rápidos)
        # Prioridade: modelos leves e rápidos que seguem bem instruções JSON
        # Ordem: do menor/mais rápido para o maior (último recurso)
        intent_classifier_models = [
            model,  # Modelo fornecido explicitamente
            os.getenv("INTENT_CLASSIFIER_MODEL"),  # Modelo específico para classificação
            "mistral:7b-instruct",  # RECOMENDADO: Leve, rápido, bom em JSON estruturado (4.4 GB instalado)
            "phi3:mini",  # Mais rápido: modelo muito pequeno (2.2 GB instalado)
            "qwen2.5-coder:7b",  # Alternativa rápida (4.7 GB instalado)
            "qwen2.5:7b-instruct",  # Alternativa estável (4.7 GB instalado)
            "llama3.1:8b",  # Alternativa estável (4.9 GB instalado)
            "qwen2.5-coder:7b-instruct",  # Alternativa para código (4.7 GB instalado)
            "llama3.2:3b",  # Modelo muito pequeno (se disponível)
            "deepseek-coder:6.7b",  # Alternativa pequena (se disponível)
            os.getenv("DEFAULT_MODEL"),  # Modelo padrão do sistema (último recurso, pode ser grande)
        ]
        
        # Remover None e valores duplicados
        intent_classifier_models = [m for m in intent_classifier_models if m]
        intent_classifier_models = list(dict.fromkeys(intent_classifier_models))  # Remove duplicatas mantendo ordem
        
        # Prompt para o LLM
        user_prompt = f"""Analise a seguinte mensagem do usuário e classifique a intenção:

Mensagem: "{message}"

Responda APENAS com um objeto JSON válido seguindo o esquema:
{{
    "intent": "execution" | "conversation",
    "reasoning": "explicação breve",
    "action_type": "code" | "web" | "file" | "search" | "general" | null,
    "confidence": 0.0-1.0
}}"""

        # Tentar cada modelo até um funcionar
        last_error = None
        response = None
        successful_model = None
        
        for attempt_model in intent_classifier_models:
            if not attempt_model:
                continue
            try:
                # Chamar Ollama
                response = requests.post(
                    f"{base_url}/api/chat",
                    json={
                        "model": attempt_model,
                        "messages": [
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": user_prompt}
                        ],
                        "format": "json",
                        "stream": False,
                        "options": {
                            "temperature": 0.1,  # Baixa temperatura para classificação mais consistente
                            "num_predict": 200,  # Resposta curta (apenas JSON)
                        }
                    },
                    timeout=60  # Timeout aumentado para modelos que podem demorar mais
                )
                
                if response.status_code == 200:
                    # Sucesso! Usar este modelo
                    successful_model = attempt_model
                    logger.info(f"✅ Classificador usando modelo: {attempt_model}")
                    break
                elif response.status_code == 404:
                    # Modelo não encontrado, tentar próximo
                    last_error = f"Modelo '{attempt_model}' não encontrado"
                    logger.warning(f"⚠️ Modelo '{attempt_model}' não disponível, tentando próximo...")
                    response = None  # Resetar response para próxima tentativa
                    continue
                else:
                    last_error = f"Erro {response.status_code}: {response.text}"
                    logger.error(f"❌ Erro na chamada Ollama com modelo {attempt_model}: {response.status_code} - {response.text}")
                    response = None  # Resetar response para próxima tentativa
                    continue
            except requests.exceptions.Timeout:
                last_error = f"Timeout ao chamar modelo '{attempt_model}'"
                logger.warning(f"⏱️ Timeout ao chamar Ollama com modelo {attempt_model}")
                response = None
                continue
            except requests.exceptions.RequestException as e:
                last_error = f"Erro de conexão: {str(e)}"
                logger.warning(f"⚠️ Erro ao chamar Ollama com modelo {attempt_model}: {e}")
                response = None
                continue
        
        # Se nenhum modelo funcionou, lançar erro
        if response is None or response.status_code != 200:
            logger.error(f"❌ Todos os modelos falharam. Último erro: {last_error}")
            raise Exception(f"Erro ao chamar Ollama para classificação de intenção: {last_error}")
        
        result = response.json()
        json_output = result.get("message", {}).get("content", "{}")
        
        # Tentar extrair JSON da resposta (pode vir com markdown ou texto extra)
        json_output = json_output.strip()
        
        # Remover markdown code blocks
        if "```json" in json_output:
            json_output = json_output.split("```json")[1].split("```")[0].strip()
        elif json_output.startswith("```"):
            json_output = json_output[3:]
            if json_output.endswith("```"):
                json_output = json_output[:-3]
            json_output = json_output.strip()
        
        # Tentar extrair JSON se houver texto antes/depois
        import re
        json_match = re.search(r'\{[^{}]*"intent"[^{}]*\}', json_output)
        if json_match:
            json_output = json_match.group(0)
        
        # Parse JSON
        try:
            classification = json.loads(json_output)
        except json.JSONDecodeError:
            # Tentar encontrar JSON em qualquer lugar da resposta
            json_match = re.search(r'\{.*"intent".*\}', json_output, re.DOTALL)
            if json_match:
                json_output = json_match.group(0)
                classification = json.loads(json_output)
            else:
                raise json.JSONDecodeError("JSON não encontrado na resposta", json_output, 0)
        
        # Validação e normalização
        intent = classification.get('intent', 'conversation')
        if intent not in ['execution', 'conversation']:
            intent = 'conversation'
        
        action_type = classification.get('action_type')
        if intent == 'conversation':
            action_type = None
        elif action_type not in ['code', 'web', 'file', 'search', 'general']:
            action_type = 'general'
        
        confidence = classification.get('confidence', 0.8)
        if not isinstance(confidence, (int, float)) or confidence < 0 or confidence > 1:
            confidence = 0.8
        
        reasoning = classification.get('reasoning', 'Classificação automática')
        
        return {
            "intent": intent,
            "reasoning": reasoning,
            "action_type": action_type,
            "confidence": float(confidence)
        }

    except json.JSONDecodeError as e:
        logger.error(f"Erro ao decodificar JSON da resposta do LLM: {e}")
        logger.error(f"Resposta recebida: {json_output[:500] if 'json_output' in locals() else 'N/A'}")
        # Fallback seguro
        return {
            "intent": "conversation",
            "reasoning": "Erro ao decodificar resposta do LLM. Tratando como conversa por segurança.",
            "action_type": None,
            "confidence": 0.5
        }
    
    except Exception as e:
        logger.error(f"Erro na classificação LLM: {e}")
        # Em caso de erro, o padrão é tratar como conversa para evitar execuções indesejadas
        return {
            "intent": "conversation",
            "reasoning": f"Erro interno na chamada do LLM: {str(e)}",
            "action_type": None,
            "confidence": 0.5
        }


def classify_intent_hybrid(message: str, use_llm_threshold: float = 0.7) -> IntentClassification:
    """
    Classificação híbrida: usa regras rápidas primeiro, LLM apenas se necessário.
    
    Args:
        message: Mensagem do usuário para classificar
        use_llm_threshold: Confiança mínima das regras para usar LLM (padrão: 0.7)
    
    Returns:
        Classificação da intenção
    """
    # Detecção rápida baseada em regras
    lower_message = message.lower().strip()
    
    # Padrões de alta confiança para conversa (não precisa de LLM)
    conversation_patterns = [
        r'^(oi|olá|hello|hi|hey)\s*$',
        r'^(tudo bem|tudo bom|como vai|como está)\s*\??$',
        r'^(obrigado|obrigada|thanks|thank you|valeu)\s*$',
        r'^(tchau|até logo|bye|see you)\s*$',
    ]
    
    import re
    for pattern in conversation_patterns:
        if re.match(pattern, lower_message):
            return {
                "intent": "conversation",
                "reasoning": "Padrão de conversa detectado (regras)",
                "action_type": None,
                "confidence": 0.95
            }
    
    # Padrões de alta confiança para execução (não precisa de LLM)
    execution_patterns = [
        r'(criar|escrever|fazer|executar|rodar)\s+(script|código|arquivo|programa)',
        r'(abrir|abre)\s+(aplicativo|programa|arquivo|vs code|code)',
        r'(instalar|baixar|executar)\s+[^\s]+',
        r'```[\s\S]*```',  # Código em markdown
        r'https?://',  # URL
    ]
    
    for pattern in execution_patterns:
        if re.search(pattern, lower_message):
            action_type = 'code' if 'código' in lower_message or 'script' in lower_message or '```' in message else 'general'
            if 'http' in lower_message or 'url' in lower_message:
                action_type = 'web'
            if 'arquivo' in lower_message or 'file' in lower_message:
                action_type = 'file'
            
            return {
                "intent": "execution",
                "reasoning": "Padrão de execução detectado (regras)",
                "action_type": action_type,
                "confidence": 0.90
            }
    
    # Casos ambíguos ou complexos: usar LLM
    return classify_intent_llm(message)


if __name__ == '__main__':
    # Testes de exemplo
    import sys
    
    if len(sys.argv) > 1:
        message = " ".join(sys.argv[1:])
    else:
        message = "Olá, como você está?"
    
    print(f"=== Classificando: '{message}' ===\n")
    
    # Teste híbrido
    result = classify_intent_hybrid(message)
    print("Resultado (Híbrido):")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    
    print("\n=== Testes Adicionais ===\n")
    
    test_cases = [
        "Oi, como você está hoje?",
        "Escreva um script em bash para fazer o backup do meu diretório home.",
        "Quero saber o placar do último jogo do meu time.",
        "Você pode me explicar o que é a teoria da relatividade, por favor?",
        "Leia o conteúdo do arquivo 'config.yaml'.",
        "Eu não quero que você crie um arquivo",
        "Olá, você pode criar um script Python para mim?",
    ]
    
    for test_message in test_cases:
        print(f"\n--- Teste: '{test_message}' ---")
        result = classify_intent_hybrid(test_message)
        print(json.dumps(result, indent=2, ensure_ascii=False))
