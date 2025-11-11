# Pesquisa sobre Detecção de Intenção (Intent Detection)

## Análise da Abordagem Atual (open-codex-interpreter)

O projeto `open-codex-interpreter` utiliza uma abordagem de **Detecção de Intenção Baseada em Regras e Palavras-Chave** (Keyword-based Intent Detection), implementada no arquivo `autogen_agent_interface/client/src/utils/intentDetector.ts`.

**Pontos Fortes da Abordagem Atual:**
1.  **Simplicidade e Velocidade:** É extremamente rápido e fácil de entender.
2.  **Intenções Bem Definidas:** As intenções (`conversation`, `action`, `question`, `command`) e os tipos de ação (`code`, `web`, `file`, `execute`, `create`, `modify`, `delete`, `search`) estão bem definidos.
3.  **Foco em Ação:** A lógica prioriza a detecção de palavras-chave de ação e comandos diretos, o que é crucial para um "interpreter".

**Limitações da Abordagem Atual (e por que ela pode ser inferior ao Codex/Manus):**
1.  **Falta de Nuance e Contexto:** Não consegue lidar com negações, consultas elípticas, sarcasmo ou frases onde a intenção é implícita. Por exemplo, "Eu não quero que você crie um arquivo" pode ser erroneamente classificado como `action: create`.
2.  **Escalabilidade Limitada:** A lista de palavras-chave precisa ser mantida manualmente e não escala bem para um vocabulário amplo ou variações linguísticas.
3.  **Conflito de Intenções:** Frases que contêm palavras de conversação e de ação (ex: "Olá, você pode criar um script Python para mim?") exigem lógica de desempate complexa e frágil.

## Melhores Práticas e Abordagens Avançadas

A pesquisa indica que a abordagem mais robusta para sistemas dinâmicos como o `open-codex-interpreter` é uma **Abordagem Híbrida** que combina a velocidade da classificação baseada em regras com a inteligência contextual de um Large Language Model (LLM) ou um modelo de classificação de texto treinado.

### 1. Abordagem Baseada em LLM (Recomendada para Superar Codex/Manus)

*   **Técnica:** Usar um LLM (como o Qwen 3 4B, mencionado na pesquisa, ou o próprio modelo principal do `open-codex-interpreter`) para atuar como um **Roteador de Agente (Agent Router)**.
*   **Como Funciona:** O LLM recebe o prompt do usuário e, em vez de gerar a resposta final, ele é instruído a gerar uma **chamada de função (Function Call)** ou um **JSON estruturado** que define a intenção.
*   **Vantagens:**
    *   **Contexto e Nuance:** O LLM entende o **significado** da frase, não apenas as palavras-chave.
    *   **Flexibilidade:** Lida com intenções não fixas e linguagem natural complexa.
    *   **Precisão:** Pode ser treinado (via *few-shot prompting* ou *fine-tuning*) para ser extremamente preciso na classificação entre `execution` e `conversation`.

### 2. Abordagem Híbrida (LLM + Regras)

*   **Estratégia:**
    1.  **Pré-filtro Rápido (Regras):** Usar a lógica de palavras-chave atual (`intentDetector.ts`) para intenções óbvias e de alta confiança (ex: "Oi", "Rode o script X"). Isso garante **baixa latência** para casos simples.
    2.  **Roteamento LLM (Fallback):** Para todos os prompts que não se encaixam nas regras de alta confiança, ou que são ambíguos, o prompt é enviado ao LLM para uma **classificação de intenção estruturada**.

### 3. Abordagem Baseada em Classificador (NLP Tradicional)

*   **Técnica:** Treinar um modelo de classificação de texto (como BERT, DistilBERT, ou até mesmo `fastText` ou `spaCy` como mencionado no `INTENT_DETECTION_PROJECTS.md`) com um dataset de exemplos de `execution` e `conversation`.
*   **Vantagens:**
    *   **Rápido e Local:** Após o treinamento, a inferência é muito rápida e pode ser executada localmente (no frontend ou backend).
    *   **Confiável:** Oferece uma pontuação de confiança estatisticamente sólida.
*   **Desvantagens:** Requer um **dataset de treinamento** de alta qualidade, o que o usuário não forneceu.

## Estratégia de Implementação Proposta

Para superar o Codex e o Manus, a melhoria deve se concentrar em usar a capacidade de raciocínio do LLM para a detecção de intenção.

**Ação:** Modificar a lógica de detecção de intenção para usar um **Prompt de Classificação de Intenção** no backend (onde o LLM principal reside) para casos complexos, mantendo a lógica de regras no frontend (`intentDetector.ts`) para otimizar a UX e a latência em casos simples.

**Foco da Implementação:** Criar uma função de *backend* (em Python, já que o projeto tem um `main.py` e um diretório `interpreter/`) que usa o LLM para classificar a intenção de forma estruturada (JSON).

**Intenções Finais:**
*   `execution`: O usuário quer que o agente **faça** algo (código, web, arquivo, etc.).
*   `conversation`: O usuário quer **conversar** ou **perguntar** algo.

**Próxima Fase:** Desenvolver o prompt e a função de classificação de intenção no backend.
