# Integração do Sistema Cognitivo ANIMA

## 📋 Visão Geral

Este documento descreve como o sistema cognitivo ANIMA foi integrado com o sistema TypeScript existente (`autogen.ts`).

## 🔗 Componentes de Integração

### 1. Cognitive Bridge (TypeScript)
**Arquivo:** `autogen_agent_interface/server/utils/cognitive_bridge.ts`

Ponte TypeScript que permite chamar o sistema cognitivo Python a partir do código TypeScript.

**Funcionalidades:**
- `processWithCognitiveSystem()` - Processa tarefa com sistema cognitivo
- `learnFromResponse()` - Aprende com resposta recebida
- `getCognitiveSummary()` - Obtém resumo do estado cognitivo
- `enrichMessageWithCognitiveContext()` - Enriquece mensagem com contexto (modo simplificado)

### 2. Cognitive Bridge (Python)
**Arquivo:** `anima/orchestrator/cognitive_bridge.py`

Script Python que permite chamar o sistema cognitivo ANIMA a partir de TypeScript via linha de comando.

**Funcionalidades:**
- Processa tarefa com sistema cognitivo
- Aprende com resposta recebida
- Obtém resumo do estado cognitivo
- Cache de orquestradores por usuário

### 3. Integração no AutoGen
**Arquivo:** `autogen_agent_interface/server/utils/autogen.ts`

Integração do sistema cognitivo no fluxo de execução do AutoGen.

**Modificações:**
1. **Enriquecimento de Tarefa**: Antes de processar, a tarefa é enriquecida com contexto cognitivo
2. **Aprendizado**: Após receber resposta, o sistema cognitivo aprende com a experiência
3. **Não-bloqueante**: Se o sistema cognitivo não estiver disponível, o sistema continua funcionando normalmente

## 🔄 Fluxo de Integração

```
1. Usuário envia mensagem
   ↓
2. executeWithAutoGen() é chamado
   ↓
3. processWithCognitiveSystem() enriquece tarefa (opcional)
   ↓
4. Tarefa enriquecida é processada pelo AutoGen
   ↓
5. Resposta é gerada
   ↓
6. learnFromResponse() aprende com resposta (opcional)
   ↓
7. Resposta é retornada ao usuário
```

## 🚀 Como Usar

### Modo Automático (Recomendado)

O sistema cognitivo é integrado automaticamente no `executeWithAutoGen()`. Não é necessário fazer nada além de ter o sistema Python instalado.

### Modo Manual

Se quiser usar o sistema cognitivo manualmente:

```typescript
import { processWithCognitiveSystem, learnFromResponse } from "./cognitive_bridge";

// Processar tarefa com sistema cognitivo
const cognitiveResult = await processWithCognitiveSystem(
  "Criar função Python",
  { language: "python" },
  "user_123"
);

if (cognitiveResult) {
  console.log(`Confiança: ${cognitiveResult.confidence}`);
  console.log(`Tom emocional: ${cognitiveResult.emotional_tone}`);
  console.log(`Mensagem enriquecida: ${cognitiveResult.enriched_message}`);
}

// Aprender com resposta
await learnFromResponse(
  "Criar função Python",
  "Função criada com sucesso",
  true,
  undefined,
  "user_123"
);
```

## ⚙️ Configuração

### Pré-requisitos

1. **Python 3.11+** instalado
2. **Sistema cognitivo ANIMA** instalado (`anima/core/`, `anima/orchestrator/`)
3. **Dependências Python** instaladas:
   ```bash
   pip install -r requirements.txt
   ```

### Variáveis de Ambiente

Nenhuma variável de ambiente adicional é necessária. O sistema funciona sem configuração adicional.

## 🧪 Testes

### Testar Sistema Cognitivo Python

```bash
cd open-codex-interpreter
python anima/examples/cognitive_example.py
```

### Testar Integração TypeScript

O sistema é testado automaticamente quando `executeWithAutoGen()` é chamado. Se o sistema Python não estiver disponível, o sistema continua funcionando normalmente (modo não-bloqueante).

## 📊 Monitoramento

### Logs

O sistema cognitivo gera logs no console:

```
[AutoGen] 🧠 Mensagem enriquecida com sistema cognitivo
[AutoGen] 🧠 Confiança: 0.75
[AutoGen] 🧠 Tom emocional: positive
[AutoGen] 🧠 Aprendizado cognitivo registrado
```

### Erros

Se o sistema cognitivo não estiver disponível, os erros são logados como avisos (não bloqueiam o fluxo):

```
[AutoGen] ⚠️ Sistema cognitivo não disponível, continuando sem ele
[AutoGen] ⚠️ Erro ao aprender com resposta: ...
```

## 🔧 Troubleshooting

### Sistema Cognitivo Não Disponível

**Sintoma:** Logs mostram "Sistema cognitivo não disponível"

**Soluções:**
1. Verificar se Python está instalado: `python --version`
2. Verificar se dependências estão instaladas: `pip install -r requirements.txt`
3. Verificar se arquivos Python existem: `ls anima/core/ anima/orchestrator/`

### Erro ao Chamar Python Script

**Sintoma:** Erro "Python script failed" ou "timeout"

**Soluções:**
1. Verificar se Python está no PATH
2. Verificar se script existe: `ls anima/orchestrator/cognitive_bridge.py`
3. Testar script manualmente: `python anima/orchestrator/cognitive_bridge.py '{"task":"test"}'`

### Performance Lenta

**Sintoma:** Respostas demoram muito

**Soluções:**
1. O sistema cognitivo é opcional e não-bloqueante
2. Se estiver causando lentidão, pode ser desabilitado removendo as chamadas em `autogen.ts`
3. Cache de orquestradores reduz overhead em chamadas subsequentes

## 📚 Referências

- [ANIMA Cognitive System](./ANIMA_COGNITIVE_SYSTEM.md) - Documentação completa do sistema cognitivo
- [Resumo da Implementação](./RESUMO_IMPLEMENTACAO_COGNITIVA.md) - Resumo da implementação
- [Exemplos](./anima/examples/cognitive_example.py) - Exemplos de uso

## 🎯 Próximos Passos

1. ✅ Integração básica concluída
2. ⏳ Integração com ChromaDB para persistência de longo prazo
3. ⏳ Interface de visualização do estado cognitivo
4. ⏳ Métricas e observabilidade avançadas
5. ⏳ Otimizações de performance

