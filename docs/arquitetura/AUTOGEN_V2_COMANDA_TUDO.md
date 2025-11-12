# 🧠 AutoGen v2 Comanda Tudo - Arquitetura Híbrida

## 📋 Visão Geral

Esta é a **arquitetura híbrida ideal** onde:

- **AutoGen v2** = Cérebro principal (planeja, decide QUANDO e PORQUÊ)
- **Open Interpreter** = Executor inteligente (pensa e executa localmente, decide COMO)

O AutoGen comanda tudo através de tools, e o Open Interpreter mantém toda sua inteligência local (modelo interno, raciocínio, execução, correção de erros).

## 🔄 Fluxo de Execução

```
Usuário → AutoGen v2 (planeja) 
    ↓
AutoGen decide: "Preciso executar código"
    ↓
AutoGen chama tool: open_interpreter_agent("Crie um script Python que...")
    ↓
Open Interpreter (pensa localmente com seu modelo Ollama)
    ├─ Interpreta a tarefa
    ├─ Gera código
    ├─ Executa código
    └─ Retorna resultado
    ↓
AutoGen recebe resultado e decide próximo passo
```

## ⚙️ Componentes

### 1. Open Interpreter Server (WebSocket)

Servidor WebSocket que permite que o Open Interpreter:
- Pense e execute localmente usando seu modelo interno (Ollama)
- Aceite comandos do AutoGen via WebSocket
- Mantenha toda sua inteligência (raciocínio, correção de erros, etc.)

**Iniciar servidor:**
```bash
# Windows
scripts\start_open_interpreter_server.bat

# Linux/Mac
bash scripts/start_open_interpreter_server.sh

# Ou manualmente
cd interpreter
python -m interpreter.server --host localhost --port 8000 --local --auto-run --model deepseek-coder-v2-16b-q4_k_m-rtx
```

### 2. Open Interpreter Tool (AutoGen v2)

Tool registrada no AutoGen v2 que permite:
- Enviar comandos ao Open Interpreter
- Receber respostas completas (pensamento + execução)
- AutoGen decide quando usar

**Tool disponível:**
- `open_interpreter_agent(command: str)` - Envia comando ao Open Interpreter

### 3. Integração no Orchestrator

O orchestrator do AutoGen v2:
- Cria a tool do Open Interpreter automaticamente
- Registra nos agentes (Executor, Generator)
- Usa o mesmo modelo do AutoGen

## 🚀 Como Usar

### Passo 1: Iniciar Open Interpreter Server

```bash
# Windows
scripts\start_open_interpreter_server.bat

# O servidor vai rodar em ws://localhost:8000
# O Open Interpreter pensa e executa localmente
```

### Passo 2: Usar AutoGen v2

O AutoGen v2 já está configurado para usar o Open Interpreter automaticamente.

Quando o AutoGen precisa executar código, ele:
1. Decide usar a tool `open_interpreter_agent`
2. Envia comando em linguagem natural
3. Open Interpreter pensa e executa localmente
4. Retorna resultado ao AutoGen
5. AutoGen analisa e decide próximo passo

### Exemplo de Uso

```python
from super_agent.core.orchestrator import SuperAgentOrchestrator, SuperAgentConfig

# Configurar
config = SuperAgentConfig(
    autogen_model="deepseek-coder-v2-16b-q4_k_m-rtx",
    open_interpreter_enabled=True,
    open_interpreter_auto_run=True,
)

# Criar orchestrator
orchestrator = SuperAgentOrchestrator(config)

# Executar tarefa
# O AutoGen vai decidir quando usar o Open Interpreter
result = await orchestrator.execute(
    task="Crie um script Python que calcula a soma de 1 até 100 e exibe o resultado"
)
```

## 🧩 Arquitetura Detalhada

### AutoGen v2 (Comandante)

- **Função**: Planejar, decidir QUANDO e PORQUÊ
- **Responsabilidades**:
  - Entender contexto global
  - Criar planos de execução
  - Decidir quando executar código
  - Analisar resultados
  - Decidir próximos passos

### Open Interpreter (Executor Inteligente)

- **Função**: Pensar e executar localmente, decidir COMO
- **Responsabilidades**:
  - Interpretar comandos do AutoGen
  - Raciocinar sobre a tarefa (usando modelo interno)
  - Gerar código
  - Executar código
  - Corrigir erros
  - Retornar resultados

## 📊 Benefícios

| Aspecto | Benefício |
|---------|-----------|
| **Controle** | AutoGen mantém controle total do fluxo |
| **Inteligência** | Open Interpreter mantém toda sua inteligência local |
| **Flexibilidade** | AutoGen decide quando usar Open Interpreter |
| **Escalabilidade** | Pode ter múltiplos executores Open Interpreter |
| **Local-first** | Tudo roda localmente com Ollama |

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Modelo a usar (mesmo para AutoGen e Open Interpreter)
DEFAULT_MODEL=deepseek-coder-v2-16b-q4_k_m-rtx

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
```

### Configuração do Orchestrator

```python
config = SuperAgentConfig(
    # Modelo (usado por AutoGen e Open Interpreter)
    autogen_model="deepseek-coder-v2-16b-q4_k_m-rtx",
    
    # Open Interpreter
    open_interpreter_enabled=True,
    open_interpreter_auto_run=True,  # Executa sem pedir confirmação
    
    # Outros...
)
```

## 🎯 Exemplos de Comandos

O AutoGen pode enviar comandos como:

- `"Crie um script Python que soma 5 + 7 e exibe o resultado"`
- `"Execute ls -la no diretório atual"`
- `"Analise o arquivo data.csv e gere um relatório"`
- `"Crie uma função que calcula o fatorial de um número"`

O Open Interpreter vai:
1. Pensar sobre o comando (usando seu modelo interno)
2. Gerar código apropriado
3. Executar
4. Retornar resultado

## ⚠️ Importante

- **AutoGen comanda tudo** - decide quando usar o Open Interpreter
- **Open Interpreter pensa localmente** - usa seu modelo interno para raciocinar
- **Mesmo modelo** - AutoGen e Open Interpreter usam o mesmo modelo (configurável)
- **Local-first** - tudo roda localmente com Ollama

## 🔍 Troubleshooting

### Servidor não inicia

```bash
# Verificar se Ollama está rodando
ollama list

# Verificar se o modelo existe
ollama list | grep deepseek-coder-v2-16b-q4_k_m-rtx
```

### AutoGen não encontra a tool

```bash
# Verificar se a tool está registrada
# Deve aparecer nos logs: "Open Interpreter Tool registrada para AutoGen v2"
```

### Erro de conexão WebSocket

```bash
# Verificar se o servidor está rodando
# Testar conexão: ws://localhost:8000
```

## 📝 Notas

- O Open Interpreter mantém toda sua inteligência (raciocínio, correção de erros, etc.)
- O AutoGen apenas comanda quando usar o Open Interpreter
- Tudo roda localmente com Ollama
- Pode usar WebSocket ou instância direta (configurável)
