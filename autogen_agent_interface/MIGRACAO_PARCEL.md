# 🚀 Migração do Vite para Parcel - Guia Completo

## ✅ O Que Foi Feito

1. ✅ Instalado Parcel e `http-proxy-middleware`
2. ✅ Criado `server/_core/parcel.ts` (substitui `vite.ts`)
3. ✅ Atualizado `server/_core/index.ts` para usar Parcel
4. ✅ Criado `.parcelrc` (configuração do Parcel)
5. ✅ Atualizado `package.json` (scripts e dependências)

## 📋 Próximos Passos

### 1. Instalar Dependências

```bash
cd open-codex-interpreter/autogen_agent_interface
npm install
# ou
pnpm install
```

### 2. Iniciar Desenvolvimento

**Opção A: Script Automático (Recomendado)**

Inicia Express e Parcel automaticamente:
```bash
npm run dev:all
```

**Opção B: Dois Terminais Separados**

Terminal 1 - Express (Backend):
```bash
npm run dev
```

Terminal 2 - Parcel (Frontend):
```bash
npm run dev:parcel
```

**⚠️ IMPORTANTE**: Certifique-se de executar os comandos do diretório do projeto:
```bash
cd E:\cordex\open-codex-interpreter\autogen_agent_interface
```

### 3. Acessar a Aplicação

- **Localhost**: http://localhost:3000
- **LAN**: http://SEU-IP:3000
- **Tailscale**: https://revision-pc.tailb3613b.ts.net

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Porta do Express (padrão: 3000)
PORT=3000

# Porta do Parcel (padrão: 1234)
PARCEL_PORT=1234

# Modo de desenvolvimento
NODE_ENV=development
```

### Arquivos Modificados

- `server/_core/parcel.ts` - Nova implementação com Parcel
- `server/_core/index.ts` - Atualizado para usar Parcel
- `package.json` - Adicionado Parcel e atualizado scripts
- `.parcelrc` - Configuração do Parcel

### Arquivos a Remover (Opcional)

- `server/_core/vite.ts` - Não é mais necessário
- `server/_core/vite-allow-all-hosts.ts` - Não é mais necessário
- `vite.config.ts` - Não é mais necessário (mas pode manter para referência)

## 🎯 Vantagens do Parcel

1. ✅ **Zero-config**: Não precisa de configuração complexa
2. ✅ **Funciona em LAN**: Escuta em `0.0.0.0` por padrão
3. ✅ **HMR estável**: Hot Module Replacement sem loops infinitos
4. ✅ **Tailscale funciona**: Sem problemas de hostname
5. ✅ **Simples para devs juniores**: Configuração mínima

## 🐛 Solução de Problemas

### Parcel não inicia

```bash
# Verificar se a porta está disponível
netstat -an | findstr 1234

# Usar outra porta
PARCEL_PORT=1235 npx parcel serve client/index.html --host 0.0.0.0 --port 1235
```

### Erro 503 (Parcel server not available)

Certifique-se de que o Parcel está rodando na porta correta:
```bash
npx parcel serve client/index.html --host 0.0.0.0 --port 1234
```

### Porta já em uso

Altere a porta do Parcel:
```bash
PARCEL_PORT=1235 npm run dev
```

E no outro terminal:
```bash
npx parcel serve client/index.html --host 0.0.0.0 --port 1235
```

## 📝 Notas

- O Parcel precisa estar rodando **antes** do Express fazer proxy
- O Express faz proxy de todas as requisições (exceto `/api` e `/ws`) para o Parcel
- O Parcel processa e serve os arquivos do frontend (JS, CSS, etc)
- Funciona perfeitamente com Tailscale e LAN

## ✅ Melhorias Implementadas

1. ✅ Script `dev:all` que inicia ambos automaticamente
2. ✅ Script `dev:parcel` para iniciar apenas o Parcel
3. ✅ Tratamento de erros melhorado
4. ✅ Suporte a variáveis de ambiente (`PARCEL_PORT`)

## 🚀 Próximas Melhorias (Opcional)

1. Adicionar hot-reload do backend
2. Melhorar logs do Parcel
3. Adicionar suporte a mais configurações do Parcel

