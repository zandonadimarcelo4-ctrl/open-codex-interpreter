/**
 * Sistema de Roteamento de Agentes inspirado no AgenticSeek
 * Integrado ao AutoGen Framework (único framework)
 * 
 * Este módulo melhora a detecção de intenção e roteamento de tarefas
 * para o AutoGen, mantendo apenas um framework.
 */

import { detectIntentLocal } from "../routers";

export interface AgentType {
  name: string;
  description: string;
  keywords: string[];
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export const AGENT_TYPES: Record<string, AgentType> = {
  browser: {
    name: 'Browser Agent',
    description: 'Navegação web autônoma, busca, extração de informações',
    keywords: ['buscar', 'pesquisar', 'web', 'internet', 'navegar', 'site', 'url', 'link', 'artigo', 'notícia'],
    complexity: 'LOW'
  },
  code: {
    name: 'Code Agent',
    description: 'Escrita, depuração e execução de código',
    keywords: ['código', 'programa', 'script', 'python', 'javascript', 'java', 'go', 'c++', 'debug', 'executar código'],
    complexity: 'LOW'
  },
  file: {
    name: 'File Agent',
    description: 'Operações com arquivos e diretórios',
    keywords: ['arquivo', 'file', 'pasta', 'folder', 'diretório', 'criar arquivo', 'encontrar arquivo', 'deletar arquivo'],
    complexity: 'LOW'
  },
  planner: {
    name: 'Planner Agent',
    description: 'Planejamento de tarefas complexas em múltiplas etapas',
    keywords: ['planejar', 'plano', 'tarefa complexa', 'múltiplas etapas', 'projeto', 'organizar'],
    complexity: 'HIGH'
  },
  casual: {
    name: 'Casual Agent',
    description: 'Conversas casuais e perguntas gerais',
    keywords: ['oi', 'olá', 'tudo bem', 'como vai', 'o que é', 'explique', 'me diga'],
    complexity: 'LOW'
  }
};

/**
 * Detecta o tipo de agente mais apropriado para a tarefa
 * Baseado no sistema de roteamento do AgenticSeek
 */
export function selectAgent(message: string, intent: ReturnType<typeof detectIntentLocal>): {
  agentType: string;
  confidence: number;
  reason: string;
} {
  const lowerMessage = message.toLowerCase();
  
  // Se já temos uma intenção detectada, usar isso como base
  if (intent.type === 'action' || intent.type === 'command') {
    // Determinar tipo de agente baseado na ação
    if (intent.actionType === 'web' || lowerMessage.includes('web') || lowerMessage.includes('buscar') || lowerMessage.includes('pesquisar')) {
      return {
        agentType: 'browser',
        confidence: 0.9,
        reason: 'Ação de navegação web detectada'
      };
    }
    
    if (intent.actionType === 'code' || lowerMessage.includes('código') || lowerMessage.includes('programa') || lowerMessage.includes('script')) {
      return {
        agentType: 'code',
        confidence: 0.9,
        reason: 'Ação de código detectada'
      };
    }
    
    if (intent.actionType === 'file' || lowerMessage.includes('arquivo') || lowerMessage.includes('file') || lowerMessage.includes('pasta')) {
      return {
        agentType: 'file',
        confidence: 0.9,
        reason: 'Ação de arquivo detectada'
      };
    }
    
    // Verificar complexidade para planejamento
    if (lowerMessage.includes('planejar') || lowerMessage.includes('múltiplas') || lowerMessage.includes('etapas') || lowerMessage.includes('projeto')) {
      return {
        agentType: 'planner',
        confidence: 0.85,
        reason: 'Tarefa complexa detectada - requer planejamento'
      };
    }
    
    // Padrão: Code Agent para ações genéricas
    return {
      agentType: 'code',
      confidence: 0.75,
      reason: 'Ação genérica - usando Code Agent'
    };
  }
  
  // Para perguntas/conversas
  if (intent.type === 'question' || intent.type === 'conversation') {
    // Verificar se é uma pergunta sobre web
    if (lowerMessage.includes('web') || lowerMessage.includes('site') || lowerMessage.includes('internet')) {
      return {
        agentType: 'browser',
        confidence: 0.8,
        reason: 'Pergunta sobre web - usando Browser Agent'
      };
    }
    
    // Padrão: Casual Agent
    return {
      agentType: 'casual',
      confidence: 0.7,
      reason: 'Conversa casual detectada'
    };
  }
  
  // Análise por palavras-chave (fallback)
  const keywordMatches: Record<string, number> = {};
  
  for (const [agentType, config] of Object.entries(AGENT_TYPES)) {
    const matches = config.keywords.filter(keyword => lowerMessage.includes(keyword));
    keywordMatches[agentType] = matches.length;
  }
  
  // Encontrar o agente com mais correspondências
  const bestMatch = Object.entries(keywordMatches)
    .sort(([, a], [, b]) => b - a)[0];
  
  if (bestMatch && bestMatch[1] > 0) {
    return {
      agentType: bestMatch[0],
      confidence: Math.min(0.7 + (bestMatch[1] * 0.1), 0.95),
      reason: `${bestMatch[1]} palavras-chave correspondentes`
    };
  }
  
  // Padrão: Casual Agent
  return {
    agentType: 'casual',
    confidence: 0.6,
    reason: 'Nenhuma correspondência específica - usando Casual Agent'
  };
}

/**
 * Estima a complexidade da tarefa
 * Baseado no sistema de few-shot learning do AgenticSeek
 */
export function estimateComplexity(message: string): 'LOW' | 'MEDIUM' | 'HIGH' {
  const lowerMessage = message.toLowerCase();
  
  // Tarefas simples (LOW)
  const lowComplexityKeywords = [
    'oi', 'olá', 'tudo bem', 'como vai',
    'encontrar arquivo', 'buscar arquivo',
    'escrever código simples', 'script simples',
    'buscar web', 'pesquisar web'
  ];
  
  // Tarefas complexas (HIGH)
  const highComplexityKeywords = [
    'planejar', 'múltiplas etapas', 'projeto complexo',
    'integrar', 'sistema completo', 'arquitetura',
    'múltiplos arquivos', 'vários componentes'
  ];
  
  if (highComplexityKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'HIGH';
  }
  
  if (lowComplexityKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'LOW';
  }
  
  // Verificar se menciona múltiplas ações
  const actionCount = (lowerMessage.match(/\be\b|\be\s+depois\b|\be\s+então\b/g) || []).length;
  if (actionCount >= 2) {
    return 'HIGH';
  }
  
  return 'MEDIUM';
}

/**
 * Gera prompt específico para o agente selecionado
 * Integrado ao AutoGen Framework
 */
export function generateAgentPrompt(agentType: string, message: string, intent: ReturnType<typeof detectIntentLocal>): string {
  const agent = AGENT_TYPES[agentType];
  if (!agent) {
    return message;
  }
  
  const basePrompt = `Você é um ${agent.name} especializado em ${agent.description}.

Tarefa do usuário: ${message}
Intenção detectada: ${intent.type} (${intent.actionType || 'N/A'})
Confiança: ${(intent.confidence * 100).toFixed(0)}%

INSTRUÇÕES:
- Execute a tarefa automaticamente usando o AutoGen Framework
- Use as ferramentas disponíveis (run_code, navegação web, etc.)
- Seja direto e eficiente
- Mostre o resultado da execução

`;
  
  // Adicionar instruções específicas por tipo de agente
  switch (agentType) {
    case 'browser':
      return basePrompt + `AÇÕES ESPECÍFICAS:
- Navegue na web usando as ferramentas de navegação
- Busque informações relevantes
- Extraia e resuma o conteúdo encontrado
- Se necessário, preencha formulários ou interaja com páginas web`;
    
    case 'code':
      return basePrompt + `AÇÕES ESPECÍFICAS:
- Escreva o código necessário
- Execute o código automaticamente usando run_code
- Mostre os resultados da execução
- Corrija erros se necessário`;
    
    case 'file':
      return basePrompt + `AÇÕES ESPECÍFICAS:
- Crie, leia, modifique ou delete arquivos conforme solicitado
- Use caminhos absolutos quando necessário
- Verifique se os arquivos existem antes de operar neles`;
    
    case 'planner':
      return basePrompt + `AÇÕES ESPECÍFICAS:
- Divida a tarefa em etapas menores
- Planeje a execução sequencial
- Execute cada etapa usando os agentes apropriados
- Monitore o progresso e ajuste o plano se necessário`;
    
    default:
      return basePrompt;
  }
}

