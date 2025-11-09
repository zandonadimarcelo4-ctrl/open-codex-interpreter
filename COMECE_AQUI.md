# 🚀 COMECE AQUI - Início Rápido

## ⚡ Execute Este Comando

```batch
iniciar_tudo.bat
```

Isso irá iniciar automaticamente:
- ✅ Backend Python na porta **8080**
- ✅ Frontend React completo na porta **3000**

## 🌐 URLs para Testar

### Backend
- **API**: http://localhost:8080/api
- **Documentação**: http://localhost:8080/docs

### Frontend
- **Interface**: http://localhost:3000
- **Landing Page**: http://localhost:3000/
- **Home**: http://localhost:3000/app
- **Showcase**: http://localhost:3000/showcase

## 📋 O que o Script Faz

1. Verifica Python
2. Cria ambiente virtual (se necessário)
3. Instala dependências Python (se necessário)
4. Verifica Node.js e pnpm
5. Instala dependências do frontend (se necessário)
6. Inicia Backend (porta 8080)
7. Inicia Frontend (porta 3000)

## ⏱️ Tempo de Inicialização

- **Backend**: ~5-10 segundos
- **Frontend**: ~10-15 segundos

## ✅ Verificar se Está Funcionando

Após executar `iniciar_tudo.bat`, aguarde alguns segundos e abra:

1. http://localhost:8080/docs - Deve mostrar a documentação da API
2. http://localhost:3000 - Deve mostrar a interface React

## 🐛 Se Algo Não Funcionar

### Backend não inicia
```batch
.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn open_webui.main:app --reload
```

### Frontend não inicia
```batch
cd autogen_agent_interface
pnpm install
pnpm dev
```

---

**Execute `iniciar_tudo.bat` agora!** 🎉
