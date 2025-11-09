/**
 * Agent Modes Configuration
 * 3 innovative agent modes with automatic model fallback
 * Integrado com Model Manager e DeepSeek models
 */

export type AgentMode = 'creative' | 'analytical' | 'executor';

export interface AgentModeConfig {
  name: string;
  description: string;
  mode: AgentMode;
  primaryModel: string;
  fallbackModels: string[];
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  tools: string[];
  capabilities: string[];
  optimizedFor: string[];
}

export interface ModelFallbackStrategy {
  modelName: string;
  vramRequired: number; // in GB
  speedScore: number; // 0-100
  qualityScore: number; // 0-100
  costScore: number; // 0-100 (lower = cheaper)
  supportedTasks: string[];
}

// Model configurations optimized for RTX 4080 Super (16GB VRAM)
export const DEEPSEEK_MODELS: Record<string, ModelFallbackStrategy> = {
  'deepseek-v3': {
    modelName: 'deepseek-v3',
    vramRequired: 14,
    speedScore: 85,
    qualityScore: 95,
    costScore: 80,
    supportedTasks: ['code', 'analysis', 'design', 'video', 'research', 'general'],
  },
  'deepseek-r1': {
    modelName: 'deepseek-r1',
    vramRequired: 12,
    speedScore: 75,
    qualityScore: 92,
    costScore: 70,
    supportedTasks: ['analysis', 'research', 'reasoning', 'code'],
  },
  'deepseek-coder': {
    modelName: 'deepseek-coder',
    vramRequired: 10,
    speedScore: 90,
    qualityScore: 88,
    costScore: 60,
    supportedTasks: ['code', 'programming', 'debugging'],
  },
  'deepseek-7b': {
    modelName: 'deepseek-7b',
    vramRequired: 4,
    speedScore: 95,
    qualityScore: 70,
    costScore: 40,
    supportedTasks: ['general', 'chat', 'simple-tasks'],
  },
  'deepseek-3b': {
    modelName: 'deepseek-3b',
    vramRequired: 2,
    speedScore: 98,
    qualityScore: 60,
    costScore: 20,
    supportedTasks: ['chat', 'simple-tasks'],
  },
};

// 3 Innovative Agent Modes
export const AGENT_MODES: Record<AgentMode, AgentModeConfig> = {
  creative: {
    name: '🎨 Creative Mode',
    description: 'Specialized in creative tasks: video editing, design, content creation',
    mode: 'creative',
    primaryModel: 'deepseek-v3',
    fallbackModels: ['deepseek-r1', 'deepseek-coder', 'deepseek-7b'],
    systemPrompt: `You are a creative AI agent specialized in generating innovative content, designs, and multimedia solutions. 
Your strengths are:
- Video editing and effects (After Effects MCP)
- Graphic design and visual content
- Content creation and copywriting
- Creative problem-solving
- Artistic direction and aesthetics

Always prioritize creativity, innovation, and visual appeal. Think outside the box and suggest unique solutions.`,
    temperature: 0.8,
    maxTokens: 4096,
    tools: [
      'after-effects-mcp',
      'image-generation',
      'text-generation',
      'design-tools',
      'color-analysis',
    ],
    capabilities: [
      'video-editing',
      'image-generation',
      'design',
      'content-creation',
      'animation',
      'effects',
    ],
    optimizedFor: ['RTX 4080 Super', 'Creative workflows', 'Batch processing'],
  },

  analytical: {
    name: '🔬 Analytical Mode',
    description: 'Specialized in data analysis, research, and complex problem-solving',
    mode: 'analytical',
    primaryModel: 'deepseek-r1',
    fallbackModels: ['deepseek-v3', 'deepseek-coder', 'deepseek-7b'],
    systemPrompt: `You are an analytical AI agent specialized in data analysis, research, and complex problem-solving.
Your strengths are:
- Data analysis and visualization
- Research and information synthesis
- Complex reasoning and logic
- Document analysis (OCR)
- Statistical analysis and insights
- Pattern recognition

Always provide detailed analysis, cite sources, and explain your reasoning clearly.`,
    temperature: 0.3,
    maxTokens: 8192,
    tools: [
      'ocr-service',
      'data-analysis',
      'research-tools',
      'visualization',
      'terminal-executor',
    ],
    capabilities: [
      'data-analysis',
      'research',
      'document-analysis',
      'reasoning',
      'visualization',
      'reporting',
    ],
    optimizedFor: ['RTX 4080 Super', 'Long-form analysis', 'Complex reasoning'],
  },

  executor: {
    name: '⚡ Executor Mode',
    description: 'Specialized in code execution, automation, and task completion',
    mode: 'executor',
    primaryModel: 'deepseek-coder',
    fallbackModels: ['deepseek-v3', 'deepseek-r1', 'deepseek-7b'],
    systemPrompt: `You are an executor AI agent specialized in code generation, automation, and task completion.
Your strengths are:
- Code generation and debugging
- Task automation
- System commands and scripting
- Terminal execution
- Performance optimization
- Error handling and recovery

Always write clean, efficient, and well-documented code. Test your solutions and provide clear instructions.`,
    temperature: 0.2,
    maxTokens: 6144,
    tools: [
      'terminal-executor',
      'code-generation',
      'debugging',
      'automation',
      'performance-optimization',
    ],
    capabilities: [
      'code-generation',
      'code-execution',
      'debugging',
      'automation',
      'scripting',
      'optimization',
    ],
    optimizedFor: ['RTX 4080 Super', 'Code execution', 'Real-time processing'],
  },
};

/**
 * Get best model for task based on VRAM and performance
 */
export function getBestModelForTask(
  taskType: string,
  availableVram: number = 16,
  prioritize: 'quality' | 'speed' | 'balance' = 'balance'
): string {
  const availableModels = Object.values(DEEPSEEK_MODELS).filter(
    m => m.vramRequired <= availableVram && m.supportedTasks.includes(taskType)
  );

  if (availableModels.length === 0) {
    return 'deepseek-7b'; // Fallback to smallest model
  }

  // Sort by priority
  availableModels.sort((a, b) => {
    if (prioritize === 'quality') {
      return b.qualityScore - a.qualityScore;
    } else if (prioritize === 'speed') {
      return b.speedScore - a.speedScore;
    } else {
      // Balance: quality + speed - cost
      const scoreA = a.qualityScore + a.speedScore - a.costScore / 2;
      const scoreB = b.qualityScore + b.speedScore - b.costScore / 2;
      return scoreB - scoreA;
    }
  });

  return availableModels[0].modelName;
}

/**
 * Get fallback chain for model
 */
export function getModelFallbackChain(
  primaryModel: string,
  availableVram: number = 16
): string[] {
  const chain = [primaryModel];
  const allModels = Object.values(DEEPSEEK_MODELS);

  // Sort by quality score descending
  const sortedByQuality = allModels
    .filter(m => m.vramRequired <= availableVram && m.modelName !== primaryModel)
    .sort((a, b) => b.qualityScore - a.qualityScore);

  chain.push(...sortedByQuality.map(m => m.modelName));
  return chain;
}

/**
 * Get model info
 */
export function getModelInfo(modelName: string): ModelFallbackStrategy | null {
  return DEEPSEEK_MODELS[modelName] || null;
}

/**
 * Check if model fits in available VRAM
 */
export function canRunModel(modelName: string, availableVram: number): boolean {
  const model = DEEPSEEK_MODELS[modelName];
  return model ? model.vramRequired <= availableVram : false;
}

/**
 * Get recommended models for VRAM
 */
export function getRecommendedModelsForVram(vram: number): string[] {
  return Object.values(DEEPSEEK_MODELS)
    .filter(m => m.vramRequired <= vram)
    .sort((a, b) => b.qualityScore - a.qualityScore)
    .map(m => m.modelName);
}

/**
 * Get agent mode config
 */
export function getAgentModeConfig(mode: AgentMode): AgentModeConfig {
  return AGENT_MODES[mode];
}

/**
 * Get all agent modes
 */
export function getAllAgentModes(): AgentModeConfig[] {
  return Object.values(AGENT_MODES);
}

