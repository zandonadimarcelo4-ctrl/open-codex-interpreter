# 🔧 Correção de Conflitos de Dependências

## ⚠️ Conflitos Identificados

Os seguintes conflitos foram detectados após instalar AutoGen v2:

1. **camel-ai**: Requer `openai<2,>=1.86.0`, mas temos `openai 2.7.1`
2. **camel-ai**: Requer `tiktoken<0.8,>=0.7.0`, mas temos `tiktoken 0.12.0`
3. **camel-ai**: Requer `pillow<11.0.0,>=10.1.0`, mas temos `pillow 12.0.0`
4. **langchain-openai**: Requer `openai<2.0.0,>=1.58.1`, mas temos `openai 2.7.1`
5. **browsergym-experiments**: Requer `dataclasses-json`, mas não está instalado

## ✅ Solução

### Opção 1: Remover dependências conflitantes (Recomendado)

Se não estiver usando `camel-ai` ou `langchain-openai` diretamente:

```bash
pip uninstall camel-ai langchain-openai browsergym-experiments -y
```

### Opção 2: Usar ambiente virtual isolado

Criar ambiente virtual específico para o projeto:

```bash
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r super_agent/requirements_fixed.txt
```

### Opção 3: Atualizar requirements.txt

O arquivo `super_agent/requirements_fixed.txt` foi criado com versões compatíveis:

- `autogen-agentchat>=0.7.0` ✅
- `autogen-ext[openai]>=0.7.0` ✅
- `chromadb>=0.4.24,<0.5.0` ✅
- `openai>=2.0.0` ✅ (compatível com autogen-ext)
- `pillow>=11.0.0,<13.0.0` ✅
- `tiktoken>=0.8.0` ✅

## 📦 Instalação Limpa

Para instalar dependências sem conflitos:

```bash
# 1. Desinstalar pacotes conflitantes (opcional)
pip uninstall camel-ai langchain-openai -y

# 2. Instalar dependências corretas
pip install -r super_agent/requirements_fixed.txt

# 3. Verificar instalação
pip check
```

## 🎯 Dependências Essenciais

As seguintes dependências são essenciais e devem ser mantidas:

- ✅ `autogen-agentchat>=0.7.0` - AutoGen v2 (obrigatório)
- ✅ `autogen-ext[openai]>=0.7.0` - Extensões AutoGen (obrigatório)
- ✅ `chromadb>=0.4.24,<0.5.0` - Memória vetorial (obrigatório)
- ✅ `openai>=2.0.0` - Compatível com autogen-ext
- ✅ `tiktoken>=0.8.0` - Compatível com autogen-ext
- ✅ `pillow>=11.0.0,<13.0.0` - Compatível com autogen-core

## 📝 Notas

1. **camel-ai** e **langchain-openai** são opcionais e podem ser removidos se não estiverem em uso
2. **browsergym-experiments** também é opcional
3. O AutoGen v2 requer `openai>=2.0.0`, então pacotes que requerem `openai<2.0.0` são incompatíveis
4. Recomenda-se usar ambiente virtual para isolar dependências

## 🚀 Próximos Passos

1. Instalar dependências do `requirements_fixed.txt`
2. Verificar se tudo funciona: `pip check`
3. Testar AutoGen v2 com memória ChromaDB
4. Remover pacotes não utilizados se necessário

