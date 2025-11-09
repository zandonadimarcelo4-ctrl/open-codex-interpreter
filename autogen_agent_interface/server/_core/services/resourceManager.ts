/**
 * Resource Manager
 * Otimizado para RTX 4080 Super (16GB VRAM)
 * Gerencia recursos de forma eficiente, pausando quando em idle
 */

import { EventEmitter } from 'events';
import { modelManager } from './modelManager';
import { deviceManager } from './deviceManager';
import { modelLoader } from './modelLoader';

export interface ResourceUsage {
  vramUsed: number; // GB
  vramAvailable: number; // GB
  vramTotal: number; // GB
  cpuUsage: number; // 0-100
  memoryUsage: number; // 0-100
  gpuUtilization: number; // 0-100
  isIdle: boolean;
  lastActivity: Date;
  activeModels: string[];
  idleTimeout: number; // seconds
}

export interface ModelCache {
  modelName: string;
  loadedAt: Date;
  lastUsed: Date;
  vramUsed: number;
  isActive: boolean;
  canUnload: boolean;
}

class ResourceManager extends EventEmitter {
  private resourceUsage: ResourceUsage;
  private modelCache: Map<string, ModelCache> = new Map();
  private idleCheckInterval: ReturnType<typeof setInterval> | null = null;
  private idleTimeout: number = 300000; // 5 minutos de idle
  private checkInterval: number = 30000; // Verificar a cada 30 segundos
  private maxVRAM: number = 16; // RTX 4080 Super 16GB
  private minVRAMReserve: number = 2; // Reservar 2GB para sistema
  private isMonitoring: boolean = false;

  constructor() {
    super();
    this.resourceUsage = {
      vramUsed: 0,
      vramAvailable: this.maxVRAM,
      vramTotal: this.maxVRAM,
      cpuUsage: 0,
      memoryUsage: 0,
      gpuUtilization: 0,
      isIdle: false,
      lastActivity: new Date(),
      activeModels: [],
      idleTimeout: this.idleTimeout,
    };
  }

  /**
   * Start resource monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    console.log('🔍 Resource Manager iniciado - Otimizado para RTX 4080 Super');

    // Verificar recursos periodicamente
    this.idleCheckInterval = setInterval(() => {
      this.updateResourceUsage();
      this.checkIdleState();
      this.optimizeResources();
    }, this.checkInterval) as ReturnType<typeof setInterval>;

    // Atualizar uso inicial
    this.updateResourceUsage();
  }

  /**
   * Stop resource monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = null;
    }

    console.log('Resource Manager parado');
  }

  /**
   * Update resource usage
   */
  private updateResourceUsage(): void {
    const now = new Date();
    const timeSinceActivity = now.getTime() - this.resourceUsage.lastActivity.getTime();

    // Calcular VRAM usado pelos modelos ativos
    let vramUsed = 0;
    this.modelCache.forEach(cache => {
      if (cache.isActive) {
        vramUsed += cache.vramUsed;
      }
    });

    this.resourceUsage.vramUsed = vramUsed;
    this.resourceUsage.vramAvailable = this.maxVRAM - vramUsed - this.minVRAMReserve;
    this.resourceUsage.isIdle = timeSinceActivity > this.idleTimeout;
    this.resourceUsage.activeModels = Array.from(this.modelCache.values())
      .filter(c => c.isActive)
      .map(c => c.modelName);

    // Emitir evento de atualização
    this.emit('resource-update', this.resourceUsage);
  }

  /**
   * Check idle state
   */
  private checkIdleState(): void {
    const wasIdle = this.resourceUsage.isIdle;
    const now = new Date();
    const timeSinceActivity = now.getTime() - this.resourceUsage.lastActivity.getTime();

    this.resourceUsage.isIdle = timeSinceActivity > this.idleTimeout;

    if (!wasIdle && this.resourceUsage.isIdle) {
      console.log('💤 Sistema entrando em modo idle - Otimizando recursos...');
      this.emit('idle-start');
      this.unloadIdleModels();
    } else if (wasIdle && !this.resourceUsage.isIdle) {
      console.log('⚡ Sistema saindo do modo idle');
      this.emit('idle-end');
    }
  }

  /**
   * Optimize resources
   */
  private async optimizeResources(): Promise<void> {
    // Se estiver em idle, descarregar modelos não usados
    if (this.resourceUsage.isIdle) {
      await this.unloadIdleModels();
      return;
    }

    // Se VRAM estiver acima de 80%, otimizar
    const vramUsagePercent = (this.resourceUsage.vramUsed / this.maxVRAM) * 100;
    if (vramUsagePercent > 80) {
      console.log(`⚠️ VRAM alto (${vramUsagePercent.toFixed(1)}%) - Otimizando...`);
      await this.unloadUnusedModels();
    }
  }

  /**
   * Unload idle models
   */
  private async unloadIdleModels(): Promise<void> {
    const now = new Date();
    const unloadThreshold = 600000; // 10 minutos sem uso

    const unloadPromises: Promise<void>[] = [];
    this.modelCache.forEach((cache, modelName) => {
      if (cache.isActive && cache.canUnload) {
        const timeSinceLastUse = now.getTime() - cache.lastUsed.getTime();
        if (timeSinceLastUse > unloadThreshold) {
          console.log(`💾 Descarregando modelo ${modelName} (idle por ${Math.round(timeSinceLastUse / 1000 / 60)}min)`);
          unloadPromises.push(this.unloadModel(modelName));
        }
      }
    });

    await Promise.all(unloadPromises);
  }

  /**
   * Unload unused models
   */
  private async unloadUnusedModels(): Promise<void> {
    // Ordenar modelos por último uso (mais antigo primeiro)
    const sortedModels = Array.from(this.modelCache.entries())
      .filter(([_, cache]) => cache.isActive && cache.canUnload)
      .sort(([_, a], [__, b]) => a.lastUsed.getTime() - b.lastUsed.getTime());

    // Descarregar modelos mais antigos até liberar VRAM suficiente
    let vramFreed = 0;
    const targetVRAM = this.maxVRAM * 0.7; // Liberar até 70% de uso

    const unloadPromises: Promise<void>[] = [];
    for (const [modelName, cache] of sortedModels) {
      if (this.resourceUsage.vramUsed - vramFreed <= targetVRAM) {
        break;
      }

      console.log(`💾 Descarregando modelo ${modelName} para liberar VRAM`);
      unloadPromises.push(this.unloadModel(modelName));
      vramFreed += cache.vramUsed;
    }

    await Promise.all(unloadPromises);
  }

  /**
   * Register model usage
   */
  registerModelUsage(modelName: string, vramRequired: number): void {
    this.resourceUsage.lastActivity = new Date();

    const existing = this.modelCache.get(modelName);
    if (existing) {
      existing.lastUsed = new Date();
      existing.isActive = true;
      existing.canUnload = true;
    } else {
      this.modelCache.set(modelName, {
        modelName,
        loadedAt: new Date(),
        lastUsed: new Date(),
        vramUsed: vramRequired,
        isActive: true,
        canUnload: true,
      });
    }

    // Sincronizar com Model Loader
    const loadedModel = modelLoader.getLoadedModel(modelName);
    if (loadedModel) {
      this.modelCache.set(modelName, {
        modelName,
        loadedAt: loadedModel.loadedAt,
        lastUsed: loadedModel.lastUsed,
        vramUsed: loadedModel.vramUsed,
        isActive: loadedModel.isActive,
        canUnload: true,
      });
    }

    this.updateResourceUsage();
    this.emit('model-used', modelName);
  }

  /**
   * Unload model
   */
  private async unloadModel(modelName: string): Promise<void> {
    const cache = this.modelCache.get(modelName);
    if (cache) {
      cache.isActive = false;
      
      // Descarregar do Model Loader também
      await modelLoader.unloadModel(modelName);
      
      this.updateResourceUsage();
      this.emit('model-unloaded', modelName);
    }
  }

  /**
   * Check if model can be loaded
   */
  canLoadModel(vramRequired: number): boolean {
    const availableVRAM = this.resourceUsage.vramAvailable;
    return availableVRAM >= vramRequired;
  }

  /**
   * Get best model for available VRAM
   */
 async getBestModelForTask(
    taskType: string,
    strategy: 'quality' | 'speed' | 'balanced' = 'balanced'
  ): Promise<string | null> {
    const availableVRAM = this.resourceUsage.vramAvailable;
    
    // Obter melhor modelo do Model Manager
    const bestModel = await modelManager.getBestModelForTask(
      taskType,
      availableVRAM,
      strategy
    );

    if (bestModel && this.canLoadModel(bestModel.vramRequired || 0)) {
      return bestModel.name;
    }

    // Fallback para modelo menor
    const fallbackChain = await modelManager.getDeepSeekFallbackChain();
    for (const model of fallbackChain) {
      if (this.canLoadModel(model.vramRequired || 0)) {
        return model.name;
      }
    }

    return null;
  }

  /**
   * Get resource usage
   */
  getResourceUsage(): ResourceUsage {
    return { ...this.resourceUsage };
  }

  /**
   * Get model cache status
   */
  getModelCacheStatus(): ModelCache[] {
    return Array.from(this.modelCache.values());
  }

  /**
   * Set idle timeout
   */
  setIdleTimeout(timeout: number): void {
    this.idleTimeout = timeout;
    this.resourceUsage.idleTimeout = timeout;
  }

  /**
   * Force unload all models
   */
  async forceUnloadAllModels(): Promise<void> {
    console.log('🔄 Forçando descarregamento de todos os modelos...');
    const unloadPromises: Promise<void>[] = [];
    this.modelCache.forEach((cache, modelName) => {
      if (cache.isActive) {
        unloadPromises.push(this.unloadModel(modelName));
      }
    });
    await Promise.all(unloadPromises);
    this.updateResourceUsage();
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const vramUsagePercent = (this.resourceUsage.vramUsed / this.maxVRAM) * 100;

    if (vramUsagePercent > 90) {
      recommendations.push('VRAM muito alto! Considere descarregar modelos não usados.');
    }

    if (this.resourceUsage.isIdle && this.modelCache.size > 0) {
      recommendations.push('Sistema em idle. Modelos podem ser descarregados para economizar recursos.');
    }

    if (this.resourceUsage.activeModels.length > 2) {
      recommendations.push('Múltiplos modelos carregados. Considere usar apenas um modelo por vez.');
    }

    return recommendations;
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    vramUsage: { used: number; available: number; total: number; percent: number };
    isIdle: boolean;
    activeModels: number;
    cachedModels: number;
    recommendations: string[];
  } {
    const vramUsagePercent = (this.resourceUsage.vramUsed / this.maxVRAM) * 100;

    return {
      vramUsage: {
        used: this.resourceUsage.vramUsed,
        available: this.resourceUsage.vramAvailable,
        total: this.resourceUsage.vramTotal,
        percent: vramUsagePercent,
      },
      isIdle: this.resourceUsage.isIdle,
      activeModels: this.resourceUsage.activeModels.length,
      cachedModels: this.modelCache.size,
      recommendations: this.getOptimizationRecommendations(),
    };
  }
}

// Export singleton instance
export const resourceManager = new ResourceManager();

export default ResourceManager;

