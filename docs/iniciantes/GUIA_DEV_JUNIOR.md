# 🎓 Guia Completo para Desenvolvedores Júniores

## 📋 Índice

1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Estrutura de Pastas](#estrutura-de-pastas)
3. [Como Começar](#como-começar)
4. [Arquivos Principais](#arquivos-principais)
5. [Fluxo de Dados](#fluxo-de-dados)
6. [Conceitos Importantes](#conceitos-importantes)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral do Projeto

### O que este projeto faz?

Este é um **chat inteligente** que:
- ✅ Conversa com o usuário (interface de chat)
- ✅ Processa mensagens usando IA (Autogen)
- ✅ Suporta voz (microfone)
- ✅ Funciona no navegador (web)
- ✅ Funciona em dispositivos móveis
- ✅ Funciona via Tailscale (acesso remoto)

### Tecnologias Usadas

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **IA**: Autogen (agentes autônomos)
- **WebSocket**: Comunicação em tempo real
- **Vite**: Ferramenta de desenvolvimento

---

## 📁 Estrutura de Pastas

```
open-codex-interpreter/
├── autogen_agent_interface/     # Aplicação principal
│   ├── client/                   # Frontend (React)
│   │   ├── src/
│   │   │   ├── components/       # Componentes React
│   │   │   ├── hooks/            # Hooks customizados
│   │   │   └── main.tsx          # Ponto de entrada
│   │   └── public/               # Arquivos públicos
│   ├── server/                   # Backend (Express)
│   │   ├── _core/                # Código central
│   │   │   ├── vite.ts           # Configuração do Vite
│   │   │   └── index.ts          # Servidor principal
│   │   ├── routes/               # Rotas da API
│   │   └── services/             # Serviços (IA, STT, etc)
│   └── shared/                   # Código compartilhado
└── README.md                     # Este arquivo
```

### O que cada pasta faz?

#### `client/` - Frontend (Interface do Usuário)
- **O que faz**: Interface visual que o usuário vê
- **Tecnologias**: React, TypeScript, Tailwind CSS
- **Arquivos importantes**:
  - `src/components/AdvancedChatInterface.tsx` - Interface de chat
  - `src/hooks/useWebSocket.ts` - Conexão WebSocket
  - `src/main.tsx` - Ponto de entrada

#### `server/` - Backend (Lógica do Servidor)
- **O que faz**: Processa requisições, gerencia IA, WebSocket
- **Tecnologias**: Node.js, Express, Autogen
- **Arquivos importantes**:
  - `server/_core/index.ts` - Servidor principal
  - `server/_core/vite.ts` - Configuração do Vite
  - `server/routes/` - Rotas da API

#### `shared/` - Código Compartilhado
- **O que faz**: Código usado tanto no frontend quanto no backend
- **Exemplos**: Tipos TypeScript, constantes, utilitários

---

## 🚀 Como Começar

### 1. Instalar Dependências

```bash
cd open-codex-interpreter/autogen_agent_interface
npm install
```

### 2. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

### 3. Acessar a Aplicação

- **Localhost**: http://localhost:3000
- **Tailscale**: https://revision-pc.tailb3613b.ts.net

---

## 📄 Arquivos Principais

### Frontend

#### `client/src/main.tsx`
**O que faz**: Ponto de entrada da aplicação React
**Quando usar**: Para adicionar providers globais, configurações iniciais

#### `client/src/components/AdvancedChatInterface.tsx`
**O que faz**: Interface de chat principal
**Quando usar**: Para modificar a interface do chat, adicionar novos recursos

#### `client/src/hooks/useWebSocket.ts`
**O que faz**: Gerencia conexão WebSocket
**Quando usar**: Para modificar como o chat se conecta ao servidor

### Backend

#### `server/_core/index.ts`
**O que faz**: Servidor Express principal
**Quando usar**: Para adicionar novas rotas, middlewares

#### `server/_core/vite.ts`
**O que faz**: Configuração do Vite (ferramenta de desenvolvimento)
**Quando usar**: Para modificar como os arquivos são servidos

#### `server/routes/`
**O que faz**: Rotas da API
**Quando usar**: Para adicionar novos endpoints da API

---

## 🔄 Fluxo de Dados

### Como uma mensagem é processada?

```
1. Usuário digita mensagem
   ↓
2. Frontend envia via WebSocket
   ↓
3. Backend recebe mensagem
   ↓
4. Backend processa com Autogen (IA)
   ↓
5. Backend envia resposta via WebSocket
   ↓
6. Frontend exibe resposta na tela
```

### Fluxo de Voz (Microfone)

```
1. Usuário pressiona microfone
   ↓
2. Navegador grava áudio
   ↓
3. Frontend envia áudio para backend
   ↓
4. Backend converte áudio em texto (STT)
   ↓
5. Backend processa texto com Autogen
   ↓
6. Backend envia resposta
   ↓
7. Frontend exibe resposta
```

---

## 🧠 Conceitos Importantes

### 1. WebSocket
**O que é**: Conexão em tempo real entre cliente e servidor
**Por que usar**: Permite comunicação bidirecional instantânea
**Onde está**: `client/src/hooks/useWebSocket.ts`

### 2. Autogen
**O que é**: Framework de IA para criar agentes autônomos
**Por que usar**: Permite criar assistentes inteligentes
**Onde está**: `server/services/`

### 3. Vite
**O que é**: Ferramenta de desenvolvimento para frontend
**Por que usar**: Compila código rapidamente, serve arquivos
**Onde está**: `server/_core/vite.ts`

### 4. Tailscale
**O que é**: Serviço para acessar aplicação remotamente
**Por que usar**: Permite acessar de qualquer lugar
**Como funciona**: Cria um túnel HTTPS para sua aplicação

---

## 🐛 Troubleshooting

### Problema: Página não carrega

**Soluções**:
1. Verifique se o servidor está rodando (`npm run dev`)
2. Verifique a porta (padrão: 3000)
3. Limpe o cache do navegador (Ctrl+Shift+Delete)

### Problema: WebSocket não conecta

**Soluções**:
1. Verifique se o servidor está rodando
2. Verifique os logs do servidor
3. Verifique o console do navegador (F12)

### Problema: Microfone não funciona

**Soluções**:
1. Verifique permissões do navegador
2. Verifique se o microfone está conectado
3. Verifique os logs do servidor

### Problema: Erro no Tailscale

**Soluções**:
1. Verifique se o Tailscale está ativo
2. Verifique os logs do servidor
3. Verifique a documentação do Vite: `server/_core/README_VITE.md`

---

## 📚 Recursos Adicionais

### Documentação

- **Vite**: `server/_core/README_VITE.md`
- **Estrutura**: Este arquivo
- **API**: Ver `server/routes/`

### Comandos Úteis

```bash
# Iniciar servidor
npm run dev

# Construir para produção
npm run build

# Ver logs
npm run dev | tee logs.txt
```

---

## 🆘 Precisa de Ajuda?

1. **Leia este guia primeiro**
2. **Verifique os logs do servidor**
3. **Verifique o console do navegador (F12)**
4. **Consulte a documentação específica**
5. **Peça ajuda para um desenvolvedor sênior**

---

**Última atualização**: 2024
**Versão**: 1.0.0

