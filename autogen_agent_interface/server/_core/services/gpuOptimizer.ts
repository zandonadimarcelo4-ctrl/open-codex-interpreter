/**
 * GPU Optimizer
 * Otimizações específicas para RTX 4080 Super
 * Quantização, cache inteligente, e gerenciamento de memória
 */

import { EventEmitter } from 'events';
import { resourceManager } from './resourceManager';

export interface GPUOptimization {
  quantization: 'none' | 'int8' | 'int4' | 'fp16';
  useCache: boolean;
  batchSize: number;
  maxSequenceLength: number;
  enableFlashAttention: boolean;
  enableKVCache: boolean;
  memoryEfficientAttention: boolean;
}

export interface ModelOptimization {
  modelName: string;
  optimization: GPUOptimization;
  vramSaved: number; // GB saved
  performanceImpact: number; // 0-100 (0 = no impact, 100 = significant impact)
}

class GPUOptimizer extends EventEmitter {
  private optimizations: Map<string, ModelOptimization> = new Map();
  private defaultOptimization: GPUOptimization;

  constructor() {
    super();
    
    // Configuração padrão otimizada para RTX 4080 Super
    this.defaultOptimization = {
      quantization: 'fp16', // FP16 é mais eficiente que FP32, mantém qualidade
      useCache: true,
      batchSize: 1, // Batch size 1 para economizar VRAM
      maxSequenceLength: 2048, // Limitar sequência para economizar memória
      enableFlashAttention: true, // Flash Attention economiza VRAM
      enableKVCache: true, // KV Cache acelera inferência
      memoryEfficientAttention: true, // Atenção eficiente em memória
    };
  }

  /**
   * Get optimization for model
   */
  getOptimizationForModel(modelName: string, vramAvailable: number): GPUOptimization {
    const existing = this.optimizations.get(modelName);
    if (existing) {
      return existing.optimization;
    }

    // Determinar quantização baseado em VRAM disponível
    let quantization: 'none' | 'int8' | 'int4' | 'fp16' = 'fp16';
    
    if (vramAvailable < 4) {
      quantization = 'int4'; // Máxima economia de VRAM
    } else if (vramAvailable < 8) {
      quantization = 'int8'; // Boa economia mantendo qualidade
    } else {
      quantization = 'fp16'; // Melhor qualidade, ainda eficiente
    }

    const optimization: GPUOptimization = {
      ...this.defaultOptimization,
      quantization,
      // Ajustar batch size baseado em VRAM
      batchSize: vramAvailable >= 12 ? 2 : 1,
      // Ajustar max sequence length baseado em VRAM
      maxSequenceLength: vramAvailable >= 12 ? 4096 : 2048,
    };

    // Calcular VRAM economizado
    const vramSaved = this.calculateVRAMSaved(modelName, optimization);
    const performanceImpact = this.calculatePerformanceImpact(optimization);

    this.optimizations.set(modelName, {
      modelName,
      optimization,
      vramSaved,
      performanceImpact,
    });

    return optimization;
  }

  /**
   * Calculate VRAM saved with optimization
   */
  private calculateVRAMSaved(modelName: string, optimization: GPUOptimization): number {
    let saved = 0;

    // Economia de quantização
    switch (optimization.quantization) {
      case 'int4':
        saved += 4; // ~4GB economizados
        break;
      case 'int8':
        saved += 2; // ~2GB economizados
        break;
      case 'fp16':
        saved += 0.5; // ~0.5GB economizados vs FP32
        break;
    }

    // Economia de Flash Attention
    if (optimization.enableFlashAttention) {
      saved += 1; // ~1GB economizado
    }

    // Economia de Memory Efficient Attention
    if (optimization.memoryEfficientAttention) {
      saved += 0.5; // ~0.5GB economizado
    }

    // Economia de sequência limitada
    if (optimization.maxSequenceLength < 4096) {
      saved += 0.5; // ~0.5GB economizado
    }

    return saved;
  }

  /**
   * Calculate performance impact
   */
  private calculatePerformanceImpact(optimization: GPUOptimization): number {
    let impact = 0;

    // Impacto de quantização
    switch (optimization.quantization) {
      case 'int4':
        impact += 15; // 15% de impacto na qualidade
        break;
      case 'int8':
        impact += 5; // 5% de impacto na qualidade
        break;
      case 'fp16':
        impact += 0; // Sem impacto significativo
        break;
    }

    // Flash Attention e KV Cache melhoram performance
    if (optimization.enableFlashAttention) {
      impact -= 5; // Melhora performance
    }
    if (optimization.enableKVCache) {
      impact -= 3; // Melhora performance
    }

    return Math.max(0, impact);
  }

  /**
   * Optimize model for idle state
   */
  getOptimizationForIdle(modelName: string): GPUOptimization {
    // Em idle, usar quantização máxima para economizar VRAM
    return {
      quantization: 'int4',
      useCache: false, // Desabilitar cache em idle
      batchSize: 1,
      maxSequenceLength: 1024, // Sequência menor em idle
      enableFlashAttention: true,
      enableKVCache: false, // Desabilitar KV cache em idle
      memoryEfficientAttention: true,
    };
  }

  /**
   * Get recommended optimization
   */
  getRecommendedOptimization(
    modelName: string,
    taskType: string,
    vramAvailable: number,
    isIdle: boolean
  ): GPUOptimization {
    if (isIdle) {
      return this.getOptimizationForIdle(modelName);
    }

    // Para tarefas diferentes, otimizações diferentes
    if (taskType === 'code' || taskType === 'executor') {
      // Para código, priorizar velocidade
      return {
        ...this.getOptimizationForModel(modelName, vramAvailable),
        enableKVCache: true,
        enableFlashAttention: true,
        batchSize: 1,
      };
    } else if (taskType === 'analysis' || taskType === 'research') {
      // Para análise, priorizar qualidade
      return {
        ...this.getOptimizationForModel(modelName, vramAvailable),
        quantization: 'fp16',
        maxSequenceLength: 4096,
        enableKVCache: true,
      };
    } else {
      // Padrão balanceado
      return this.getOptimizationForModel(modelName, vramAvailable);
    }
  }

  /**
   * Apply optimization to model
   */
  async applyOptimization(modelName: string, optimization: GPUOptimization): Promise<boolean> {
    try {
      // Em uma implementação real, isso aplicaria as otimizações ao modelo
      // Por enquanto, apenas registra a otimização
      const existing = this.optimizations.get(modelName);
      if (existing) {
        existing.optimization = optimization;
        existing.vramSaved = this.calculateVRAMSaved(modelName, optimization);
        existing.performanceImpact = this.calculatePerformanceImpact(optimization);
      }

      this.emit('optimization-applied', { modelName, optimization });
      return true;
    } catch (error) {
      console.error(`Erro ao aplicar otimização para ${modelName}:`, error);
      return false;
    }
  }

  /**
   * Get optimization status
   */
  getOptimizationStatus(modelName: string): ModelOptimization | null {
    return this.optimizations.get(modelName) || null;
  }

  /**
   * Get all optimizations
   */
  getAllOptimizations(): ModelOptimization[] {
    return Array.from(this.optimizations.values());
  }

  /**
   * Clear optimizations
   */
  clearOptimizations(): void {
    this.optimizations.clear();
  }
}

// Export singleton instance
export const gpuOptimizer = new GPUOptimizer();

export default GPUOptimizer;

