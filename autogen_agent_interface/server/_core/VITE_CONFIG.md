# Configuração do Vite - Guia para Desenvolvedores

## Visão Geral

Este documento explica como o Vite está configurado para funcionar com:
- **Localhost (desenvolvimento local)**: HTTP na porta 3000
- **Tailscale Funnel**: HTTPS via proxy reverso (revision-pc.tailb3613b.ts.net)

## Problemas Resolvidos

### 1. Loop Infinito de Recarregamento (Localhost)
**Problema**: A página recarregava infinitamente no localhost.
**Solução**: HMR (Hot Module Replacement) foi desabilitado completamente.
- **Arquivo**: `server/_core/vite.ts` - linha 20
- **Motivo**: O HMR causa conflitos entre HTTP/WS no localhost e HTTPS/WSS no Tailscale

### 2. Erro 403/500 no Tailscale
**Problema**: Assets retornavam erro 403 ou 500 quando acessados via Tailscale.
**Solução**: Modificamos temporariamente o header `host` para `localhost` antes de processar com Vite.
- **Arquivo**: `server/_core/vite.ts` - linhas 141-182
- **Como funciona**: 
  1. Detecta se é requisição Tailscale (hostname termina com `.ts.net`)
  2. Salva o hostname original
  3. Modifica temporariamente para `localhost:3000`
  4. Processa com Vite
  5. Restaura o hostname original

## Estrutura de Arquivos

### `server/_core/vite.ts`
- **Função principal**: `setupVite(app, server, port)`
- **Responsabilidades**:
  - Configurar servidor Vite em modo middleware
  - Processar requisições de assets estáticos
  - Servir HTML transformado para SPA routing
  - Corrigir URLs para Tailscale

### `server/_core/vite-allow-all-hosts.ts`
- **Função principal**: `viteAllowAllHosts()`
- **Responsabilidades**:
  - Plugin do Vite que força `allowedHosts: true`
  - Permite que qualquer host acesse o servidor Vite

## Como Adicionar Novos Assets

Para adicionar novos tipos de arquivo estático, edite `server/_core/vite.ts` na linha ~119:

```typescript
const isStaticAsset = url.includes('/src/') || 
                     url.includes('/node_modules/') ||
                     url.endsWith('.js') ||
                     url.endsWith('.css') ||
                     // Adicione aqui:
                     url.endsWith('.seu-tipo-de-arquivo');
```

## Como Debuggar

### Logs do Servidor
- `[Vite] Configurando servidor`: Configuração inicial do Vite
- `[Vite] Tailscale: ...`: Requisições do Tailscale sendo processadas
- `[Vite] ❌ Erro: ...`: Erros ao processar requisições

### Verificar no Navegador
1. Abra o Console do Desenvolvedor (F12)
2. Verifique a aba Network para ver requisições falhando
3. Verifique a aba Console para mensagens do Vite

## Troubleshooting

### Problema: Assets não carregam no Tailscale
**Solução**: 
1. Verifique se o hostname termina com `.ts.net`
2. Verifique os logs do servidor para erros
3. Verifique se `allowedHosts: true` está configurado

### Problema: Loop infinito no localhost
**Solução**: 
1. Verifique se `disableHMR = true` (linha 20)
2. Limpe o cache do navegador
3. Reinicie o servidor

### Problema: Erro 500 ao acessar via Tailscale
**Solução**:
1. Verifique os logs do servidor para detalhes do erro
2. Verifique se o hostname está sendo modificado corretamente
3. Verifique se os headers de proxy estão sendo adicionados

## Configurações Importantes

### HMR Desabilitado
```typescript
const disableHMR = true; // Linha 20
```
**Não altere isso** a menos que você saiba o que está fazendo. O HMR causa problemas com Tailscale.

### Allowed Hosts
```typescript
allowedHosts: true, // Permite todos os hosts
```
**Não altere isso** - necessário para Tailscale funcionar.

### Middleware Mode
```typescript
middlewareMode: true, // Vite como middleware do Express
```
**Não altere isso** - necessário para integração com Express.

