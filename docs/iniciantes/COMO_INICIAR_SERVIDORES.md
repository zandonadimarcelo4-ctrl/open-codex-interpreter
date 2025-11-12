# 🚀 Como Iniciar Servidores

Este guia explica como usar o script `iniciar_servidor.py` para fazer build e iniciar todos os servidores do projeto.

## 📋 Pré-requisitos

- **Python** 3.10+ instalado
- **Node.js** 20+ instalado
- **pnpm** ou **npm** instalado
- **Dependências Python** instaladas (`pip install -r requirements.txt`)
- **Dependências Node.js** instaladas (`pnpm install` ou `npm install`)

## 🚀 Uso Básico

### Iniciar Todos os Servidores

```bash
python iniciar_servidor.py
```

Isso irá:
1. ✅ Verificar dependências
2. ✅ Fazer build do frontend React (Apple)
3. ✅ Iniciar o backend Python (FastAPI) na porta 8000
4. ✅ Iniciar o servidor TypeScript (frontend React) na porta 3000

### Iniciar com Frontend Streamlit

```bash
python iniciar_servidor.py --streamlit
```

Isso irá iniciar também o frontend Streamlit (básico) na porta 8501.

## 🎯 Opções Disponíveis

### `--streamlit`
Inicia também o frontend Streamlit (básico)

```bash
python iniciar_servidor.py --streamlit
```

### `--no-build`
Não faz build do frontend React (usa build existente)

```bash
python iniciar_servidor.py --no-build
```

### `--no-backend`
Não inicia o backend Python

```bash
python iniciar_servidor.py --no-backend
```

### `--no-frontend`
Não inicia o servidor TypeScript (frontend React)

```bash
python iniciar_servidor.py --no-frontend
```

## 📊 Exemplos de Uso

### 1. Iniciar Apenas o Backend Python

```bash
python iniciar_servidor.py --no-frontend --no-build
```

### 2. Iniciar Apenas o Frontend React

```bash
python iniciar_servidor.py --no-backend
```

### 3. Iniciar Todos os Servidores (Incluindo Streamlit)

```bash
python iniciar_servidor.py --streamlit
```

### 4. Fazer Build sem Iniciar Servidores

```bash
python iniciar_servidor.py --no-backend --no-frontend --streamlit
```

## 🌐 URLs dos Servidores

Após iniciar os servidores, você pode acessar:

- **Backend Python (FastAPI)**: http://localhost:8000
- **WebSocket**: ws://localhost:8000/ws
- **Frontend React (Apple)**: http://localhost:3000
- **Frontend Streamlit (Básico)**: http://localhost:8501

## 🛠️ Troubleshooting

### Erro: "Python não encontrado"
Instale Python 3.10+ e adicione ao PATH.

### Erro: "Node.js não encontrado"
Instale Node.js 20+ e adicione ao PATH.

### Erro: "pnpm ou npm não encontrado"
Instale pnpm ou npm:
```bash
npm install -g pnpm
```

### Erro: "Porta já está em uso"
Encerre o processo que está usando a porta ou mude a porta nos arquivos de configuração.

### Erro: "Dependências não instaladas"
Instale as dependências:
```bash
# Python
pip install -r requirements.txt

# Node.js
cd autogen_agent_interface
pnpm install
# ou
npm install
```

### Erro: "Build do frontend React falhou"
Verifique se as dependências Node.js estão instaladas:
```bash
cd autogen_agent_interface
pnpm install
# ou
npm install
```

## 📝 Notas

- O script verifica automaticamente se as dependências estão instaladas
- O script verifica se as portas estão em uso antes de iniciar os servidores
- O script aguarda os servidores iniciarem antes de continuar
- Pressione `Ctrl+C` para encerrar todos os servidores

## 🔗 Links Úteis

- [README.md](../../README.md) - Documentação principal
- [COMO_PROGRAMAR.md](./COMO_PROGRAMAR.md) - Como programar no projeto
- [GUIA_PARA_INICIANTES.md](./GUIA_PARA_INICIANTES.md) - Guia para iniciantes

---

**Última atualização**: 2025-01-12
**Criado por**: Sistema de documentação automática

