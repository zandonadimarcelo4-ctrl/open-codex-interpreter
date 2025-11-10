# 📚 Estrutura Simplificada - Guia para Devs Júniores

## 🎯 Visão Geral

Este documento explica a estrutura do projeto de forma **SIMPLES** e **DIRETA** para desenvolvedores júniores.

---

## 📁 Estrutura de Pastas (Simplificada)

```
autogen_agent_interface/
│
├── 📂 client/              # FRONTEND (Interface do Usuário)
│   ├── src/
│   │   ├── components/     # Componentes React (botões, cards, etc)
│   │   ├── pages/          # Páginas (Home, Landing, etc)
│   │   ├── hooks/          # Hooks customizados (useWebSocket, etc)
│   │   └── main.tsx        # ⭐ PONTO DE ENTRADA - Começa aqui!
│   └── public/             # Arquivos públicos (imagens, ícones)
│
├── 📂 server/              # BACKEND (Lógica do Servidor)
│   ├── _core/
│   │   ├── index.ts        # ⭐ SERVIDOR PRINCIPAL - Começa aqui!
│   │   ├── vite.ts         # Configuração do Vite (ferramenta de dev)
│   │   └── routers.ts      # Rotas da API
│   ├── utils/              # Utilitários (Autogen, WebSocket, etc)
│   └── services/           # Serviços (IA, STT, TTS, etc)
│
└── 📂 shared/              # CÓDIGO COMPARTILHADO
    └── types.ts            # Tipos TypeScript compartilhados
```

---

## 🔍 O Que Cada Pasta Faz?

### `client/` - Frontend (O que o usuário vê)

**O que faz?**
- Interface visual (botões, chat, formulários)
- Comunica com o backend via WebSocket
- Exibe mensagens e respostas

**Arquivos importantes:**
- `src/main.tsx` - Inicia a aplicação React
- `src/components/AdvancedChatInterface.tsx` - Interface de chat
- `src/hooks/useWebSocket.ts` - Conexão WebSocket

**Tecnologias:**
- React (biblioteca para criar interfaces)
- TypeScript (JavaScript com tipos)
- Tailwind CSS (estilização)

### `server/` - Backend (Lógica do servidor)

**O que faz?**
- Processa requisições do frontend
- Gerencia IA (Autogen)
- Gerencia WebSocket (comunicação em tempo real)
- Processa voz (STT/TTS)

**Arquivos importantes:**
- `server/_core/index.ts` - Servidor principal (Express)
- `server/utils/websocket.ts` - WebSocket server
- `server/utils/autogen.ts` - Lógica do Autogen

**Tecnologias:**
- Node.js (runtime JavaScript)
- Express (framework web)
- Autogen (framework de IA)

### `shared/` - Código Compartilhado

**O que faz?**
- Código usado tanto no frontend quanto no backend
- Tipos TypeScript compartilhados
- Constantes compartilhadas

**Exemplo:**
```typescript
// shared/types.ts
export type Message = {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
};
```

---

## 🚀 Como Funciona? (Fluxo Simples)

### 1. Usuário Abre o Navegador

```
Usuário → http://localhost:3000
  ↓
Frontend carrega (React)
  ↓
Interface aparece na tela
```

### 2. Usuário Envia Mensagem

```
Usuário digita mensagem
  ↓
Frontend envia via WebSocket
  ↓
Backend recebe mensagem
  ↓
Backend processa com Autogen (IA)
  ↓
Backend envia resposta via WebSocket
  ↓
Frontend exibe resposta na tela
```

### 3. Usuário Usa Microfone

```
Usuário pressiona microfone
  ↓
Navegador grava áudio
  ↓
Frontend envia áudio para backend
  ↓
Backend converte áudio em texto (STT)
  ↓
Backend processa texto com Autogen
  ↓
Backend envia resposta
  ↓
Frontend exibe resposta
```

---

## 📝 Conceitos Importantes (Simplificados)

### 1. WebSocket
**O que é?** Conexão em tempo real entre cliente e servidor.
**Por que usar?** Permite comunicação instantânea (chat em tempo real).
**Onde está?** `client/src/hooks/useWebSocket.ts` e `server/utils/websocket.ts`

### 2. Autogen
**O que é?** Framework de IA para criar agentes autônomos.
**Por que usar?** Permite criar assistentes inteligentes.
**Onde está?** `server/utils/autogen.ts`

### 3. Vite
**O que é?** Ferramenta de desenvolvimento para frontend.
**Por que usar?** Compila código rapidamente, serve arquivos.
**Onde está?** `server/_core/vite.ts`

### 4. Express
**O que é?** Framework web para Node.js.
**Por que usar?** Cria servidor HTTP, gerencia rotas.
**Onde está?** `server/_core/index.ts`

---

## 🔧 Arquivos Principais (Explicados)

### Frontend

#### `client/src/main.tsx`
**O que faz?** Ponto de entrada da aplicação React.
**Quando modificar?** Para adicionar providers globais, configurações iniciais.

```typescript
// Exemplo: Adicionar um provider global
import { ThemeProvider } from './contexts/ThemeContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
```

#### `client/src/components/AdvancedChatInterface.tsx`
**O que faz?** Interface de chat principal.
**Quando modificar?** Para modificar a interface do chat, adicionar novos recursos.

**Componentes principais:**
- Campo de entrada de texto
- Botão de enviar
- Botão de microfone
- Área de mensagens

#### `client/src/hooks/useWebSocket.ts`
**O que faz?** Gerencia conexão WebSocket.
**Quando modificar?** Para modificar como o chat se conecta ao servidor.

**Funções principais:**
- `connect()` - Conecta ao servidor
- `send()` - Envia mensagem
- `disconnect()` - Desconecta do servidor

### Backend

#### `server/_core/index.ts`
**O que faz?** Servidor Express principal.
**Quando modificar?** Para adicionar novas rotas, middlewares.

**O que faz:**
1. Cria servidor Express
2. Configura CORS
3. Configura rotas
4. Inicia servidor WebSocket
5. Inicia servidor HTTP

#### `server/utils/websocket.ts`
**O que faz?** Gerencia conexões WebSocket.
**Quando modificar?** Para modificar como mensagens são processadas.

**Funções principais:**
- `handleConnection()` - Gerencia nova conexão
- `handleMessage()` - Processa mensagem recebida
- `sendMessage()` - Envia mensagem para cliente

#### `server/utils/autogen.ts`
**O que faz?** Lógica do Autogen (IA).
**Quando modificar?** Para modificar como a IA processa mensagens.

**Funções principais:**
- `executeWithAutoGen()` - Executa tarefa com Autogen
- `createAgent()` - Cria agente Autogen
- `processMessage()` - Processa mensagem com IA

---

## 🛠️ Como Adicionar Novos Recursos?

### 1. Adicionar Novo Componente React

```typescript
// client/src/components/MeuComponente.tsx
export function MeuComponente() {
  return <div>Meu Componente</div>;
}
```

### 2. Adicionar Nova Rota no Backend

```typescript
// server/_core/index.ts
app.get('/api/minha-rota', (req, res) => {
  res.json({ message: 'Minha rota' });
});
```

### 3. Adicionar Novo Hook

```typescript
// client/src/hooks/useMeuHook.ts
export function useMeuHook() {
  const [valor, setValor] = useState(0);
  return { valor, setValor };
}
```

---

## 🐛 Troubleshooting (Problemas Comuns)

### Problema: Página não carrega

**Soluções:**
1. Verifique se o servidor está rodando (`npm run dev`)
2. Verifique a porta (padrão: 3000)
3. Limpe o cache do navegador (Ctrl+Shift+Delete)

### Problema: WebSocket não conecta

**Soluções:**
1. Verifique se o servidor está rodando
2. Verifique os logs do servidor
3. Verifique o console do navegador (F12)

### Problema: Erro no Tailscale

**Soluções:**
1. Verifique se o Tailscale está ativo
2. Verifique os logs do servidor
3. Verifique a documentação: `server/_core/README_VITE.md`

---

## 📚 Recursos Adicionais

- **Documentação do Vite**: `server/_core/README_VITE.md`
- **Este guia**: `ESTRUTURA_SIMPLIFICADA.md`
- **Guia de Dev Júnior**: `GUIA_DEV_JUNIOR.md`

---

## 🆘 Precisa de Ajuda?

1. **Leia este guia primeiro**
2. **Verifique os logs do servidor**
3. **Verifique o console do navegador (F12)**
4. **Consulte a documentação específica**
5. **Peça ajuda para um desenvolvedor sênior**

---

**Última atualização**: 2024

