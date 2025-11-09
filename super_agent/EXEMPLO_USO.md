# 🚀 Super Agent - Exemplo de Uso

## 📋 Uso Básico

```python
from super_agent import SuperAgentFramework, AutoGenConfig

# Configurar framework
config = AutoGenConfig(
    use_local=True,
    local_model="deepseek-r1:8b",
    local_base_url="http://127.0.0.1:11434",
    code_execution_enabled=True,
    web_browsing_enabled=True,
    video_editing_enabled=True,
    gui_automation_enabled=True,
    multimodal_enabled=True,
    memory_enabled=True,
    workspace=Path("./workspace"),
    chromadb_path=Path("./memory")
)

# Inicializar framework (AutoGen gerencia tudo)
framework = SuperAgentFramework(config)

# Executar tarefa
result = await framework.execute(
    "Criar um vídeo animado com código Python que gera gráficos"
)

# AutoGen coordena todos os agentes:
# 1. Planner Agent planeja a tarefa
# 2. Generator Agent gera código Python
# 3. Critic Agent revisa o código
# 4. Executor Agent executa o código
# 5. Video Editor Agent cria o vídeo
# 6. Multimodal Agent analisa o resultado
# 7. Memory Agent salva na memória
```

## 🎯 Exemplo: Criar Vídeo com Código

```python
result = await framework.execute(
    task="Criar um vídeo animado mostrando gráficos de vendas",
    context={
        "video": True,
        "code": True,
        "multimodal": True
    }
)

# O framework:
# 1. Planeja a tarefa (Planner)
# 2. Gera código Python para criar gráficos (Generator)
# 3. Revisa o código (Critic)
# 4. Executa o código (Executor + Open Interpreter)
# 5. Cria composição no After Effects (Video Editor)
# 6. Adiciona animações (Video Editor)
# 7. Renderiza frames (Video Editor)
# 8. Analisa resultado visual (Multimodal)
# 9. Salva na memória (Memory)
```

## 🔧 Status do Framework

```python
# Verificar status
status = framework.get_status()
print(status)

# Output:
# {
#     "initialized": True,
#     "agents": ["planner", "generator", "critic", "executor", "browser", "video_editor", "ufo", "multimodal", "memory"],
#     "tools": ["code_execution", "web_browsing", "video_editing", "gui_automation", "multimodal", "memory"],
#     "memory": True,
#     "group_chat": True
# }
```

## 🧹 Limpeza

```python
# Limpar recursos
await framework.cleanup()
```

## ✅ Vantagens

- ✅ **Um único framework** (AutoGen)
- ✅ **Sem conflitos** (AutoGen gerencia tudo)
- ✅ **Fácil de usar** (Uma única API)
- ✅ **Extensível** (Fácil adicionar agentes/ferramentas)
- ✅ **Colaboração automática** (AutoGen GroupChat)

**AutoGen como framework único, zero conflitos!** 🚀

