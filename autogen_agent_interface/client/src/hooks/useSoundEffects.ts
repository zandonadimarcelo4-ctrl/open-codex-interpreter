import { useCallback, useRef, useState } from 'react';

/**
 * Hook para gerenciar efeitos sonoros
 * Usa ElevenLabs API para sons mais específicos, com fallback para Web Audio API
 */
export function useSoundEffects(enabled: boolean = true) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [useElevenLabs, setUseElevenLabs] = useState(true); // Tentar usar ElevenLabs por padrão

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

  /**
   * Gerar efeito sonoro usando ElevenLabs API (mais específico)
   */
  const playElevenLabsSound = useCallback(async (text: string, fallbackFn: () => void) => {
    if (!enabled || !useElevenLabs) {
      fallbackFn();
      return;
    }

    try {
      // Usar API do backend que já tem ElevenLabs configurado
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
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
      console.warn('Erro ao usar ElevenLabs para efeito sonoro, usando fallback:', error);
      fallbackFn(); // Fallback para Web Audio API
    }
  }, [enabled, useElevenLabs]);

  /**
   * Som de sucesso (tom ascendente) - versão ElevenLabs
   */
  const playSuccessElevenLabs = useCallback(() => {
    playElevenLabsSound(
      "Som de sucesso: tom ascendente curto e agradável, como um ping de notificação positiva",
      playSuccess
    );
  }, [playElevenLabsSound, playSuccess]);

  /**
   * Som de erro (tom descendente) - versão ElevenLabs
   */
  const playErrorElevenLabs = useCallback(() => {
    playElevenLabsSound(
      "Som de erro: tom descendente grave e curto, como um alerta de problema",
      playError
    );
  }, [playElevenLabsSound, playError]);

  /**
   * Som de notificação (ping curto) - versão ElevenLabs
   */
  const playNotificationElevenLabs = useCallback(() => {
    playElevenLabsSound(
      "Som de notificação: ping curto e agudo, como um sino pequeno",
      playNotification
    );
  }, [playElevenLabsSound, playNotification]);

  /**
   * Som de clique (click curto) - versão ElevenLabs
   */
  const playClickElevenLabs = useCallback(() => {
    playElevenLabsSound(
      "Som de clique: click curto e seco, como um botão sendo pressionado",
      playClick
    );
  }, [playElevenLabsSound, playClick]);

  /**
   * Som de enviar mensagem (whoosh) - versão ElevenLabs
   */
  const playSendElevenLabs = useCallback(() => {
    playElevenLabsSound(
      "Som de enviar: whoosh suave e rápido, como algo sendo lançado",
      playSend
    );
  }, [playElevenLabsSound, playSend]);

  /**
   * Som de receber mensagem (ding) - versão ElevenLabs
   */
  const playReceiveElevenLabs = useCallback(() => {
    playElevenLabsSound(
      "Som de receber: ding agradável e claro, como uma notificação chegando",
      playReceive
    );
  }, [playElevenLabsSound, playReceive]);

  /**
   * Som de pensando (pulso suave) - versão ElevenLabs
   */
  const playThinkingElevenLabs = useCallback(() => {
    playElevenLabsSound(
      "Som de pensando: pulso suave e baixo, como um batimento cardíaco sutil",
      playThinking
    );
  }, [playElevenLabsSound, playThinking]);

  /**
   * Som de processando (beep contínuo suave) - versão ElevenLabs
   */
  const playProcessingElevenLabs = useCallback(() => {
    playElevenLabsSound(
      "Som de processando: beep contínuo suave e médio, como um processamento em andamento",
      playProcessing
    );
  }, [playElevenLabsSound, playProcessing]);

  /**
   * Som de copiar (click duplo) - versão ElevenLabs
   */
  const playCopyElevenLabs = useCallback(() => {
    playElevenLabsSound(
      "Som de copiar: dois clicks rápidos e secos, como algo sendo copiado",
      playCopy
    );
  }, [playElevenLabsSound, playCopy]);

  return {
    // Versões com ElevenLabs (mais específicas)
    playSuccess: playSuccessElevenLabs,
    playError: playErrorElevenLabs,
    playNotification: playNotificationElevenLabs,
    playClick: playClickElevenLabs,
    playSend: playSendElevenLabs,
    playReceive: playReceiveElevenLabs,
    playThinking: playThinkingElevenLabs,
    playProcessing: playProcessingElevenLabs,
    playCopy: playCopyElevenLabs,
    // Versões originais (Web Audio API) - fallback
    playDelete,
    playHover,
    // Controle
    setUseElevenLabs,
  };
}

