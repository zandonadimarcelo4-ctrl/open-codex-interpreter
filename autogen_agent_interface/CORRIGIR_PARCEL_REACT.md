# 🔧 Corrigir Erro: Parcel não está bundlando React corretamente

## ❌ Problema

O Parcel está gerando código que tenta importar módulos React como externos:
```javascript
import * as __parcelExternal0 from "react/jsx-dev-runtime";
```

Isso causa o erro:
```
Uncaught TypeError: Failed to resolve module specifier "react/jsx-dev-runtime". 
Relative references must start with either "/", "./", or "../".
```

## 🔍 Causa

O Parcel está marcando os módulos React como "externos" ao invés de fazer o bundle deles. Isso pode acontecer quando:

1. O cache do Parcel está corrompido
2. O Parcel está rodando a partir do diretório errado
3. Há uma configuração que está forçando módulos como externos

## ✅ Solução

### 1. Limpar Cache do Parcel

```bash
# Parar o servidor Parcel
# Depois, limpar o cache:
rm -rf .parcel-cache .parcel-dist
# ou no Windows:
rmdir /s /q .parcel-cache .parcel-dist
```

### 2. Verificar que o Parcel está rodando a partir do diretório correto

O Parcel deve ser executado a partir do diretório raiz do projeto (`autogen_agent_interface`), não do diretório `client`.

### 3. Reiniciar o Parcel

```bash
npm run dev:parcel
```

### 4. Acessar através do Express (não diretamente no Parcel)

**IMPORTANTE**: Acesse através do Express na porta 3001 (ou a porta que o Express estiver usando), não diretamente na porta 5173 do Parcel.

- ✅ **Correto**: `http://localhost:3001/`
- ❌ **Errado**: `http://localhost:5173/`

O Express faz o proxy para o Parcel e serve os arquivos públicos (manifest.json, favicon, etc) corretamente.

## 🚀 Testar

1. Limpar cache do Parcel
2. Reiniciar o servidor: `npm run dev:all`
3. Acessar `http://localhost:3001/` (não 5173)
4. Verificar se o React está funcionando corretamente

## 📝 Notas

- O Parcel em modo de desenvolvimento pode usar módulos ES nativos para melhor performance, mas isso não funciona quando os módulos não estão disponíveis como módulos ES
- O Express serve os arquivos públicos (manifest.json, favicon, etc) antes do proxy do Parcel
- O proxy do Parcel captura todas as outras requisições

