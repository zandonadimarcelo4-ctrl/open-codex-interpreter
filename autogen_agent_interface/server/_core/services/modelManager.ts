/**
 * Model Manager
 * Manages LLM model selection, configuration, and fallback logic
 * Integrado com Ollama e DeepSeek models
 */

import axios from 'axios';
import { checkOllamaAvailable, checkModelAvailable } from '../../utils/ollama';

export interface ModelConfig {
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'huggingface' | 'ollama';
  type: 'chat' | 'completion' | 'embedding';
  local?: boolean;
  apiKey?: string;
  baseUrl?: string;
  vramRequired?: number; // in GB
  qualityScore?: number; // 0-100
  speedScore?: number; // 0-100
}

export interface AvailableModels {
  online: ModelConfig[];
  offline: ModelConfig[];
  current: ModelConfig;
}

// DeepSeek models optimized for RTX 4080 Super (16GB VRAM)
const DEEPSEEK_MODELS: Record<string, ModelConfig> = {
  'deepseek-v3': {
    name: 'deepseek-v3',
    provider: 'ollama',
    type: 'chat',
    local: true,
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    vramRequired: 14,
    qualityScore: 95,
    speedScore: 85,
  },
  'deepseek-r1': {
    name: 'deepseek-r1',
    provider: 'ollama',
    type: 'chat',
    local: true,
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    vramRequired: 12,
    qualityScore: 92,
    speedScore: 75,
  },
  'deepseek-coder': {
    name: 'deepseek-coder',
    provider: 'ollama',
    type: 'chat',
    local: true,
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    vramRequired: 10,
    qualityScore: 88,
    speedScore: 90,
  },
  'deepseek-7b': {
    name: 'deepseek-7b',
    provider: 'ollama',
    type: 'chat',
    local: true,
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    vramRequired: 4,
    qualityScore: 70,
    speedScore: 95,
  },
  'deepseek-3b': {
    name: 'deepseek-3b',
    provider: 'ollama',
    type: 'chat',
    local: true,
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    vramRequired: 2,
    qualityScore: 60,
    speedScore: 98,
  },
  'gpt-oss:20b-q4': {
    name: 'gpt-oss:20b-q4',
    provider: 'ollama',
    type: 'chat',
    local: true,
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    vramRequired: 8, // Q4 quantizado, requer muito menos VRAM (~8GB vs ~40GB não quantizado)
    qualityScore: 88, // Q4 mantém boa qualidade
    speedScore: 85, // Q4 é mais rápido que não quantizado
  },
  'deepseek-coder-v2-16b-q4_k_m': {
    name: 'deepseek-coder-v2-16b-q4_k_m',
    provider: 'ollama',
    type: 'code',
    local: true,
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    vramRequired: 10, // Q4_K_M quantizado, requer ~10GB VRAM
    qualityScore: 92, // Alta qualidade para geração de código
    speedScore: 85, // Boa velocidade com quantização Q4_K_M
  },
};

class ModelManager {
  private models: Map<string, ModelConfig> = new Map();
  private currentModel: ModelConfig | null = null;
  private ollamaUrl: string;
  private ollamaAvailable: boolean = false;

  constructor() {
    this.ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.initializeModels();
  }

  /**
   * Initialize available models
   */
  private initializeModels(): void {
    // Add DeepSeek models
    Object.values(DEEPSEEK_MODELS).forEach(model => {
      this.models.set(model.name, model);
    });

    // OpenAI Models
    if (process.env.OPENAI_API_KEY) {
      this.models.set('gpt-4', {
        name: 'gpt-4',
        provider: 'openai',
        type: 'chat',
        apiKey: process.env.OPENAI_API_KEY,
        qualityScore: 95,
        speedScore: 80,
      });
      this.models.set('gpt-3.5-turbo', {
        name: 'gpt-3.5-turbo',
        provider: 'openai',
        type: 'chat',
        apiKey: process.env.OPENAI_API_KEY,
        qualityScore: 85,
        speedScore: 90,
      });
    }

    // Anthropic Models
    if (process.env.ANTHROPIC_API_KEY) {
      this.models.set('claude-3-opus', {
        name: 'claude-3-opus',
        provider: 'anthropic',
        type: 'chat',
        apiKey: process.env.ANTHROPIC_API_KEY,
        qualityScore: 98,
        speedScore: 70,
      });
      this.models.set('claude-3-sonnet', {
        name: 'claude-3-sonnet',
        provider: 'anthropic',
        type: 'chat',
        apiKey: process.env.ANTHROPIC_API_KEY,
        qualityScore: 92,
        speedScore: 85,
      });
    }

    // Google Models
    if (process.env.GOOGLE_API_KEY) {
      this.models.set('gemini-pro', {
        name: 'gemini-pro',
        provider: 'google',
        type: 'chat',
        apiKey: process.env.GOOGLE_API_KEY,
        qualityScore: 90,
        speedScore: 85,
      });
    }

    // Set default model (prefer DeepSeek R1)
    const defaultModel = process.env.DEFAULT_MODEL || 'deepseek-r1';
    if (this.models.has(defaultModel)) {
      this.currentModel = this.models.get(defaultModel)!;
    } else {
      // Fallback to first available model
      const firstModel = Array.from(this.models.values())[0];
      if (firstModel) {
        this.currentModel = firstModel;
      }
    }
  }

  /**
   * Check if Ollama is available
   */
  async checkOllamaAvailability(): Promise<boolean> {
    try {
      const available = await checkOllamaAvailable();
      this.ollamaAvailable = available;
      return available;
    } catch (error) {
      this.ollamaAvailable = false;
      return false;
    }
  }

  /**
   * Get available Ollama models
   */
  async getOllamaModels(): Promise<ModelConfig[]> {
    if (!this.ollamaAvailable) {
      await this.checkOllamaAvailability();
    }

    if (!this.ollamaAvailable) {
      return [];
    }

    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`, {
        timeout: 5000,
      });

      const models: ModelConfig[] = [];
      if (response.data.models) {
        for (const model of response.data.models) {
          // Check if it's a DeepSeek model
          const deepseekModel = Object.values(DEEPSEEK_MODELS).find(
            m => model.name.includes(m.name) || model.name === m.name
          );

          if (deepseekModel) {
            models.push(deepseekModel);
          } else {
            models.push({
              name: model.name,
              provider: 'ollama',
              type: 'chat',
              local: true,
              baseUrl: this.ollamaUrl,
            });
          }
        }
      }

      return models;
    } catch (error) {
      console.error('Failed to get Ollama models:', error);
      return [];
    }
  }

  /**
   * Get all available models
   */
  async getAllModels(): Promise<AvailableModels> {
    const online = Array.from(this.models.values()).filter(m => !m.local);
    const offline = await this.getOllamaModels();

    return {
      online,
      offline,
      current: this.currentModel || online[0] || offline[0],
    };
  }

  /**
   * Set current model
   */
  setCurrentModel(modelName: string): boolean {
    if (this.models.has(modelName)) {
      this.currentModel = this.models.get(modelName)!;
      return true;
    }
    return false;
  }

  /**
   * Get current model
   */
  getCurrentModel(): ModelConfig | null {
    return this.currentModel;
  }

  /**
   * Get model by name
   */
  getModel(modelName: string): ModelConfig | undefined {
    return this.models.get(modelName);
  }

  /**
   * Check if model is available
   */
  async isModelAvailable(modelName: string): Promise<boolean> {
    // Check if it's a DeepSeek model
    if (modelName.includes('deepseek')) {
      return await checkModelAvailable(modelName);
    }

    // Check if it's in our models map
    return this.models.has(modelName);
  }

  /**
   * Get fallback model chain for DeepSeek
   */
  async getDeepSeekFallbackChain(): Promise<ModelConfig[]> {
    const chain: ModelConfig[] = [];
    // Ordem de fallback: DeepSeek primeiro, depois GPT-OSS Q4 quantizado como fallback final
    const order = ['deepseek-v3', 'deepseek-r1', 'deepseek-coder', 'deepseek-7b', 'deepseek-3b', 'gpt-oss:20b-q4'];

    for (const modelName of order) {
      const model = this.models.get(modelName);
      if (model) {
        const available = await this.isModelAvailable(modelName);
        if (available) {
          chain.push(model);
        }
      }
    }

    return chain;
  }

  /**
   * Get best model for task based on VRAM and quality
   */
  async getBestModelForTask(
    taskType: string,
    availableVRAM: number = 16,
    strategy: 'quality' | 'speed' | 'balanced' = 'balanced'
  ): Promise<ModelConfig | null> {
    const fallbackChain = await this.getDeepSeekFallbackChain();

    for (const model of fallbackChain) {
      if (model.vramRequired && model.vramRequired <= availableVRAM) {
        if (strategy === 'quality' && model.qualityScore && model.qualityScore >= 90) {
          return model;
        }
        if (strategy === 'speed' && model.speedScore && model.speedScore >= 90) {
          return model;
        }
        if (strategy === 'balanced') {
          return model;
        }
      }
    }

    // Fallback to first available model
    return fallbackChain[0] || null;
  }

  /**
   * Get status
   */
  async getStatus(): Promise<{
    currentModel: ModelConfig | null;
    ollamaAvailable: boolean;
    onlineModelsCount: number;
    offlineModelsCount: number;
    deepseekModelsAvailable: number;
  }> {
    const offlineModels = await this.getOllamaModels();
    const deepseekModels = await this.getDeepSeekFallbackChain();

    return {
      currentModel: this.currentModel,
      ollamaAvailable: this.ollamaAvailable,
      onlineModelsCount: Array.from(this.models.values()).filter(m => !m.local).length,
      offlineModelsCount: offlineModels.length,
      deepseekModelsAvailable: deepseekModels.length,
    };
  }
}

// Export singleton instance
export const modelManager = new ModelManager();

export default ModelManager;

