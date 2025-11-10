import { useCallback, useRef, useState } from 'react';

/**
 * Hook para gerenciar efeitos sonoros
 * Usa ElevenLabs API para sons mais específicos, com fallback para Web Audio API
 */
export function useSoundEffects(enabled: boolean = true) {
  const audioContextRef = useRef<AudioContext | null>(null);

  // Inicializar AudioContext apenas quando necessário
  const getAudioContext = useCallback(() => {
    if (!enabled) return null;
    
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('AudioContext não disponível:', error);
        return null;
      }
    }
    
    return audioContextRef.current;
  }, [enabled]);

  /**
   * Tocar um tom (beep)
   */
  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!enabled) return;
    
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      // Envelope ADSR simples
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      console.warn('Erro ao tocar som:', error);
    }
  }, [enabled, getAudioContext]);

  /**
   * Som de sucesso (tom ascendente)
   */
  const playSuccess = useCallback(() => {
    if (!enabled) return;
    playTone(523.25, 0.1, 'sine'); // C5
    setTimeout(() => playTone(659.25, 0.1, 'sine'), 50); // E5
    setTimeout(() => playTone(783.99, 0.15, 'sine'), 100); // G5
  }, [enabled, playTone]);

  /**
   * Som de erro (tom descendente)
   */
  const playError = useCallback(() => {
    if (!enabled) return;
    playTone(440, 0.2, 'sawtooth'); // A4
    setTimeout(() => playTone(349.23, 0.2, 'sawtooth'), 100); // F4
  }, [enabled, playTone]);

  /**
   * Som de notificação (ping curto)
   */
  const playNotification = useCallback(() => {
    if (!enabled) return;
    playTone(800, 0.1, 'sine');
  }, [enabled, playTone]);

  /**
   * Som de clique (click curto)
   */
  const playClick = useCallback(() => {
    if (!enabled) return;
    playTone(1000, 0.05, 'square');
  }, [enabled, playTone]);

  /**
   * Som de enviar mensagem (whoosh)
   */
  const playSend = useCallback(() => {
    if (!enabled) return;
    // Som de whoosh (ruído branco com filtro)
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(200, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.15);

      filter.type = 'lowpass';
      filter.frequency.value = 1000;

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (error) {
      console.warn('Erro ao tocar som de envio:', error);
    }
  }, [enabled, getAudioContext]);

  /**
   * Som de receber mensagem (ding)
   */
  const playReceive = useCallback(() => {
    if (!enabled) return;
    playTone(659.25, 0.15, 'sine'); // E5
    setTimeout(() => playTone(783.99, 0.1, 'sine'), 80); // G5
  }, [enabled, playTone]);

  /**
   * Som de pensando (pulso suave)
   */
  const playThinking = useCallback(() => {
    if (!enabled) return;
    playTone(400, 0.2, 'sine');
  }, [enabled, playTone]);

  /**
   * Som de processando (beep contínuo suave)
   */
  const playProcessing = useCallback(() => {
    if (!enabled) return;
    playTone(600, 0.3, 'sine');
  }, [enabled, playTone]);

  /**
   * Som de copiar (click duplo)
   */
  const playCopy = useCallback(() => {
    if (!enabled) return;
    playTone(1200, 0.05, 'square');
    setTimeout(() => playTone(1200, 0.05, 'square'), 50);
  }, [enabled, playTone]);

  /**
   * Som de deletar (tom grave)
   */
  const playDelete = useCallback(() => {
    if (!enabled) return;
    playTone(200, 0.15, 'sawtooth');
  }, [enabled, playTone]);

  /**
   * Som de hover (tom muito curto)
   */
  const playHover = useCallback(() => {
    if (!enabled) return;
    playTone(800, 0.03, 'sine');
  }, [enabled, playTone]);

  // Remover tentativa de usar ElevenLabs para efeitos sonoros
  // ElevenLabs é para TTS (texto para fala), não para efeitos sonoros
  // Vamos usar apenas Web Audio API que é mais adequado para efeitos sonoros

  return {
    // Usar Web Audio API diretamente (mais adequado para efeitos sonoros)
    playSuccess,
    playError,
    playNotification,
    playClick,
    playSend,
    playReceive,
    playThinking,
    playProcessing,
    playCopy,
    playDelete,
    playHover,
  };
}

