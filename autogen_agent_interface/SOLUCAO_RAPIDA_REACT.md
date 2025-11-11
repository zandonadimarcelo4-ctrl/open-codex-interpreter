# ✅ Solução Rápida: Parcel + React

## 🎯 Problema

Erro: `Failed to resolve module specifier "react/jsx-dev-runtime"`

## ✅ Solução em 3 Passos

### 1. Verificar se React está instalado

```bash
pnpm list react react-dom
```

Deve mostrar:
```
react@18.3.1
react-dom@18.3.1
```

Se não estiver instalado:
```bash
pnpm install react react-dom
```

### 2. Garantir que o Parcel está rodando corretamente

O Parcel deve ser executado a partir do diretório raiz do projeto:
```bash
npx parcel serve client/index.html --host 0.0.0.0 --port 5173
```

Ou use o script configurado:
```bash
npm run dev:parcel
```

### 3. Acessar através do Express (NÃO diretamente no Parcel)

**✅ CORRETO:**
```
http://localhost:3001/
```

**❌ ERRADO:**
```
http://localhost:5173/  ← NÃO FAÇA ISSO!
```

## 🔍 Por Que Isso Resolve?

O Parcel precisa encontrar `react` e `react-dom` no `node_modules` para:
1. Detectar que você está usando React
2. Transformar JSX corretamente
3. Bundlar `react/jsx-dev-runtime` ao invés de tentar importá-lo como módulo externo

## 🚨 Se Ainda Não Funcionar

### Limpar cache e reinstalar

```bash
# Parar todos os servidores
taskkill /F /IM node.exe

# Limpar cache
rmdir /s /q .parcel-cache .parcel-dist

# Reinstalar dependências
pnpm install

# Reiniciar
npm run dev:all
```

### Verificar estrutura do projeto

O Parcel deve encontrar:
- `client/index.html` (arquivo de entrada)
- `client/src/main.tsx` (arquivo React principal)
- `node_modules/react` (React instalado)
- `node_modules/react-dom` (React-DOM instalado)

## 📝 Configuração Correta

### `package.json`
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "scripts": {
    "dev:parcel": "parcel serve client/index.html --host 0.0.0.0 --port 5173"
  }
}
```

### `client/index.html`
```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>AutoGen Super Agent</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./src/main.tsx"></script>
  </body>
</html>
```

### `client/src/main.tsx`
```tsx
import { createRoot } from "react-dom/client";
import App from "./App";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
```

## 🎯 Resumo

1. ✅ Verificar se React está instalado (`pnpm list react react-dom`)
2. ✅ Rodar Parcel corretamente (`npm run dev:parcel`)
3. ✅ Acessar através do Express (`http://localhost:3001/`)
4. ✅ Se não funcionar, limpar cache e reinstalar

## 💡 Dica

O Parcel detecta automaticamente React quando encontra:
- `react` e `react-dom` no `node_modules`
- Arquivos `.tsx` ou `.jsx` no projeto
- JSX no código (`<App />`)

Não é necessário configuração adicional!
