import json
from openai import OpenAI
from typing import Literal, TypedDict

# O cliente OpenAI já está configurado com a chave e base URL via variáveis de ambiente
client = OpenAI()

# Definir o tipo de retorno estruturado
class IntentClassification(TypedDict):
    intent: Literal['execution', 'conversation']
    reasoning: str
    action_type: Literal['code', 'web', 'file', 'search', 'general'] | None

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
    "action_type": "code" | "web" | "file" | "search" | "general" | null
}}

O campo 'action_type' DEVE ser preenchido APENAS se a intenção for 'execution'. Caso contrário, deve ser null.
- 'code': Pedido para escrever, rodar ou debugar código.
- 'web': Pedido para navegar ou pesquisar na web.
- 'file': Pedido para ler, escrever ou manipular arquivos.
- 'search': Pedido para buscar informações (se não for uma pesquisa na web).
- 'general': Qualquer outra ação de execução que não se encaixe nas categorias acima.

Exemplos:
Usuário: "Olá, tudo bem?"
JSON: {{"intent": "conversation", "reasoning": "É uma saudação.", "action_type": null}}

Usuário: "Crie um script Python para listar arquivos."
JSON: {{"intent": "execution", "reasoning": "O usuário pediu para criar um script Python.", "action_type": "code"}}

Usuário: "Qual a capital da França?"
JSON: {{"intent": "conversation", "reasoning": "É uma pergunta factual que requer apenas uma resposta.", "action_type": null}}

Usuário: "Pesquise as últimas notícias sobre IA."
JSON: {{"intent": "execution", "reasoning": "O usuário pediu para pesquisar na web.", "action_type": "web"}}
"""

def classify_intent_llm(message: str) -> IntentClassification:
    """
    Classifica a intenção do usuário usando um LLM com saída estruturada em JSON.
    """
    try:
        response = client.chat.completions.create(
            model="gemini-2.5-flash", # Voltando para o modelo mais rápido
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": message}
            ],
            response_format={"type": "json_object"}
        )
        
        # O LLM deve retornar um JSON válido
        json_output = response.choices[0].message.content
        # print(f"--- Saída Bruta do LLM: {json_output} ---") # Removendo print de debug
        classification = json.loads(json_output)
        
        # Validação básica do esquema
        if classification.get('intent') in ['execution', 'conversation']:
            return classification
        else:
            # Fallback para o caso de o LLM não seguir o esquema estritamente
            return {
                "intent": "conversation",
                "reasoning": "Fallback: O LLM não retornou um JSON válido ou a intenção esperada.",
                "action_type": None
            }

    except Exception as e:
        # print(f"Erro na classificação LLM: {e}") # Removendo print de debug
        # Em caso de erro, o padrão é tratar como conversa para evitar execuções indesejadas
        return {
            "intent": "conversation",
            "reasoning": f"Erro interno na chamada do LLM. O modelo não conseguiu classificar a intenção de forma estruturada.",
            "action_type": None
        }

if __name__ == '__main__':
    # Testes de exemplo
    print("--- Teste 1: Conversação ---")
    result1 = classify_intent_llm("Oi, como você está hoje?")
    print(json.dumps(result1, indent=2, ensure_ascii=False))

    print("\n--- Teste 2: Execução (Código) ---")
    result2 = classify_intent_llm("Escreva um script em bash para fazer o backup do meu diretório home.")
    print(json.dumps(result2, indent=2, ensure_ascii=False))

    print("\n--- Teste 3: Execução (Web) ---")
    result3 = classify_intent_llm("Quero saber o placar do último jogo do meu time.")
    print(json.dumps(result3, indent=2, ensure_ascii=False))

    print("\n--- Teste 4: Pergunta com Nuance (Conversação) ---")
    result4 = classify_intent_llm("Você pode me explicar o que é a teoria da relatividade, por favor?")
    print(json.dumps(result4, indent=2, ensure_ascii=False))

    print("\n--- Teste 5: Comando Direto (Execução/File) ---")
    result5 = classify_intent_llm("Leia o conteúdo do arquivo 'config.yaml'.")
    print(json.dumps(result5, indent=2, ensure_ascii:False))
