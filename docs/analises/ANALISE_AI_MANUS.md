# 🔍 Análise: AI Manus (Simpleyyt/ai-manus)

## 📋 Resumo Executivo

**AI Manus** é um sistema de agente de IA de propósito geral que executa várias ferramentas e operações em um ambiente sandbox isolado. Diferente do AgenticSeek, o AI Manus foca em **isolamento completo** através de containers Docker e **visualização em tempo real** do ambiente sandbox.

**Repositório:** [https://github.com/Simpleyyt/ai-manus](https://github.com/Simpleyyt/ai-manus)

## 🏗️ Arquitetura

### Componentes Principais

1. **Frontend** (Vue.js)
   - Interface web moderna
   - Visualização do sandbox via NoVNC
   - Comunicação em tempo real com backend

2. **Backend** (Python)
   - API REST
   - Gerenciamento de sandboxes
   - Integração com LLM (OpenAI-compatible)
   - Autenticação (JWT)
   - Suporte a MCP (Model Context Protocol)

3. **Sandbox** (Docker Container)
   - Ambiente isolado para execução
   - Chrome headless para navegação web
   - VNC server para visualização
   - Execução de código e comandos
   - TTL (Time-To-Live) para limpeza automática

### Stack Tecnológica

- **Frontend:** Vue.js, TypeScript
- **Backend:** Python
- **Sandbox:** Docker, Chrome Headless, VNC (xvfb + x11vnc)
- **Database:** MongoDB (opcional)
- **Cache:** Redis (opcional)
- **Visualização:** NoVNC (VNC no navegador)
- **Comunicação:** WebSocket, REST API
- **Autenticação:** JWT

## 🔑 Características Únicas

### 1. **Sandbox Isolado com Docker**

**Diferenciação:**
- Cada execução ocorre em um container Docker isolado
- TTL (Time-To-Live) para limpeza automática
- Ambiente limpo para cada tarefa
- Segurança através de isolamento completo

**Implementação:**
```python
# Sandbox management
SANDBOX_IMAGE=simpleyyt/manus-sandbox
SANDBOX_NAME_PREFIX=sandbox
SANDBOX_TTL_MINUTES=30
SANDBOX_NETWORK=manus-network
```

### 2. **Visualização em Tempo Real (VNC)**

**Diferenciação:**
- Visualização do ambiente sandbox no navegador
- NoVNC para acesso via web
- Ver o que o agente está fazendo em tempo real
- Útil para debug e monitoramento

**Fluxo:**
```
1. Sandbox inicia VNC service (xvfb + x11vnc)
2. Backend converte VNC para WebSocket (websockify)
3. Frontend conecta via NoVNC
4. Usuário vê tela do sandbox no navegador
```

### 3. **Chrome Headless Integrado**

**Funcionalidades:**
- Navegação web autônoma
- Chrome DevTools Protocol (CDP) para controle
- Screenshots e capturas
- Execução de JavaScript

**Configuração:**
```python
# Chrome browser arguments
SANDBOX_CHROME_ARGS=
# Chrome CDP port
SANDBOX_CDP_PORT=9222
```

### 4. **MCP (Model Context Protocol) Support**

**Funcionalidades:**
- Integração com MCP servers
- Ferramentas externas via MCP
- Extensibilidade através de MCP

**Configuração:**
```python
# MCP configuration file path
MCP_CONFIG_PATH=/etc/mcp.json
```

### 5. **Múltiplos Provedores de Busca**

**Suporte:**
- Bing (padrão)
- Google (com API key)
- Baidu

**Configuração:**
```python
SEARCH_PROVIDER=bing
# Para Google:
GOOGLE_SEARCH_API_KEY=
GOOGLE_SEARCH_ENGINE_ID=
```

### 6. **Sistema de Autenticação Flexível**

**Opções:**
- `password`: Autenticação com senha (hash + salt)
- `local`: Autenticação local (email/password)
- `none`: Sem autenticação

**Configuração:**
```python
AUTH_PROVIDER=password
PASSWORD_SALT=
PASSWORD_HASH_ROUNDS=10
JWT_SECRET_KEY=your-secret-key
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## 🚀 Funcionalidades Principais

### 1. **Execução de Código em Sandbox**

- Python, JavaScript, Shell, etc.
- Ambiente isolado por container
- Captura de output e erros
- Timeout configurável

### 2. **Navegação Web Autônoma**

- Chrome headless integrado
- Navegação autônoma
- Screenshots
- Execução de JavaScript
- CDP para controle avançado

### 3. **Visualização em Tempo Real**

- VNC server no sandbox
- NoVNC no frontend
- Ver execução em tempo real
- Debug visual

### 4. **Gerenciamento de Sandboxes**

- Criação dinâmica de containers
- TTL para limpeza automática
- Isolamento por tarefa
- Recursos configuráveis

### 5. **Integração com LLM**

- OpenAI-compatible API
- Function calling
- JSON format output
- Suporte a múltiplos modelos (DeepSeek, GPT, etc.)

## 📊 Comparação: AI Manus vs Nosso Sistema

| Feature | AI Manus | Nosso Sistema | Status |
|---------|----------|---------------|--------|
| Sandbox Docker | ✅ Isolado | ❌ Não | 🆕 Implementar |
| VNC Visualização | ✅ Sim | ❌ Não | 🆕 Implementar |
| Chrome Headless | ✅ Integrado | ⚠️ Parcial | 🔄 Melhorar |
| MCP Support | ✅ Sim | ❌ Não | 🆕 Implementar |
| Múltiplos Provedores de Busca | ✅ Sim | ⚠️ Limitado | 🔄 Melhorar |
| Autenticação | ✅ Flexível | ⚠️ Básica | 🔄 Melhorar |
| TTL para Sandboxes | ✅ Sim | ❌ Não | 🆕 Implementar |
| AutoGen v2 | ❌ Não | ✅ Sim | ✅ Melhor |
| ChromaDB Memory | ❌ Não | ✅ Sim | ✅ Melhor |
| Router Inteligente | ❌ Não | ✅ Sim | ✅ Melhor |

## 💡 Lições Aprendidas

### 1. **Isolamento com Docker**
- Sandbox isolado por container
- TTL para limpeza automática
- Segurança através de isolamento
- Ambiente limpo para cada tarefa

### 2. **Visualização em Tempo Real**
- VNC para visualização do sandbox
- NoVNC para acesso via web
- Debug visual em tempo real
- Melhor experiência do usuário

### 3. **Chrome Headless Integrado**
- Navegação web autônoma
- CDP para controle avançado
- Screenshots e capturas
- Execução de JavaScript

### 4. **MCP Support**
- Integração com ferramentas externas
- Extensibilidade através de MCP
- Ferramentas modulares

### 5. **Gerenciamento de Sandboxes**
- Criação dinâmica de containers
- TTL para limpeza automática
- Isolamento por tarefa
- Recursos configuráveis

## 🎯 Implementações Recomendadas

### 1. **Sandbox Docker Isolado**
- [ ] Criar sistema de sandbox com Docker
- [ ] Implementar TTL para limpeza automática
- [ ] Isolamento por tarefa
- [ ] Gerenciamento de recursos

### 2. **Visualização VNC**
- [ ] Integrar VNC server no sandbox
- [ ] Implementar NoVNC no frontend
- [ ] WebSocket para comunicação
- [ ] Visualização em tempo real

### 3. **Chrome Headless Avançado**
- [ ] Integrar Chrome headless no sandbox
- [ ] CDP para controle avançado
- [ ] Screenshots e capturas
- [ ] Execução de JavaScript

### 4. **MCP Support**
- [ ] Integrar MCP servers
- [ ] Ferramentas externas via MCP
- [ ] Extensibilidade através de MCP

### 5. **Múltiplos Provedores de Busca**
- [ ] Suporte a Bing, Google, Baidu
- [ ] Configuração flexível
- [ ] Fallback automático

### 6. **Sistema de Autenticação Melhorado**
- [ ] Autenticação com JWT
- [ ] Múltiplos provedores (password, local, none)
- [ ] Refresh tokens
- [ ] Segurança aprimorada

## 🔧 Arquitetura Proposta

### Sandbox Service

```typescript
interface SandboxConfig {
  image: string;
  namePrefix: string;
  ttlMinutes: number;
  network: string;
  chromeArgs?: string;
  resources?: {
    cpu?: string;
    memory?: string;
  };
}

interface Sandbox {
  id: string;
  containerId: string;
  vncPort: number;
  cdpPort: number;
  createdAt: Date;
  expiresAt: Date;
  status: "running" | "stopped" | "expired";
}
```

### VNC Integration

```typescript
// Backend: VNC to WebSocket
import { createServer } from "websockify";

const vncServer = createServer({
  target: `localhost:5900`, // VNC port
  source: `localhost:6080`, // WebSocket port
});
```

### Chrome Headless Integration

```typescript
// Chrome CDP integration
import { Chrome } from "chrome-remote-interface";

const chrome = new Chrome({
  host: "localhost",
  port: 9222, // CDP port
});
```

## 📝 Exemplo de Uso

### Criar Sandbox

```typescript
const sandbox = await createSandbox({
  image: "manus-sandbox",
  ttlMinutes: 30,
  chromeArgs: "--headless --no-sandbox",
});

// Sandbox criado:
// - Container Docker isolado
// - VNC server na porta 5900
// - Chrome CDP na porta 9222
// - WebSocket na porta 6080
```

### Executar Código no Sandbox

```typescript
const result = await executeInSandbox(sandbox.id, {
  code: "print('Hello, World!')",
  language: "python",
});

// Código executado no container isolado
// Output capturado e retornado
```

### Navegar na Web

```typescript
const result = await navigateInSandbox(sandbox.id, {
  url: "https://example.com",
  actions: ["screenshot", "extract_text"],
});

// Chrome headless navega para URL
// Screenshot capturado
// Texto extraído
```

### Visualizar Sandbox

```typescript
// Frontend: Conectar via NoVNC
const vncUrl = `ws://localhost:6080?token=${sandbox.token}`;
// NoVNC conecta e mostra tela do sandbox
```

## 🚀 Próximos Passos

1. **Implementar Sandbox Docker**
   - Criar sistema de sandbox com Docker
   - Implementar TTL para limpeza automática
   - Isolamento por tarefa

2. **Integrar VNC**
   - VNC server no sandbox
   - NoVNC no frontend
   - WebSocket para comunicação

3. **Chrome Headless Avançado**
   - Integrar Chrome headless no sandbox
   - CDP para controle avançado
   - Screenshots e capturas

4. **MCP Support**
   - Integrar MCP servers
   - Ferramentas externas via MCP

5. **Múltiplos Provedores de Busca**
   - Suporte a Bing, Google, Baidu
   - Configuração flexível

## 📚 Referências

- [AI Manus GitHub](https://github.com/Simpleyyt/ai-manus)
- [NoVNC Documentation](https://github.com/novnc/noVNC)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [MCP Specification](https://modelcontextprotocol.io/)

