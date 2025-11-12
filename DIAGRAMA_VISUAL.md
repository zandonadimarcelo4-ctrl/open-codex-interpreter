# 📊 Diagrama Visual - Como o Projeto Funciona

## 🎯 Fluxo Completo (Passo a Passo)

```
┌─────────────────────────────────────────────────────────────────┐
│                        VOCÊ (Usuário)                           │
│              "Abre o Google e pesquisa por X"                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              TYPESCRIPT (Porteiro/Recepcionista)                │
│                    autogen_agent_interface/                     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  autogen.ts                                               │  │
│  │  - Recebe sua mensagem                                    │  │
│  │  - Detecta intenção: "action" ou "conversation"?         │  │
│  │  - Se action → delega para Python                        │  │
│  │  - Se conversation → responde direto (Ollama)            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
│                             ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  autogen_v2_bridge.ts                                    │  │
│  │  - Ponte entre TypeScript e Python                       │  │
│  │  - Chama processo Python                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  PYTHON (Chefe/Trabalhador)                     │
│                        super_agent/                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  simple_commander.py                                     │  │
│  │  - Cria o "chefe" AutoGen                                │  │
│  │  - Configura ferramentas disponíveis                     │  │
│  │  - Recebe tarefa e decide o que fazer                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
│                             ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  AutoGen (Chefe Inteligente)                             │  │
│  │  - Analisa tarefa                                        │  │
│  │  - Decide qual ferramenta usar                           │  │
│  │  - Executa ações                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
│        ┌────────────────────┼────────────────────┐              │
│        ▼                    ▼                    ▼              │
│  ┌──────────┐      ┌──────────────┐      ┌──────────────┐     │
│  │  Web     │      │  GUI         │      │  Open        │     │
│  │  Browsing│      │  Automation  │      │  Interpreter │     │
│  │  (Selenium)     │  (PyAutoGUI) │      │  (Código)    │     │
│  └──────────┘      └──────────────┘      └──────────────┘     │
│        │                    │                    │              │
│        └────────────────────┼────────────────────┘              │
│                             │                                    │
│                             ▼                                    │
│                    Resultado: "✅ Feito!"                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        VOCÊ (Usuário)                           │
│              Vê resultado: "✅ Pesquisa realizada!"             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Estrutura de Pastas (Visual)

```
open-codex-interpreter/
│
├── 📁 autogen_agent_interface/          ← TypeScript (Porteiro)
│   │
│   ├── 📁 client/                       ← Interface Visual (React)
│   │   └── ... (componentes React)
│   │
│   └── 📁 server/                       ← Servidor Node.js
│       └── 📁 utils/
│           ├── 📄 autogen.ts            ← Decide: conversa ou ação?
│           └── 📄 autogen_v2_bridge.ts  ← Ponte para Python
│
├── 📁 super_agent/                      ← Python (Chefe/Trabalhador)
│   │
│   ├── 📁 core/                         ← Núcleo do Sistema
│   │   ├── 📄 simple_commander.py       ← Cria o "chefe" AutoGen
│   │   └── 📄 autogen_framework.py      ← Configuração do AutoGen
│   │
│   ├── 📁 tools/                        ← Ferramentas Disponíveis
│   │   ├── 📄 web_browsing.py           ← 🌐 Navegação Web (Selenium)
│   │   └── 📄 gui_automation.py         ← 🖱️ Automação GUI (PyAutoGUI)
│   │
│   └── 📁 integrations/                 ← Integrações
│       └── 📄 ufo.py                    ← 👁️ UFO (Análise Visual)
│
└── 📁 interpreter/                      ← Open Interpreter
    └── ... (execução de código)
```

---

## 🔄 Exemplo Real: "Abre o Google e pesquisa por 'paralelepipedo'"

### Passo 1: Você envia mensagem
```
Você → "Abre o Google e pesquisa por 'paralelepipedo'"
```

### Passo 2: TypeScript recebe e classifica
```typescript
// autogen.ts
intent = detectarIntencao("Abre o Google...")
// Resultado: intent = "action" (é uma ação, não conversa)
```

### Passo 3: TypeScript delega para Python
```typescript
// autogen.ts
if (intent === "action") {
    resultado = await executarComPython("Abre o Google...")
}
```

### Passo 4: Python recebe e cria chefe AutoGen
```python
# simple_commander.py
chefe = criar_chefe_autogen()
# Chefe tem acesso a:
# - Web Browsing Tool (Selenium)
# - GUI Automation Tool (PyAutoGUI)
# - Open Interpreter (execução de código)
```

### Passo 5: AutoGen analisa e decide
```python
# AutoGen pensa:
# "Preciso navegar na web? Sim!"
# "Qual ferramenta usar? Web Browsing Tool (Selenium)"
```

### Passo 6: AutoGen usa ferramenta
```python
# web_browsing.py (Selenium)
navegador = abrir_chrome()
navegador.ir_para("https://google.com")
navegador.digitar("paralelepipedo")
navegador.pressionar_enter()
```

### Passo 7: Resultado volta
```
Python → TypeScript → Você
"✅ Pesquisa realizada com sucesso!"
```

---

## 🛠️ Ferramentas Disponíveis (O Que Cada Uma Faz)

### 🌐 Web Browsing (Selenium)
```
┌─────────────────────────────────────┐
│  Web Browsing Tool                  │
│  (super_agent/tools/web_browsing.py)│
├─────────────────────────────────────┤
│  ✅ Abrir navegador                 │
│  ✅ Navegar para URL                │
│  ✅ Clicar em elementos             │
│  ✅ Preencher formulários           │
│  ✅ Fazer scraping                  │
│  ✅ Capturar screenshots            │
└─────────────────────────────────────┘
```

### 🖱️ GUI Automation (PyAutoGUI)
```
┌─────────────────────────────────────┐
│  GUI Automation Tool                │
│  (super_agent/tools/gui_automation.py)│
├─────────────────────────────────────┤
│  ✅ Screenshots                     │
│  ✅ Clicar (mouse)                  │
│  ✅ Digitar (teclado)               │
│  ✅ Pressionar teclas               │
│  ✅ Scroll                          │
│  ✅ Arrastar                        │
│  ✅ Análise visual (UFO)            │
└─────────────────────────────────────┘
```

### 💻 Open Interpreter (Execução de Código)
```
┌─────────────────────────────────────┐
│  Open Interpreter                   │
│  (Integrado no AutoGen)             │
├─────────────────────────────────────┤
│  ✅ Executar código Python          │
│  ✅ Executar código JavaScript      │
│  ✅ Executar comandos Shell         │
│  ✅ Criar/editar arquivos           │
│  ✅ Processar dados                 │
│  ✅ Auto-correção de erros          │
└─────────────────────────────────────┘
```

---

## 🎨 Decisões do Sistema (Fluxograma)

```
                    ┌─────────────┐
                    │  Você fala  │
                    └──────┬──────┘
                           │
                           ▼
            ┌──────────────────────────┐
            │  TypeScript recebe       │
            │  (autogen.ts)            │
            └──────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  Qual a intenção?    │
        └──────┬───────────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
┌──────────┐    ┌──────────────┐
│ Conversa │    │    Ação      │
│ ou       │    │   (executar) │
│ Pergunta │    │               │
└────┬─────┘    └───────┬───────┘
     │                  │
     ▼                  ▼
┌──────────┐    ┌──────────────┐
│ Ollama   │    │   Python     │
│ direto   │    │   (AutoGen)  │
│ (rápido) │    │               │
└────┬─────┘    └───────┬───────┘
     │                  │
     └────────┬─────────┘
              │
              ▼
     ┌────────────────┐
     │  Você recebe   │
     │    resposta    │
     └────────────────┘
```

---

## 💡 Analogia Simples

Imagine que você está em um **restaurante**:

- **Você** = Cliente (pede comida)
- **TypeScript** = Garçom (recebe pedido, leva para cozinha)
- **Python** = Cozinha (prepara a comida)
- **AutoGen** = Chef (decide como preparar)
- **Ferramentas** = Utensílios (faca, panela, fogão)

**Fluxo:**
1. Você pede: "Quero um hambúrguer"
2. Garçom (TypeScript) leva pedido para cozinha (Python)
3. Chef (AutoGen) decide: "Vou usar a chapa (ferramenta)"
4. Chef prepara hambúrguer usando chapa
5. Garçom traz hambúrguer para você

**No nosso projeto:**
1. Você pede: "Abre o Google"
2. TypeScript leva pedido para Python
3. AutoGen decide: "Vou usar Web Browsing Tool"
4. AutoGen abre Google usando Selenium
5. TypeScript traz resultado para você

---

## 🎯 Onde Editar Cada Coisa?

### Quer mudar **como o sistema decide** (conversa vs ação)?
```
📄 autogen_agent_interface/server/utils/autogen.ts
```

### Quer mudar **o que o Python faz**?
```
📄 super_agent/core/simple_commander.py  (cria o chefe)
📄 super_agent/tools/web_browsing.py     (navegação web)
📄 super_agent/tools/gui_automation.py   (automação GUI)
```

### Quer mudar **a interface visual**?
```
📁 autogen_agent_interface/client/  (componentes React)
```

---

**Agora você entende a estrutura! 🎉**

