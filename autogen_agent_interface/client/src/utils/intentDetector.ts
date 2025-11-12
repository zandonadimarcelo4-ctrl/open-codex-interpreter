/**
 * Detector de Intenção Realista
 * Diferencia quando o usuário quer conversar vs quando quer que o agente aja/faça algo
 */

export type IntentType = 'conversation' | 'action' | 'question' | 'command';

export interface IntentResult {
  type: IntentType;
  confidence: number;
  actionType?: 'code' | 'web' | 'file' | 'search' | 'execute' | 'create' | 'modify' | 'delete';
  entities?: string[];
  reason?: string;
}

/**
 * Palavras-chave e padrões que indicam ação
 */
const ACTION_KEYWORDS = {
  code: ['criar', 'escrever', 'fazer', 'implementar', 'código', 'script', 'programa', 'função', 'classe', 'arquivo', 'criar arquivo', 'escrever código'],
  web: ['buscar', 'pesquisar', 'encontrar', 'procurar', 'navegar', 'acessar', 'site', 'página', 'url'],
  file: ['ler', 'salvar', 'criar arquivo', 'deletar arquivo', 'modificar arquivo', 'editar arquivo', 'arquivo', 'pasta', 'diretório'],
  execute: ['executar', 'rodar', 'executar código', 'rodar script', 'testar', 'teste', 'correr', 'iniciar', 'começar', 'abrir', 'abre', 'abrir meu', 'abrir o', 'abrir a', 'abre meu', 'abre o', 'abre a'],
  create: ['criar', 'fazer', 'gerar', 'produzir', 'construir', 'desenvolver', 'novo'],
  modify: ['modificar', 'alterar', 'mudar', 'editar', 'atualizar', 'ajustar', 'corrigir', 'consertar'],
  delete: ['deletar', 'remover', 'excluir', 'apagar', 'eliminar'],
  search: ['buscar', 'pesquisar', 'encontrar', 'procurar', 'localizar'],
};

/**
 * Palavras-chave que indicam conversa/pergunta
 */
const CONVERSATION_KEYWORDS = [
  'o que', 'o que é', 'o que são', 'o que significa', 'o que faz',
  'como', 'como funciona', 'como fazer', 'como usar', 'como funciona',
  'quando', 'onde', 'quem', 'qual', 'quais', 'por que', 'porque',
  'explique', 'explicar', 'me diga', 'me conte', 'me fale',
  'você sabe', 'você pode', 'você consegue',
  'obrigado', 'obrigada', 'valeu', 'tchau', 'até logo', 
  'oi', 'olá', 'bom dia', 'boa tarde', 'boa noite',
  'tudo bem', 'tudo bom', 'e aí', 'eai', 'e ai', 'beleza', 'blz',
  'salve', 'opa', 'eae', 'e aê', 'fala', 'fala aí',
];

/**
 * Palavras-chave que indicam comando direto
 */
const COMMAND_KEYWORDS = [
  'faça', 'faça isso', 'execute', 'executa', 'rode', 'roda', 'crie', 'cria', 'criar',
  'delete', 'deletar', 'remova', 'remove', 'abrir', 'abre', 'abrir meu', 'abrir o', 'abrir a',
  'mostre', 'exiba', 'gere', 'produza', 'construa', 'desenvolva', 'editar', 'edita', 'editar arquivo',
  'modificar', 'modifica', 'instalar', 'instala', 'baixar', 'baixa', 'copiar', 'copia',
  'mover', 'move', 'apagar', 'apaga', 'iniciar', 'inicia', 'fazer', 'faz'
];

/**
 * Detecta a intenção do usuário baseado na mensagem (Abordagem Híbrida)
 * Usa regras rápidas primeiro, chama LLM apenas para casos complexos/ambíguos
 */
export async function detectIntent(message: string): Promise<IntentResult> {
  const lowerMessage = message.toLowerCase().trim();
  
  // PRÉ-FILTRO RÁPIDO: Padrões de alta confiança (não precisa de LLM)
  
  // Verificar se é uma saudação ou conversa casual primeiro
  const greetingKeywords = ['oi', 'olá', 'tudo bem', 'tudo bom', 'e aí', 'eai', 'e ai', 'beleza', 'blz', 'salve', 'opa', 'eae', 'e aê', 'fala', 'fala aí', 'bom dia', 'boa tarde', 'boa noite'];
  const isGreetingOnly = greetingKeywords.some(keyword => {
    const regex = new RegExp(`^${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$|^${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+[^\\w]`, 'i');
    return regex.test(message);
  });
  
  if (isGreetingOnly) {
    // Se for apenas uma saudação sem palavras de ação, é conversa
    const hasActionKeywords = Object.values(ACTION_KEYWORDS).flat().some(keyword => 
      lowerMessage.includes(keyword)
    );
    
    if (!hasActionKeywords) {
      return {
        type: 'conversation',
        confidence: 0.95,
        reason: 'Saudação detectada (regras)',
      };
    }
  }
  
  // Verificar padrões de código (alta confiança)
  if (message.includes('```') || message.includes('function') || message.includes('const ') || message.includes('import ') || message.includes('def ') || message.includes('class ')) {
    return {
      type: 'action',
      confidence: 0.9,
      actionType: 'code',
      reason: 'Código detectado na mensagem (regras)',
    };
  }
  
  // Verificar URLs (alta confiança)
  if (message.match(/https?:\/\/|www\.|\.com|\.org|\.net/)) {
    return {
      type: 'action',
      confidence: 0.9,
      actionType: 'web',
      reason: 'URL detectada na mensagem (regras)',
    };
  }
  
  // Verificar caminhos de arquivo (alta confiança)
  if (message.match(/[a-zA-Z]:\\|\.\/|\/\w+|\w+\.\w{2,4}/)) {
    return {
      type: 'action',
      confidence: 0.85,
      actionType: 'file',
      reason: 'Caminho de arquivo detectado (regras)',
    };
  }
  
  // Verificar comandos diretos (alta confiança)
  const directCommandPattern = /^(faça|execute|rode|crie|delete|executa|abrir|abre|fazer|faz|criar|cria|rodar|roda|iniciar|inicia|instalar|instala|baixar|baixa|deletar|apagar|editar|edita|modificar|modifica)\s+/i;
  if (directCommandPattern.test(message)) {
    // Determinar tipo de ação
    for (const [actionType, keywords] of Object.entries(ACTION_KEYWORDS)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return {
          type: 'action',
          confidence: 0.9,
          actionType: actionType as IntentResult['actionType'],
          reason: `Comando direto detectado: ${actionType} (regras)`,
        };
      }
    }
    
    return {
      type: 'command',
      confidence: 0.85,
      reason: 'Comando direto detectado (regras)',
    };
  }
  
  // Verificar palavras de ação (média confiança)
  let actionMatches = 0;
  let detectedActionType: IntentResult['actionType'] | undefined;
  for (const [actionType, keywords] of Object.entries(ACTION_KEYWORDS)) {
    const matches = keywords.filter(keyword => lowerMessage.includes(keyword));
    if (matches.length > 0) {
      actionMatches += matches.length;
      if (!detectedActionType) {
        detectedActionType = actionType as IntentResult['actionType'];
      }
    }
  }
  
  if (actionMatches > 0 && actionMatches <= 2) {
    // Poucas correspondências: média confiança
    return {
      type: 'action',
      confidence: 0.7 + (actionMatches * 0.05),
      actionType: detectedActionType,
      reason: `Ação detectada: ${detectedActionType} (regras)`,
    };
  }
  
  // CASOS AMBÍGUOS: Se confiança baixa ou múltiplas correspondências, usar LLM
  // Verificar se há palavras de conversa E ação (ambiguidade)
  const hasConversationKeywords = CONVERSATION_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
  const hasActionKeywords = Object.values(ACTION_KEYWORDS).flat().some(keyword => lowerMessage.includes(keyword));
  
  if (hasConversationKeywords && hasActionKeywords) {
    // Ambiguidade detectada: usar LLM
    try {
      const response = await fetch('/api/intent/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      
      if (response.ok) {
        const llmResult = await response.json();
        return {
          type: llmResult.intent === 'execution' ? 'action' : llmResult.intent,
          confidence: llmResult.confidence || 0.8,
          actionType: llmResult.action_type as IntentResult['actionType'],
          reason: llmResult.reasoning || 'Classificação por LLM',
        };
      }
    } catch (error) {
      console.warn('[IntentDetector] Erro ao chamar LLM, usando fallback:', error);
    }
  }
  
  // Verificar se é uma pergunta direta (sem ação)
  if (hasConversationKeywords && !hasActionKeywords) {
    return {
      type: 'question',
      confidence: 0.8,
      reason: 'Pergunta direta detectada (regras)',
    };
  }
  
  // Se não detectar nada específico, tratar como conversa (seguro)
  return {
    type: 'conversation',
    confidence: 0.6,
    reason: 'Nenhuma ação específica detectada, tratando como conversa (regras)',
  };
}

/**
 * Versão síncrona (fallback para compatibilidade)
 * Usa apenas regras, sem LLM
 */
export function detectIntentSync(message: string): IntentResult {
  const lowerMessage = message.toLowerCase().trim();
  
  // Mesma lógica do pré-filtro rápido acima
  const greetingKeywords = ['oi', 'olá', 'tudo bem', 'tudo bom', 'e aí', 'eai', 'e ai', 'beleza', 'blz', 'salve', 'opa', 'eae', 'e aê', 'fala', 'fala aí', 'bom dia', 'boa tarde', 'boa noite'];
  if (greetingKeywords.some(keyword => lowerMessage.includes(keyword))) {
    const hasActionKeywords = Object.values(ACTION_KEYWORDS).flat().some(keyword => 
      lowerMessage.includes(keyword)
    );
    
    if (!hasActionKeywords) {
      return {
        type: 'conversation',
        confidence: 0.95,
        reason: 'Saudação detectada',
      };
    }
  }
  
  if (message.includes('```') || message.includes('function') || message.includes('const ') || message.includes('import ')) {
    return {
      type: 'action',
      confidence: 0.8,
      actionType: 'code',
      reason: 'Código detectado na mensagem',
    };
  }
  
  if (lowerMessage.match(/https?:\/\/|www\.|\.com|\.org|\.net/)) {
    return {
      type: 'action',
      confidence: 0.75,
      actionType: 'web',
      reason: 'URL detectada na mensagem',
    };
  }
  
  if (lowerMessage.match(/[a-zA-Z]:\\|\.\/|\/\w+|\w+\.\w{2,4}/)) {
    return {
      type: 'action',
      confidence: 0.7,
      actionType: 'file',
      reason: 'Caminho de arquivo detectado',
    };
  }
  
  if (COMMAND_KEYWORDS.some(keyword => lowerMessage.startsWith(keyword) || lowerMessage.includes(` ${keyword} `))) {
    for (const [actionType, keywords] of Object.entries(ACTION_KEYWORDS)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return {
          type: 'action',
          confidence: 0.9,
          actionType: actionType as IntentResult['actionType'],
          reason: `Comando direto detectado: ${actionType}`,
        };
      }
    }
    
    return {
      type: 'command',
      confidence: 0.85,
      reason: 'Comando direto detectado',
    };
  }
  
  for (const [actionType, keywords] of Object.entries(ACTION_KEYWORDS)) {
    const matches = keywords.filter(keyword => lowerMessage.includes(keyword));
    if (matches.length > 0) {
      return {
        type: 'action',
        confidence: 0.7 + (matches.length * 0.1),
        actionType: actionType as IntentResult['actionType'],
        entities: matches,
        reason: `Ação detectada: ${actionType}`,
      };
    }
  }
  
  return {
    type: 'conversation',
    confidence: 0.6,
    reason: 'Nenhuma ação específica detectada, tratando como conversa',
  };
}

/**
 * Extrai entidades da mensagem (arquivos, URLs, comandos, etc)
 */
export function extractEntities(message: string): string[] {
  const entities: string[] = [];
  
  // URLs
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urls = message.match(urlRegex);
  if (urls) entities.push(...urls);
  
  // Caminhos de arquivo
  const filePathRegex = /[a-zA-Z]:\\[^\s]+|\.\/[^\s]+|\/[^\s]+|\w+\.\w{2,4}/g;
  const filePaths = message.match(filePathRegex);
  if (filePaths) entities.push(...filePaths);
  
  // Comandos entre aspas
  const quotedRegex = /"([^"]+)"/g;
  const quoted = message.match(quotedRegex);
  if (quoted) entities.push(...quoted.map(q => q.replace(/"/g, '')));
  
  return entities;
}

