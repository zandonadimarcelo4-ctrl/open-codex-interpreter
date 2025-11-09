/**
 * Model Loader
 * Carrega modelos automaticamente na VRAM para acesso rápido
 * Otimizado para RTX 4080 Super (16GB VRAM)
 */

import { EventEmitter } from 'events';
import { resourceManager } from './resourceManager';
import { gpuOptimizer } from './gpuOptimizer';
import { modelManager } from './modelManager';
import { checkOllamaAvailable, checkModelAvailable, callOllamaChat } from '../../utils/ollama';
import { DEEPSEEK_MODELS } from './agentModes';

export interface LoadedModel {
  modelName: string;
  loadedAt: Date;
  lastUsed: Date;
  useCount: number;
  vramUsed: number;
  isActive: boolean;
  optimization: any;
  loadTime: number; // ms
}

export interface ModelLoadRequest {
  modelName: string;
  priority: 'low' | 'normal' | 'high';
  preload?: boolean; // Carregar antes de usar
}

class ModelLoader extends EventEmitter {
  private loadedModels: Map<string, LoadedModel> = new Map();
  private loadingQueue: ModelLoadRequest[] = [];
  private isPreloading: boolean = false;
  private preloadInterval: ReturnType<typeof setInterval> | null = null;
  private maxConcurrentLoads: number = 1; // Carregar um modelo por vez
  private activeLoads: Set<string> = new Set();

  constructor() {
    super();
    this.startPreloadScheduler();
  }

  /**
   * Start preload scheduler
   */
  private startPreloadScheduler(): void {
    // Verificar a cada 5 minutos se há modelos para pré-carregar
    this.preloadInterval = setInterval(() => {
      this.checkPreloadCandidates();
    }, 300000) as ReturnType<typeof setInterval>;
  }

  /**
   * Check preload candidates
   */
  private async checkPreloadCandidates(): Promise<void> {
    if (this.isPreloading || this.activeLoads.size > 0) {
      return;
    }

    // Verificar se há modelos frequentemente usados que não estão carregados
    const frequentlyUsed = Array.from(this.loadedModels.values())
      .filter(m => !m.isActive && m.useCount > 5)
      .sort((a, b) => b.useCount - a.useCount);

    for (const model of frequentlyUsed.slice(0, 1)) {
      // Pré-carregar apenas se houver VRAM disponível
      const vramAvailable = resourceManager.getResourceUsage().vramAvailable;
      if (vramAvailable >= model.vramUsed) {
        await this.loadModel(model.modelName, 'low', true);
      }
    }
  }

  /**
   * Load model into VRAM
   */
  async loadModel(
    modelName: string,
    priority: 'low' | 'normal' | 'high' = 'normal',
    preload: boolean = false
  ): Promise<LoadedModel> {
    // Verificar se já está carregado
    const existing = this.loadedModels.get(modelName);
    if (existing && existing.isActive) {
      existing.lastUsed = new Date();
      existing.useCount++;
      this.emit('model-accessed', modelName);
      return existing;
    }

    // Verificar se está sendo carregado
    if (this.activeLoads.has(modelName)) {
      // Aguardar carregamento
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          const loaded = this.loadedModels.get(modelName);
          if (loaded && loaded.isActive) {
            clearInterval(checkInterval);
            resolve(loaded);
          }
        }, 1000);

        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error(`Timeout waiting for model ${modelName} to load`));
        }, 60000); // 60 segundos timeout
      });
    }

    // Obter informações do modelo
    const modelInfo = DEEPSEEK_MODELS[modelName];
    if (!modelInfo) {
      throw new Error(`Model ${modelName} not found`);
    }

    const vramRequired = modelInfo.vramRequired;
    const vramAvailable = resourceManager.getResourceUsage().vramAvailable;

    // Verificar se há VRAM suficiente
    if (vramAvailable < vramRequired) {
      // Tentar liberar VRAM descarregando modelos não usados
      await this.freeVRAM(vramRequired);
    }

    // Verificar novamente após liberar VRAM
    const newVramAvailable = resourceManager.getResourceUsage().vramAvailable;
    if (newVramAvailable < vramRequired) {
      throw new Error(`Insufficient VRAM: need ${vramRequired}GB, have ${newVramAvailable}GB`);
    }

    // Adicionar à fila de carregamento
    const request: ModelLoadRequest = {
      modelName,
      priority,
      preload,
    };

    if (priority === 'high') {
      this.loadingQueue.unshift(request); // Alta prioridade no início
    } else {
      this.loadingQueue.push(request);
    }

    // Processar fila
    return this.processLoadQueue();
  }

  /**
   * Process load queue
   */
  private async processLoadQueue(): Promise<LoadedModel> {
    if (this.activeLoads.size >= this.maxConcurrentLoads || this.loadingQueue.length === 0) {
      return Promise.reject(new Error('Load queue is empty or busy'));
    }

    const request = this.loadingQueue.shift();
    if (!request) {
      return Promise.reject(new Error('No request in queue'));
    }

    this.activeLoads.add(request.modelName);
    const startTime = Date.now();

    try {
      console.log(`🔄 Carregando modelo ${request.modelName} na VRAM...`);

      // Obter otimização para o modelo
      const vramAvailable = resourceManager.getResourceUsage().vramAvailable;
      const optimization = gpuOptimizer.getOptimizationForModel(
        request.modelName,
        vramAvailable
      );

      // Carregar modelo via Ollama
      await this.loadModelInOllama(request.modelName);

      // Registrar uso de recursos
      resourceManager.registerModelUsage(request.modelName, optimization.vramSaved || 0);

      const loadTime = Date.now() - startTime;
      const modelInfo = DEEPSEEK_MODELS[request.modelName];

      const loadedModel: LoadedModel = {
        modelName: request.modelName,
        loadedAt: new Date(),
        lastUsed: new Date(),
        useCount: 1,
        vramUsed: modelInfo.vramRequired,
        isActive: true,
        optimization,
        loadTime,
      };

      this.loadedModels.set(request.modelName, loadedModel);

      console.log(`✅ Modelo ${request.modelName} carregado na VRAM (${loadTime}ms)`);
      this.emit('model-loaded', loadedModel);

      return loadedModel;
    } catch (error: any) {
      console.error(`❌ Erro ao carregar modelo ${request.modelName}:`, error);
      this.emit('model-load-error', { modelName: request.modelName, error });
      throw error;
    } finally {
      this.activeLoads.delete(request.modelName);
      
      // Processar próximo da fila
      if (this.loadingQueue.length > 0) {
        this.processLoadQueue().catch(err => console.error('Error processing load queue:', err));
      }
    }
  }

  /**
   * Load model in Ollama
   */
  private async loadModelInOllama(modelName: string): Promise<void> {
    // Verificar se Ollama está disponível
    const ollamaAvailable = await checkOllamaAvailable();
    if (!ollamaAvailable) {
      throw new Error('Ollama não está disponível');
    }

    // Verificar se o modelo está disponível
    const modelAvailable = await checkModelAvailable(modelName);
    if (!modelAvailable) {
      throw new Error(`Modelo ${modelName} não está disponível no Ollama`);
    }

    // Fazer uma chamada de teste para "aquecer" o modelo na VRAM
    // Isso força o Ollama a carregar o modelo na GPU
    try {
      await callOllamaChat(
        [
          {
            role: 'user',
            content: 'test',
          },
        ],
        modelName
      );
    } catch (error) {
      // Ignorar erros de teste, o modelo pode já estar carregado
      console.log(`Modelo ${modelName} já pode estar carregado`);
    }
  }

  /**
   * Free VRAM by unloading unused models
   */
  private async freeVRAM(requiredVRAM: number): Promise<void> {
    const currentVRAM = resourceManager.getResourceUsage().vramUsed;
    const availableVRAM = resourceManager.getResourceUsage().vramAvailable;
    const neededVRAM = requiredVRAM - availableVRAM;

    if (neededVRAM <= 0) {
      return; // Já tem VRAM suficiente
    }

    console.log(`💾 Liberando ${neededVRAM.toFixed(1)}GB de VRAM...`);

    // Ordenar modelos por último uso (mais antigo primeiro)
    const sortedModels = Array.from(this.loadedModels.values())
      .filter(m => m.isActive)
      .sort((a, b) => a.lastUsed.getTime() - b.lastUsed.getTime());

    let vramFreed = 0;
    for (const model of sortedModels) {
      if (vramFreed >= neededVRAM) {
        break;
      }

      console.log(`💾 Descarregando modelo ${model.modelName} para liberar VRAM`);
      await this.unloadModel(model.modelName);
      vramFreed += model.vramUsed;
    }

    console.log(`✅ Liberado ${vramFreed.toFixed(1)}GB de VRAM`);
  }

  /**
   * Unload model from VRAM
   */
  async unloadModel(modelName: string): Promise<void> {
    const loaded = this.loadedModels.get(modelName);
    if (!loaded || !loaded.isActive) {
      return;
    }

    console.log(`💾 Descarregando modelo ${modelName} da VRAM...`);

    // Marcar como inativo
    loaded.isActive = false;
    loaded.lastUsed = new Date();

    // Atualizar recursos
    resourceManager.getResourceUsage().vramUsed -= loaded.vramUsed;

    this.emit('model-unloaded', modelName);
    console.log(`✅ Modelo ${modelName} descarregado da VRAM`);
  }

  /**
   * Get loaded model
   */
  getLoadedModel(modelName: string): LoadedModel | null {
    const loaded = this.loadedModels.get(modelName);
    if (loaded && loaded.isActive) {
      loaded.lastUsed = new Date();
      loaded.useCount++;
      this.emit('model-accessed', modelName);
      return loaded;
    }
    return null;
  }

  /**
   * Preload model (carregar antes de usar)
   */
  async preloadModel(modelName: string): Promise<void> {
    try {
      await this.loadModel(modelName, 'low', true);
      console.log(`✅ Modelo ${modelName} pré-carregado na VRAM`);
    } catch (error) {
      console.warn(`⚠️ Não foi possível pré-carregar modelo ${modelName}:`, error);
    }
  }

  /**
   * Get all loaded models
   */
  getLoadedModels(): LoadedModel[] {
    return Array.from(this.loadedModels.values());
  }

  /**
   * Get active models
   */
  getActiveModels(): LoadedModel[] {
    return Array.from(this.loadedModels.values()).filter(m => m.isActive);
  }

  /**
   * Get model statistics
   */
  getStatistics(): {
    totalLoaded: number;
    activeModels: number;
    totalVRAMUsed: number;
    averageLoadTime: number;
    mostUsedModel: string | null;
  } {
    const loaded = Array.from(this.loadedModels.values());
    const active = loaded.filter(m => m.isActive);
    const totalVRAM = active.reduce((sum, m) => sum + m.vramUsed, 0);
    const avgLoadTime = loaded.length > 0
      ? loaded.reduce((sum, m) => sum + m.loadTime, 0) / loaded.length
      : 0;
    const mostUsed = loaded.length > 0
      ? loaded.reduce((max, m) => (m.useCount > max.useCount ? m : max), loaded[0])
      : null;

    return {
      totalLoaded: loaded.length,
      activeModels: active.length,
      totalVRAMUsed: totalVRAM,
      averageLoadTime: avgLoadTime,
      mostUsedModel: mostUsed?.modelName || null,
    };
  }

  /**
   * Warm up models (pré-carregar modelos mais usados)
   */
  async warmUpModels(modelNames: string[]): Promise<void> {
    console.log(`🔥 Aquecendo modelos: ${modelNames.join(', ')}`);
    
    for (const modelName of modelNames) {
      try {
        await this.preloadModel(modelName);
      } catch (error) {
        console.warn(`⚠️ Não foi possível aquecer modelo ${modelName}:`, error);
      }
    }
  }

  /**
   * Auto-load model based on task type
   */
  async autoLoadModelForTask(taskType: string): Promise<string | null> {
    // Obter melhor modelo para a tarefa
    const bestModel = await resourceManager.getBestModelForTask(taskType, 'balanced');
    
    if (!bestModel) {
      return null;
    }

    // Carregar modelo se não estiver carregado
    try {
      await this.loadModel(bestModel, 'normal');
      return bestModel;
    } catch (error) {
      console.error(`Erro ao carregar modelo ${bestModel}:`, error);
      return null;
    }
  }
}

// Export singleton instance
export const modelLoader = new ModelLoader();

export default ModelLoader;

