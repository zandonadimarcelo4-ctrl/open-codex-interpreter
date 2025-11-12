# 🚀 Migração para AutoGen v2 (autogen-agentchat)

## ✅ Status da Migração

A migração para AutoGen v2 foi iniciada. O código agora suporta tanto AutoGen v2 (autogen-agentchat) quanto AutoGen v1 (pyautogen) como fallback.

## 📦 Instalação

Para usar AutoGen v2, instale as dependências:

```bash
pip install autogen-agentchat autogen-ext[openai]
```

Ou usando o requirements.txt atualizado:

```bash
pip install -r super_agent/requirements.txt
```

## 🔄 Mudanças Principais

### 1. Dependências Atualizadas

- **Antes**: `pyautogen>=0.2.0`
- **Agora**: `autogen-agentchat>=0.4.0` e `autogen-ext[openai]>=0.4.0`

### 2. API Modernizada

- **AutoGen v2** usa `AssistantAgent` de `autogen_agentchat.agents`
- **AutoGen v2** usa `RoundRobinTeam` em vez de `GroupChat`
- **AutoGen v2** usa `Model Clients` (OpenAIChatCompletionClient, OllamaChatCompletionClient)
- **AutoGen v2** é totalmente assíncrono

### 3. Compatibilidade

O código detecta automaticamente qual versão está instalada:
- Se `autogen-agentchat` estiver disponível, usa AutoGen v2
- Caso contrário, usa AutoGen v1 (pyautogen) como fallback

## 📝 Exemplo de Uso

### AutoGen v2 (Nova API)

```python
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.teams import RoundRobinTeam
from autogen_ext.models.ollama import OllamaChatCompletionClient

# Criar Model Client
model_client = OllamaChatCompletionClient(
    model="deepseek-r1:8b",
    base_url="http://127.0.0.1:11434"
)

# Criar Agente
agent = AssistantAgent(
    name="assistant",
    model_client=model_client,
    system_message="Você é um assistente útil."
)

# Criar Team
team = RoundRobinTeam(
    agents=[agent],
    max_turns=50
)

# Executar tarefa
result = await team.run(task="Olá, como posso ajudar?")
```

### AutoGen v1 (API Antiga - Fallback)

```python
from autogen import AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager

# Criar agentes
assistant = AssistantAgent(
    name="assistant",
    llm_config={"model": "ollama/deepseek-r1:8b"}
)

user_proxy = UserProxyAgent(
    name="user_proxy",
    human_input_mode="NEVER"
)

# Criar GroupChat
groupchat = GroupChat(
    agents=[assistant, user_proxy],
    messages=[],
    max_round=50
)

manager = GroupChatManager(
    groupchat=groupchat,
    llm_config={"model": "ollama/deepseek-r1:8b"}
)

# Executar tarefa
result = await manager.a_initiate_chat(
    message="Olá, como posso ajudar?",
    recipient=assistant
)
```

## 🔍 Verificação

Para verificar qual versão está sendo usada:

```python
from super_agent.core.autogen_framework import SuperAgentFramework

framework = SuperAgentFramework()
status = framework.get_status()
print(f"Versão AutoGen: {status['autogen_version']}")
```

## 📚 Documentação

- **AutoGen v2**: https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/index.html
- **Migration Guide**: https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/migration-guide.html

## ⚠️ Notas

1. AutoGen v2 requer Python 3.10+
2. A API do AutoGen v2 é totalmente assíncrona
3. O código mantém compatibilidade com AutoGen v1 como fallback
4. Recomenda-se migrar completamente para AutoGen v2 para aproveitar os novos recursos

## 🎯 Próximos Passos

1. ✅ Atualizar `requirements.txt` e `pyproject.toml`
2. ✅ Atualizar `autogen_framework.py` para suportar ambas as versões
3. ⏳ Atualizar `orchestrator.py` para usar AutoGen v2
4. ⏳ Atualizar `dev_framework` para usar AutoGen v2
5. ⏳ Testar a migração completa

