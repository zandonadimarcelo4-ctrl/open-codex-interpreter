import { useCallback, useRef, useState } from 'react';

/**
 * Hook para gerenciar efeitos sonoros
 * Usa Web Audio API para sons sintéticos (rápido e adequado para feedback de UI)
 * Opcionalmente pode usar ElevenLabs SFX API para efeitos sonoros mais complexos
 */
export function useSoundEffects(enabled: boolean = true) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [useElevenLabsSFX, setUseElevenLabsSFX] = useState(false); // Desabilitado por padrão (usa Web Audio API)

  // Inicializar AudioContext apenas quando necessário (lazy initialization)
  // Não tentar retomar aqui - será feito quando necessário (após interação do usuário)
  const getAudioContext = useCallback(() => {
    if (!enabled) return null;
    
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        // Não tentar retomar aqui - será feito quando necessário (após interação do usuário)
      } catch (error) {
        // Silenciosamente ignorar - AudioContext será criado quando necessário
        return null;
      }
    }
    
    return audioContextRef.current;
  }, [enabled]);

  /**
   * Tocar um tom (beep)
   */
  const playTone = useCallback(async (frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!enabled) return;
    
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      // Garantir que o AudioContext esteja ativo antes de tocar
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
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
      // Silenciosamente ignorar erros de autoplay - não logar para não poluir o console
      // O som simplesmente não será reproduzido se o usuário não interagiu com a página
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
  const playSend = useCallback(async () => {
    if (!enabled) return;
    // Som de whoosh (ruído branco com filtro)
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      // Garantir que o AudioContext esteja ativo antes de tocar
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
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
      // Silenciosamente ignorar erros de autoplay - não logar para não poluir o console
      // O som simplesmente não será reproduzido se o usuário não interagiu com a página
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

  /**
   * Gerar efeito sonoro usando ElevenLabs SFX API (efeitos sonoros reais, não fala)
   */
  const playElevenLabsSFX = useCallback(async (description: string, fallbackFn: () => void) => {
    if (!enabled || !useElevenLabsSFX) {
      fallbackFn();
      return;
    }

    try {
      // Usar API de efeitos sonoros do backend (ElevenLabs SFX API)
      const response = await fetch('/api/sfx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
        };
        
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          fallbackFn(); // Fallback para Web Audio API
        };
        
        await audio.play();
      } else {
        // Se ElevenLabs falhar, usar fallback
        fallbackFn();
      }
    } catch (error) {
      console.warn('Erro ao usar ElevenLabs SFX para efeito sonoro, usando fallback:', error);
      fallbackFn(); // Fallback para Web Audio API
    }
  }, [enabled, useElevenLabsSFX]);

  // Wrappers que podem usar ElevenLabs SFX ou Web Audio API
  const playSuccessWithSFX = useCallback(() => {
    if (useElevenLabsSFX) {
      playElevenLabsSFX("Glass shattering on concrete", playSuccess);
    } else {
      playSuccess();
    }
  }, [useElevenLabsSFX, playElevenLabsSFX, playSuccess]);

  const playErrorWithSFX = useCallback(() => {
    if (useElevenLabsSFX) {
      playElevenLabsSFX("Thunder rumbling in the distance", playError);
    } else {
      playError();
    }
  }, [useElevenLabsSFX, playElevenLabsSFX, playError]);

  const playNotificationWithSFX = useCallback(() => {
    if (useElevenLabsSFX) {
      playElevenLabsSFX("Soft bell chime", playNotification);
    } else {
      playNotification();
    }
  }, [useElevenLabsSFX, playElevenLabsSFX, playNotification]);

  const playClickWithSFX = useCallback(() => {
    if (useElevenLabsSFX) {
      playElevenLabsSFX("Button click sound", playClick);
    } else {
      playClick();
    }
  }, [useElevenLabsSFX, playElevenLabsSFX, playClick]);

  const playSendWithSFX = useCallback(() => {
    if (useElevenLabsSFX) {
      playElevenLabsSFX("Whoosh sound effect", playSend);
    } else {
      playSend();
    }
  }, [useElevenLabsSFX, playElevenLabsSFX, playSend]);

  const playReceiveWithSFX = useCallback(() => {
    if (useElevenLabsSFX) {
      playElevenLabsSFX("Notification ding sound", playReceive);
    } else {
      playReceive();
    }
  }, [useElevenLabsSFX, playElevenLabsSFX, playReceive]);

  return {
    // Usar Web Audio API por padrão (rápido e adequado para feedback de UI)
    // Opcionalmente pode usar ElevenLabs SFX para efeitos mais complexos
    playSuccess: useElevenLabsSFX ? playSuccessWithSFX : playSuccess,
    playError: useElevenLabsSFX ? playErrorWithSFX : playError,
    playNotification: useElevenLabsSFX ? playNotificationWithSFX : playNotification,
    playClick: useElevenLabsSFX ? playClickWithSFX : playClick,
    playSend: useElevenLabsSFX ? playSendWithSFX : playSend,
    playReceive: useElevenLabsSFX ? playReceiveWithSFX : playReceive,
    playThinking,
    playProcessing,
    playCopy,
    playDelete,
    playHover,
    // Controle
    setUseElevenLabsSFX,
  };
}

