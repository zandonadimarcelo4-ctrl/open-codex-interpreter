# Projetos e Bibliotecas para Detecção de Intenção

## 📚 Bibliotecas e Frameworks Open-Source

### 1. **Rasa NLU** (Python)
- **GitHub**: https://github.com/RasaHQ/rasa
- **Descrição**: Framework completo para construção de assistentes conversacionais com detecção de intenção e extração de entidades
- **Características**:
  - Suporte a múltiplas linguagens (incluindo português)
  - Treinamento de modelos personalizados
  - Pipeline configurável (spaCy, TensorFlow, etc.)
  - Integração com diálogos complexos
- **Uso**: Ideal para chatbots e assistentes virtuais

### 2. **spaCy** (Python)
- **GitHub**: https://github.com/explosion/spaCy
- **Descrição**: Biblioteca de NLP industrial com suporte a classificação de texto
- **Características**:
  - Modelos pré-treinados para múltiplas linguagens
  - Pipeline de processamento eficiente
  - Suporte a classificação de intenção via `TextCategorizer`
  - Alta performance
- **Uso**: NLP geral e classificação de intenção

### 3. **Transformers (Hugging Face)** (Python)
- **GitHub**: https://github.com/huggingface/transformers
- **Descrição**: Biblioteca com modelos de linguagem pré-treinados (BERT, GPT, etc.)
- **Características**:
  - Modelos state-of-the-art para classificação de texto
  - Fine-tuning fácil para detecção de intenção
  - Suporte a múltiplas arquiteturas (BERT, RoBERTa, DistilBERT, etc.)
  - Modelos multilíngues
- **Uso**: Detecção de intenção com modelos modernos de IA

### 4. **Snips NLU** (Python)
- **GitHub**: https://github.com/snipsco/snips-nlu
- **Descrição**: Biblioteca de NLP para detecção de intenção e extração de entidades
- **Características**:
  - Foco em privacidade (processamento local)
  - Suporte a múltiplas linguagens
  - Pipeline configurável
  - Leve e eficiente
- **Uso**: Aplicações que precisam de processamento local

### 5. **fastText** (Facebook Research)
- **GitHub**: https://github.com/facebookresearch/fastText
- **Descrição**: Biblioteca para classificação de texto e word embeddings
- **Características**:
  - Treinamento rápido
  - Suporte a múltiplas linguagens
  - Classificação de texto eficiente
  - Leve e escalável
- **Uso**: Classificação de intenção em larga escala

### 6. **scikit-learn** (Python)
- **GitHub**: https://github.com/scikit-learn/scikit-learn
- **Descrição**: Biblioteca de machine learning com algoritmos de classificação
- **Características**:
  - Múltiplos algoritmos de classificação (SVM, Naive Bayes, etc.)
  - Pipeline configurável
  - Fácil de usar
  - Bem documentado
- **Uso**: Classificação de intenção com algoritmos clássicos

## 🎯 Projetos Específicos de Detecção de Intenção

### 1. **Intent Classification with BERT**
- **GitHub**: Vários repositórios com implementações
- **Descrição**: Uso de modelos BERT para classificação de intenção
- **Exemplo**: https://github.com/huggingface/transformers/tree/main/examples/pytorch/text-classification

### 2. **Multi-Intent Detection**
- **Descrição**: Projetos focados em detectar múltiplas intenções em uma única frase
- **Técnicas**: Attention mechanisms, multi-label classification

### 3. **Zero-Shot Intent Classification**
- **Descrição**: Detecção de intenção sem treinamento prévio
- **Técnicas**: Uso de modelos de linguagem grandes (GPT, T5, etc.)

## 🔧 Integração com o Projeto Atual

### Opções para Melhorar a Detecção de Intenção:

1. **Usar Rasa NLU**:
   ```python
   from rasa.nlu.model import Interpreter
   interpreter = Interpreter.load("path/to/model")
   result = interpreter.parse("executa o vs code")
   intent = result['intent']['name']
   ```

2. **Usar Transformers (Hugging Face)**:
   ```python
   from transformers import pipeline
   classifier = pipeline("text-classification", model="distilbert-base-uncased-finetuned-sst-2-english")
   result = classifier("executa o vs code")
   ```

3. **Usar spaCy com TextCategorizer**:
   ```python
   import spacy
   nlp = spacy.load("pt_core_news_sm")
   # Adicionar TextCategorizer ao pipeline
   ```

4. **Usar LLM para Detecção de Intenção**:
   - Usar Ollama/DeepSeek-R1 para classificar intenção
   - Mais flexível e adaptável
   - Já está disponível no projeto

## 📊 Comparação Rápida

| Biblioteca | Linguagem | Complexidade | Performance | Suporte PT-BR |
|------------|-----------|--------------|-------------|---------------|
| Rasa NLU | Python | Média | Alta | ✅ Sim |
| spaCy | Python | Baixa | Muito Alta | ✅ Sim |
| Transformers | Python | Média | Muito Alta | ✅ Sim |
| Snips NLU | Python | Baixa | Média | ✅ Sim |
| fastText | Python/C++ | Baixa | Alta | ✅ Sim |
| scikit-learn | Python | Baixa | Média | ⚠️ Manual |

## 🚀 Recomendações para o Projeto

1. **Curto Prazo**: Melhorar a função `detectIntentLocal` atual com mais padrões e palavras-chave ✅ (Já feito)
2. **Médio Prazo**: Integrar spaCy ou fastText para classificação mais precisa
3. **Longo Prazo**: Treinar um modelo customizado com Transformers usando dados do projeto

## 📝 Referências

- [Rasa Documentation](https://rasa.com/docs/)
- [spaCy Documentation](https://spacy.io/)
- [Hugging Face Transformers](https://huggingface.co/docs/transformers)
- [fastText Documentation](https://fasttext.cc/)
- [scikit-learn Documentation](https://scikit-learn.org/)

