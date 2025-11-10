# 🚀 Guia Completo: Configuração do Vite

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Como Funciona](#como-funciona)
3. [Estrutura de Arquivos](#estrutura-de-arquivos)
4. [Configurações Importantes](#configurações-importantes)
5. [Problemas Comuns](#problemas-comuns)
6. [Como Adicionar Novos Assets](#como-adicionar-novos-assets)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Este projeto usa **Vite** como ferramenta de desenvolvimento para:
- ✅ Compilar TypeScript/JavaScript
- ✅ Processar CSS/SCSS
- ✅ Servir arquivos estáticos (imagens, fontes, etc)
- ✅ Funcionar com **localhost** (http://localhost:3000)
- ✅ Funcionar com **Tailscale** (https://revision-pc.tailb3613b.ts.net)

---

## 🔧 Como Funciona

### Fluxo de Requisições

```
1. Cliente faz requisição → Express
2. Express verifica tipo de requisição:
   ├─ Se for /api/* ou /ws → Processa normalmente (Express)
   ├─ Se for asset estático → Processa com Vite
   └─ Se for HTML/SPA → Serve index.html transformado pelo Vite
```

### Processamento de Assets

```
Requisição de asset (ex: /src/main.tsx)
  ↓
Vite processa o arquivo
  ├─ Compila TypeScript → JavaScript
  ├─ Processa imports
  └─ Retorna arquivo processado
```

### Servir HTML (SPA Routing)

```
Requisição de rota (ex: /chat)
  ↓
Vite transforma index.html
  ├─ Injeta scripts necessários
  ├─ Corrige URLs para Tailscale (se necessário)
  └─ Retorna HTML transformado
```

---

## 📁 Estrutura de Arquivos

### `server/_core/vite.ts`
**Função principal**: `setupVite(app, server, port)`

**O que faz**:
- Configura o servidor Vite em modo middleware
- Processa requisições de assets estáticos
- Serve HTML transformado para SPA routing
- Corrige URLs para Tailscale

**Funções**:
- `setupVite()` - Configura Vite para desenvolvimento
- `serveStatic()` - Serve arquivos estáticos em produção

### `server/_core/vite-allow-all-hosts.ts`
**Função principal**: `viteAllowAllHosts()`

**O que faz**:
- Plugin do Vite que permite TODOS os hosts
- Necessário para Tailscale funcionar
- Adiciona headers de proxy para requisições Tailscale

---

## ⚙️ Configurações Importantes

### 1. HMR (Hot Module Replacement) - DESABILITADO

```typescript
const disableHMR = true; // Linha ~43
```

**Por quê?**
- HMR causa loops infinitos de recarregamento no localhost
- Conflitos entre HTTP (localhost) e HTTPS (Tailscale)

**Como recarregar código?**
- Pressione **F5** no navegador
- Ou use **Ctrl+R** / **Cmd+R**

**⚠️ ATENÇÃO**: Não habilite HMR sem entender as consequências!

### 2. Allowed Hosts - `true`

```typescript
allowedHosts: true, // Permite TODOS os hosts
```

**Por quê?**
- Necessário para Tailscale funcionar
- Permite localhost, Tailscale, IPs, etc

**⚠️ ATENÇÃO**: Não altere isso!

### 3. Middleware Mode - `true`

```typescript
middlewareMode: true, // Vite como middleware do Express
```

**Por quê?**
- Integração com Express
- Vite não roda como servidor standalone

**⚠️ ATENÇÃO**: Não altere isso!

---

## 🐛 Problemas Comuns

### Problema 1: Assets não carregam no Tailscale

**Sintomas**:
- Erro 403 ou 500 ao acessar assets via Tailscale
- Página em branco
- Erros no console do navegador

**Soluções**:
1. Verifique se o hostname termina com `.ts.net`
2. Verifique os logs do servidor:
   ```
   [Vite] 📦 Tailscale: GET /src/main.tsx
   ```
3. Verifique se `allowedHosts: true` está configurado
4. Reinicie o servidor

### Problema 2: Loop infinito no localhost

**Sintomas**:
- Página recarrega infinitamente
- Console do navegador mostra muitas requisições

**Soluções**:
1. Verifique se `disableHMR = true` (linha ~43)
2. Limpe o cache do navegador (Ctrl+Shift+Delete)
3. Reinicie o servidor
4. Feche e abra o navegador

### Problema 3: Erro 500 ao acessar via Tailscale

**Sintomas**:
- Erro 500 (Internal Server Error) no navegador
- Assets não carregam

**Soluções**:
1. Verifique os logs do servidor para detalhes do erro
2. Verifique se o plugin `vite-allow-all-hosts` está ativo
3. Verifique se os headers de proxy estão sendo adicionados
4. Reinicie o servidor

### Problema 4: URLs incorretas no Tailscale

**Sintomas**:
- Assets tentam carregar de `localhost` em vez do hostname do Tailscale
- Erros de CORS ou 404

**Soluções**:
1. Verifique se o script Tailscale está sendo injetado no HTML
2. Verifique os logs:
   ```
   [Vite] 🔄 Corrigindo URLs para Tailscale: revision-pc.tailb3613b.ts.net
   ```
3. Limpe o cache do navegador
4. Reinicie o servidor

---

## ➕ Como Adicionar Novos Assets

Para adicionar novos tipos de arquivo estático, edite `server/_core/vite.ts`:

```typescript
// Encontre a seção "Lista de tipos de arquivo" (linha ~140)

const staticFileExtensions = [
  '.js', '.mjs', '.ts', '.tsx', '.jsx',
  '.css', '.scss', '.sass', '.less',
  '.json',
  '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico',
  '.woff', '.woff2', '.ttf',
  // 👇 ADICIONE AQUI:
  '.seu-tipo-de-arquivo',
];
```

**Exemplo**: Adicionar suporte para `.mp4` (vídeos)

```typescript
const staticFileExtensions = [
  // ... outros tipos ...
  '.mp4',  // 👈 Adicionado
];
```

---

## 🔍 Troubleshooting

### Verificar Logs do Servidor

Os logs do servidor mostram o que está acontecendo:

```
[Vite] ⚙️  Configurando servidor
[Vite] 📍 Porta: 3000
[Vite] 🔥 HMR: DESABILITADO
[Vite Plugin] ✅ Plugin ativado - todos os hosts permitidos
[Vite] 📦 GET /src/main.tsx
[Vite] 🔄 Corrigindo URLs para Tailscale: revision-pc.tailb3613b.ts.net
```

### Verificar no Navegador

1. Abra o **Console do Desenvolvedor** (F12)
2. Verifique a aba **Network** para ver requisições falhando
3. Verifique a aba **Console** para mensagens do Vite

### Comandos Úteis

```bash
# Reiniciar servidor
npm run dev

# Limpar cache do Vite
rm -rf node_modules/.vite

# Verificar versão do Vite
npm list vite

# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Recursos Adicionais

- [Documentação do Vite](https://vitejs.dev/)
- [Vite Middleware Mode](https://vitejs.dev/guide/ssr.html)
- [Tailscale Funnel](https://tailscale.com/kb/1242/funnel)

---

## 🆘 Precisa de Ajuda?

1. Verifique os logs do servidor
2. Verifique o console do navegador
3. Verifique este guia
4. Consulte a documentação do Vite
5. Peça ajuda para um desenvolvedor sênior

---

**Última atualização**: 2024
**Versão do Vite**: Verifique com `npm list vite`

