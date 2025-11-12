# 🚀 AutoGen Agent Interface

Sistema completo de agentes AI colaborativos com AutoGen Framework, otimizado para RTX 4080 Super.

## ⚡ Início Rápido

### Opção 1: Script Python Completo (Recomendado) ⭐

**Windows:**
```bash
iniciar_servidor.bat
```

**Linux/Mac:**
```bash
python iniciar_servidor.py
```

Este script:
- ✅ Faz build do frontend React (Apple)
- ✅ Inicia o backend Python (FastAPI) na porta 8000
- ✅ Inicia o servidor TypeScript (frontend React) na porta 3000
- ✅ Opcionalmente inicia o frontend Streamlit (básico) na porta 8501
- ✅ Verifica dependências automaticamente
- ✅ Gerencia processos de forma organizada

**Opções disponíveis:**
```bash
# Iniciar todos os servidores
iniciar_servidor.bat

# Iniciar com Streamlit também
iniciar_servidor.bat --streamlit

# Apenas backend Python
iniciar_servidor.bat --no-frontend --no-build

# Apenas frontend React
iniciar_servidor.bat --no-backend

# Ver todas as opções
iniciar_servidor.bat --help
```

**Scripts auxiliares:**
- `iniciar_servidor_streamlit.bat` - Inicia todos os servidores incluindo Streamlit
- `iniciar_servidor_backend_only.bat` - Inicia apenas o backend Python
- `iniciar_servidor_frontend_only.bat` - Inicia apenas o frontend React

### Opção 2: Script Moderno (TypeScript apenas)

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

**Node.js direto (qualquer plataforma):**
```bash
node start.js
```

O script moderno:
- ✅ Detecta automaticamente pnpm ou npm
- ✅ Instala dependências automaticamente se necessário
- ✅ Inicia o servidor de desenvolvimento
- ✅ Output colorido e informativo
- ✅ Cross-platform (Windows/Linux/Mac)

### Opção 3: Manual

```bash
cd autogen_agent_interface
pnpm install
pnpm dev
```

## 📋 Pré-requisitos

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **pnpm** 8+ (ou npm) - Instalado automaticamente pelo script
- **Ollama** (para modelos locais) - [Download](https://ollama.ai/)
- **Python** 3.10+ (para Super Agent Framework) - [Download](https://www.python.org/)

## 🌐 URLs

Após iniciar:

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/api/health
- **WebSocket**: ws://localhost:3000/ws

## 📚 Documentação Organizada

Toda a documentação foi organizada em categorias para facilitar a navegação:

### 🎓 Para Iniciantes

**Novo no projeto? Comece aqui:**

- 🚀 **[COMECE_AQUI.md](./docs/iniciantes/COMECE_AQUI.md)** ⭐ **COMECE AQUI!** - Guia completo para iniciantes (só Python básico!)
- 📖 **[PRIMEIRO_PASSO.md](./docs/iniciantes/PRIMEIRO_PASSO.md)** - Execute o programa agora (super simples!)
- 📊 **[GUIA_PARA_INICIANTES.md](./docs/iniciantes/GUIA_PARA_INICIANTES.md)** - Guia completo explicando a arquitetura do projeto usando conceitos básicos de Python
- 📊 **[DIAGRAMA_VISUAL.md](./docs/iniciantes/DIAGRAMA_VISUAL.md)** - Diagramas visuais mostrando como o sistema funciona
- 🐍 **[GUIA_PYTHON_PURO.md](./docs/iniciantes/GUIA_PYTHON_PURO.md)** - Guia Python puro (100% Python, sem TypeScript)
- 🐍 **[BACKEND_PYTHON_SIMPLES.md](./docs/iniciantes/BACKEND_PYTHON_SIMPLES.md)** ⭐ **BACKEND 100% PYTHON** - Backend Python simplificado para iniciantes
- 📘 **[GUIA_TYPESCRIPT_PARA_INICIANTES.md](./docs/iniciantes/GUIA_TYPESCRIPT_PARA_INICIANTES.md)** - Guia TypeScript em português para iniciantes
- 📝 **[EXEMPLO_PRATICO.md](./docs/iniciantes/EXEMPLO_PRATICO.md)** - Exemplo prático de como usar o projeto
- 🎯 **[ONDE_ESTAMOS.md](./docs/iniciantes/ONDE_ESTAMOS.md)** - Onde estamos no projeto e o que fazer agora
- 📚 **[COMO_PROGRAMAR.md](./docs/iniciantes/COMO_PROGRAMAR.md)** - Como programar no projeto (guia prático)
- 🎨 **[Frontends Disponíveis](./super_agent/README_FRONTENDS.md)** - Guia dos frontends (Streamlit simples e React estilo Apple)

**Se você sabe Python básico (variáveis, if/else, loops, funções), você consegue entender e modificar este projeto!** 🚀

### 🏗️ Arquitetura

- **[ARQUITETURA_FINAL.md](./docs/arquitetura/ARQUITETURA_FINAL.md)** - Arquitetura final do projeto
- **[AUTOGEN_COMANDA_TUDO.md](./docs/arquitetura/AUTOGEN_COMANDA_TUDO.md)** - Documentação técnica sobre como o AutoGen comanda tudo
- **[RESUMO_BACKEND_PYTHON.md](./docs/arquitetura/RESUMO_BACKEND_PYTHON.md)** - Resumo do backend Python
- **[STATUS_FINAL.md](./docs/arquitetura/STATUS_FINAL.md)** - Status final do projeto
- **[NADA_PERDIDO.md](./docs/arquitetura/NADA_PERDIDO.md)** - Confirmação de que nenhuma funcionalidade foi perdida
- **[MENOS_TYPESCRIPT_POSSIVEL.md](./docs/arquitetura/MENOS_TYPESCRIPT_POSSIVEL.md)** - Minimização do TypeScript
- **[SIMPLIFICACAO_COMPLETA.md](./docs/arquitetura/SIMPLIFICACAO_COMPLETA.md)** - Simplificação completa do projeto
- **[DEPLOY.md](./docs/arquitetura/DEPLOY.md)** - Guia de deploy
- **[CHANGELOG.md](./docs/arquitetura/CHANGELOG.md)** - Histórico de mudanças

### 🔍 Análises

- **[ANALISE_AGENTICSEEK_OPENMANUS.md](./docs/analises/ANALISE_AGENTICSEEK_OPENMANUS.md)** - Análise do AgenticSeek e OpenManus
- **[ANALISE_AI_MANUS.md](./docs/analises/ANALISE_AI_MANUS.md)** - Análise do AI Manus
- **[ANALISE_THINKING_MODELOS.md](./docs/analises/ANALISE_THINKING_MODELOS.md)** - Análise de modelos thinking
- **[MODELOS_RECOMENDADOS_ANALISE.md](./docs/analises/MODELOS_RECOMENDADOS_ANALISE.md)** - Modelos recomendados
- **[RESUMO_PROGRESSO_RECENTE.md](./docs/analises/RESUMO_PROGRESSO_RECENTE.md)** - Resumo do progresso recente

### 📦 Instalação

- **[INSTALAR_DEEPSEEK_CODER_V2_RTX.md](./docs/instalacao/INSTALAR_DEEPSEEK_CODER_V2_RTX.md)** - Instalar DeepSeek Coder V2 RTX
- **[INSTALAR_RTX_4080_SUPER.md](./docs/instalacao/INSTALAR_RTX_4080_SUPER.md)** - Instalar RTX 4080 Super
- **[CONFIGURACAO_OLLAMA_CLOUD_COMPLETA.md](./docs/instalacao/CONFIGURACAO_OLLAMA_CLOUD_COMPLETA.md)** - Configuração do Ollama Cloud
- **[GUIA_OLLAMA_CLOUD.md](./docs/instalacao/GUIA_OLLAMA_CLOUD.md)** - Guia do Ollama Cloud
- **[SETUP_FRONTEND_COMPLETO.md](./docs/instalacao/SETUP_FRONTEND_COMPLETO.md)** - Setup completo do frontend

### 🔌 Integração

- **[INTEGRACAO_AFTER_EFFECTS_MCP.md](./docs/integracao/INTEGRACAO_AFTER_EFFECTS_MCP.md)** - Integração com After Effects MCP
- **[INTEGRACAO_UFO_PYAUTOGUI.md](./docs/integracao/INTEGRACAO_UFO_PYAUTOGUI.md)** - Integração com UFO/PyAutoGUI
- **[QUICK_START_AFTER_EFFECTS_MCP.md](./docs/integracao/QUICK_START_AFTER_EFFECTS_MCP.md)** - Quick Start After Effects MCP

### 📋 Tarefas

- **[TAREFAS_POR_PRIORIDADE.md](./docs/tarefas/TAREFAS_POR_PRIORIDADE.md)** - Tarefas por prioridade
- **[PLANO_SIMPLIFICACAO.md](./docs/tarefas/PLANO_SIMPLIFICACAO.md)** - Plano de simplificação
- **[O_QUE_FALTA_PARA_TERMINAR.md](./docs/tarefas/O_QUE_FALTA_PARA_TERMINAR.md)** - O que falta para terminar

### 🗑️ Arquivos Não Utilizados

Arquivos não utilizados ou obsoletos foram movidos para a pasta `lixo/`. Você pode excluí-los se não precisar mais deles.

## 🎯 Versões Disponíveis

#### 1. **Backend TypeScript + Frontend React** (Original)
- Backend: TypeScript/Node.js
- Frontend: React/TypeScript
- **Para**: Desenvolvedores que conhecem TypeScript

#### 2. **Backend Python + Frontend Streamlit** ⭐ **RECOMENDADO PARA INICIANTES**
- Backend: Python (FastAPI)
- Frontend: Streamlit (Python)
- **Para**: Iniciantes que só sabem Python básico
- **Arquivos**: `super_agent/backend_python.py`, `super_agent/frontend_streamlit.py`

#### 3. **Backend Python + Frontend React** (Híbrido)
- Backend: Python (FastAPI)
- Frontend: React/TypeScript
- **Para**: Quem quer backend Python com frontend bonito

**Todas as versões mantêm TODAS as funcionalidades!** 🚀

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev              # Inicia servidor de desenvolvimento

# Build
pnpm build            # Build para produção
pnpm start            # Inicia servidor de produção

# Utilitários
pnpm lint             # Lint do código
pnpm type-check       # Verificação de tipos
```

## 🐛 Troubleshooting

### Erro: "pnpm não encontrado"
O script detecta automaticamente e usa npm como fallback, ou instale pnpm:
```bash
npm install -g pnpm
```

### Erro: "Dependências não instaladas"
Execute manualmente:
```bash
cd autogen_agent_interface
pnpm install
```

### Erro: "Porta já em uso"
Altere a porta no arquivo `.env`:
```env
PORT=3001
```

## 📦 Estrutura do Projeto

```
open-codex-interpreter/
├── autogen_agent_interface/    # Aplicação principal
│   ├── client/                 # Frontend React
│   ├── server/                 # Backend Node.js
│   └── shared/                 # Código compartilhado
├── super_agent/                # Super Agent Framework (Python)
├── docs/                       # Documentação organizada
│   ├── iniciantes/             # Guias para iniciantes
│   ├── arquitetura/            # Documentação de arquitetura
│   ├── analises/               # Análises e estudos
│   ├── instalacao/             # Guias de instalação
│   ├── integracao/             # Documentação de integração
│   └── tarefas/                # Tarefas e planos
├── scripts/                    # Scripts úteis
├── lixo/                       # Arquivos não utilizados
├── start.js                    # Script de inicialização moderno
├── start.bat                   # Wrapper Windows
├── start.sh                    # Wrapper Linux/Mac
└── README.md                   # Este arquivo
```

## 🎯 Funcionalidades

- ✅ Chat em tempo real com WebSocket
- ✅ TTS/STT (ElevenLabs/Piper)
- ✅ OCR e análise de imagens
- ✅ Execução de código
- ✅ Integração com Ollama/AutoGen
- ✅ Background Worker 24/7
- ✅ Resource Manager (otimizado para RTX 4080 Super)
- ✅ Model Loader (carregamento automático na VRAM)

## 📝 Licença

MIT

---

**Execute `start.bat` (Windows) ou `./start.sh` (Linux/Mac) agora!** 🎉
