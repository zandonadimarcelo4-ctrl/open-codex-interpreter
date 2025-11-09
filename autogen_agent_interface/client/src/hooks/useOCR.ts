/**
 * Hook para OCR (Optical Character Recognition)
 * Reconhecimento de texto em imagens usando Tesseract.js
 */
import { useState, useCallback } from 'react';
import { createWorker } from 'tesseract.js';

export interface UseOCROptions {
  enabled?: boolean;
  onTextExtracted?: (text: string) => void;
  languages?: string[];
}

export function useOCR(options: UseOCROptions = {}) {
  const {
    enabled = true,
    onTextExtracted,
    languages = ['por', 'eng'], // Português e Inglês
  } = options;

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  /**
   * Extrair texto de uma imagem
   */
  const extractText = useCallback(async (imageFile: File | string): Promise<string> => {
    if (!enabled) {
      throw new Error('OCR não está habilitado');
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const worker = await createWorker(languages.join('+'));
      
      // Processar imagem
      const { data } = await worker.recognize(imageFile, undefined, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      await worker.terminate();

      const extractedText = data.text.trim();
      onTextExtracted?.(extractedText);
      setIsProcessing(false);
      setProgress(100);

      return extractedText;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar OCR';
      setError(errorMessage);
      setIsProcessing(false);
      setProgress(0);
      throw err;
    }
  }, [enabled, languages, onTextExtracted]);

  /**
   * Extrair texto de múltiplas imagens
   */
  const extractTextFromMultiple = useCallback(async (
    imageFiles: (File | string)[]
  ): Promise<string[]> => {
    const results: string[] = [];
    
    for (const imageFile of imageFiles) {
      try {
        const text = await extractText(imageFile);
        results.push(text);
      } catch (err) {
        console.error('Erro ao processar imagem:', err);
        results.push('');
      }
    }

    return results;
  }, [extractText]);

  return {
    extractText,
    extractTextFromMultiple,
    isProcessing,
    error,
    progress,
  };
}

