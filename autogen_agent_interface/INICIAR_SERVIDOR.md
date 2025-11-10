# 🚀 Como Iniciar o Servidor

## Opção 1: Script Automático (Windows)

Execute o arquivo `dev-start.bat`:
```bash
dev-start.bat
```

Isso vai:
1. Iniciar o Parcel em uma janela separada
2. Aguardar 5 segundos
3. Iniciar o Express na janela atual

## Opção 2: Manual (Dois Terminais)

### Terminal 1 - Parcel (Frontend):
```bash
npx parcel serve client/index.html --host 0.0.0.0 --port 1234
```

### Terminal 2 - Express (Backend):
```bash
npm run dev
```

## Opção 3: Usando npm-run-all (Se instalado)

```bash
npm run dev:all
```

## ⚠️ Importante

1. **O Parcel deve estar rodando ANTES do Express**
2. **O Parcel escuta na porta 1234** (padrão)
3. **O Express escuta na porta 3000** (padrão)
4. **O Express faz proxy das requisições para o Parcel**

## 🔍 Verificar se está funcionando

1. **Parcel**: Abra http://localhost:1234 (deve mostrar a aplicação)
2. **Express**: Abra http://localhost:3000 (deve fazer proxy para o Parcel)

## 🐛 Problemas?

### Parcel não inicia
- Verifique se a porta 1234 está disponível
- Tente outra porta: `PARCEL_PORT=1235 npx parcel serve client/index.html --host 0.0.0.0 --port 1235`

### Express não encontra Parcel
- Certifique-se de que o Parcel está rodando
- Verifique se a porta do Parcel está correta (padrão: 1234)
- Verifique a variável de ambiente `PARCEL_PORT`

### Erro 503 (Parcel server not available)
- O Parcel não está rodando ou não está acessível
- Inicie o Parcel primeiro
- Verifique se a porta está correta

