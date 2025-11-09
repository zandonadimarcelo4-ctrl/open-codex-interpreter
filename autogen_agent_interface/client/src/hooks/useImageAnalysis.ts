/**
 * Hook para Análise de Imagens (Multimodal)
 * Detecção de objetos e análise de imagens usando TensorFlow.js
 */
import { useState, useCallback, useRef } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export interface DetectedObject {
  bbox: [number, number, number, number];
  class: string;
  score: number;
}

export interface UseImageAnalysisOptions {
  enabled?: boolean;
  onObjectsDetected?: (objects: DetectedObject[]) => void;
  confidenceThreshold?: number;
}

export function useImageAnalysis(options: UseImageAnalysisOptions = {}) {
  const {
    enabled = true,
    onObjectsDetected,
    confidenceThreshold = 0.5,
  } = options;

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const modelLoadingRef = useRef(false);

  /**
   * Carregar modelo de detecção de objetos
   */
  const loadModel = useCallback(async () => {
    if (model) return model;
    if (modelLoadingRef.current) {
      // Aguardar modelo carregar
      while (!model) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return model;
    }

    modelLoadingRef.current = true;
    try {
      const loadedModel = await cocoSsd.load();
      setModel(loadedModel);
      modelLoadingRef.current = false;
      return loadedModel;
    } catch (err) {
      modelLoadingRef.current = false;
      throw err;
    }
  }, [model]);

  /**
   * Analisar imagem e detectar objetos
   */
  const analyzeImage = useCallback(async (
    imageFile: File | string | HTMLImageElement
  ): Promise<DetectedObject[]> => {
    if (!enabled) {
      throw new Error('Análise de imagens não está habilitada');
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Carregar modelo se necessário
      const detectionModel = await loadModel();

      // Converter para HTMLImageElement se necessário
      let imageElement: HTMLImageElement;
      
      if (imageFile instanceof HTMLImageElement) {
        imageElement = imageFile;
      } else if (typeof imageFile === 'string') {
        // URL ou base64
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageFile;
        });
        imageElement = img;
      } else {
        // File
        const img = new Image();
        const url = URL.createObjectURL(imageFile);
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = url;
        });
        imageElement = img;
        URL.revokeObjectURL(url);
      }

      // Detectar objetos
      const predictions = await detectionModel.detect(imageElement);
      
      // Filtrar por threshold de confiança
      const filteredPredictions = predictions
        .filter(p => p.score >= confidenceThreshold)
        .map(p => ({
          bbox: p.bbox as [number, number, number, number],
          class: p.class,
          score: p.score,
        }));

      onObjectsDetected?.(filteredPredictions);
      setIsProcessing(false);

      return filteredPredictions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao analisar imagem';
      setError(errorMessage);
      setIsProcessing(false);
      throw err;
    }
  }, [enabled, confidenceThreshold, onObjectsDetected, loadModel]);

  /**
   * Analisar múltiplas imagens
   */
  const analyzeMultipleImages = useCallback(async (
    imageFiles: (File | string | HTMLImageElement)[]
  ): Promise<DetectedObject[][]> => {
    const results: DetectedObject[][] = [];
    
    for (const imageFile of imageFiles) {
      try {
        const objects = await analyzeImage(imageFile);
        results.push(objects);
      } catch (err) {
        console.error('Erro ao analisar imagem:', err);
        results.push([]);
      }
    }

    return results;
  }, [analyzeImage]);

  return {
    analyzeImage,
    analyzeMultipleImages,
    loadModel,
    isProcessing,
    error,
    model,
  };
}

