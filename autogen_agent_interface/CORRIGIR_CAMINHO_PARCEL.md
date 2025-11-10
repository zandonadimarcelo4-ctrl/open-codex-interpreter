# 🔧 Corrigir Erro: Failed to resolve '/src/main.tsx'

## ❌ Erro

```
@parcel/core: Failed to resolve '/src/main.tsx' from './client/index.html'
Cannot load file './src/main.tsx' in './'.
```

## 🔍 Causa

O Parcel está tentando resolver `/src/main.tsx` como um caminho absoluto a partir da raiz do projeto, mas o arquivo está em `client/src/main.tsx`.

## ✅ Solução Aplicada

### 1. Caminho Relativo no HTML

Mudei o caminho no `client/index.html` de:
```html
<script type="module" src="/src/main.tsx"></script>
```

Para:
```html
<script type="module" src="./src/main.tsx"></script>
```

### 2. package.json no Diretório client

Criei `client/package.json` para que o Parcel saiba que `client` é o diretório raiz:

```json
{
  "name": "client",
  "version": "1.0.0",
  "private": true,
  "source": "index.html"
}
```

### 3. Configuração do Parcel

Atualizei os scripts para usar `--dist-dir .parcel-dist`:

```json
"dev:parcel": "cross-env PARCEL_CACHE_DIR=.parcel-cache parcel serve client/index.html --dist-dir .parcel-dist --host 0.0.0.0 --port 1234"
```

## 🚀 Testar

Execute o servidor novamente:

```bash
npm run dev:parcel
```

Ou use o script automático:

```bash
dev-start.bat
# ou
powershell -ExecutionPolicy Bypass -File start-dev.ps1
```

## 📝 Estrutura de Arquivos

```
autogen_agent_interface/
├── client/
│   ├── package.json      ← NOVO: Define client como raiz
│   ├── index.html        ← Atualizado: ./src/main.tsx
│   └── src/
│       └── main.tsx      ← Arquivo principal
├── .parcelrc
├── package.json
└── ...
```

## 🐛 Se Ainda Tiver Problemas

### Verificar se o caminho está correto

```bash
# Verificar se o arquivo existe
ls client/src/main.tsx

# Verificar o conteúdo do HTML
cat client/index.html | grep main.tsx
```

### Limpar cache do Parcel

```bash
# Remover cache
rm -rf .parcel-cache
rm -rf .parcel-dist

# Tentar novamente
npm run dev:parcel
```

### Executar Parcel do diretório client

```bash
cd client
npx parcel serve index.html --host 0.0.0.0 --port 1234
```

## ✅ Próximos Passos

1. Execute `npm run dev:parcel` ou o script automático
2. Verifique se o Parcel inicia sem erros
3. Acesse http://localhost:1234 para ver se funciona
4. Se funcionar, inicie o Express também

