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
  'obrigado', 'obrigada', 'valeu', 'tchau', 'até logo', 'oi', 'olá', 'olá', 'bom dia', 'boa tarde', 'boa noite',
];

/**
 * Palavras-chave que indicam comando direto
 */
const COMMAND_KEYWORDS = [
  'faça', 'faça isso', 'execute', 'rode', 'crie', 'delete', 'remova',
  'mostre', 'exiba', 'gere', 'produza', 'construa', 'desenvolva',
];

/**
 * Detecta a intenção do usuário baseado na mensagem
 */
export function detectIntent(message: string): IntentResult {
  const lowerMessage = message.toLowerCase().trim();
  
  // Verificar se é uma pergunta direta
  if (CONVERSATION_KEYWORDS.some(keyword => lowerMessage.includes(keyword))) {
    // Mas verificar se também tem palavras de ação
    const hasActionKeywords = Object.values(ACTION_KEYWORDS).flat().some(keyword => 
      lowerMessage.includes(keyword)
    );
    
    if (!hasActionKeywords) {
      return {
        type: 'question',
        confidence: 0.8,
        reason: 'Pergunta direta detectada',
      };
    }
  }
  
  // Verificar comandos diretos
  if (COMMAND_KEYWORDS.some(keyword => lowerMessage.startsWith(keyword) || lowerMessage.includes(` ${keyword} `))) {
    // Determinar tipo de ação
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
  
  // Verificar palavras de ação
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
  
  // Verificar padrões de código
  if (lowerMessage.includes('```') || lowerMessage.includes('function') || lowerMessage.includes('const ') || lowerMessage.includes('import ')) {
    return {
      type: 'action',
      confidence: 0.8,
      actionType: 'code',
      reason: 'Código detectado na mensagem',
    };
  }
  
  // Verificar URLs
  if (lowerMessage.match(/https?:\/\/|www\.|\.com|\.org|\.net/)) {
    return {
      type: 'action',
      confidence: 0.75,
      actionType: 'web',
      reason: 'URL detectada na mensagem',
    };
  }
  
  // Verificar caminhos de arquivo
  if (lowerMessage.match(/[a-zA-Z]:\\|\.\/|\/\w+|\w+\.\w{2,4}/)) {
    return {
      type: 'action',
      confidence: 0.7,
      actionType: 'file',
      reason: 'Caminho de arquivo detectado',
    };
  }
  
  // Se não detectar nada específico, é conversa
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

