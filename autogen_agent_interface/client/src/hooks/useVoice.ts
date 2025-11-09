/**
 * Hook para Voz Jarvis (TTS) e Speech-to-Text (STT)
 */
import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseVoiceOptions {
  ttsEnabled?: boolean;
  sttEnabled?: boolean;
  onTextReceived?: (text: string) => void;
  onAudioReady?: (audioUrl: string) => void;
}

export function useVoice(options: UseVoiceOptions = {}) {
  const {
    ttsEnabled = true,
    sttEnabled = true,
    onTextReceived,
    onAudioReady,
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Inicializar áudio element
  useEffect(() => {
    audioElementRef.current = new Audio();
    audioElementRef.current.onended = () => setIsSpeaking(false);
    audioElementRef.current.onerror = () => {
      setIsSpeaking(false);
      setError('Erro ao reproduzir áudio');
    };

    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  /**
   * Reproduzir áudio TTS (Text-to-Speech)
   */
  const speak = useCallback(async (text: string) => {
    if (!ttsEnabled || !text.trim()) {
      console.log('[TTS] TTS desabilitado ou texto vazio, ignorando');
      return;
    }

    // Parar qualquer áudio anterior antes de iniciar um novo
    if (audioElementRef.current) {
      try {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
        audioElementRef.current.src = '';
      } catch (e) {
        // Ignorar erros ao parar áudio anterior
      }
    }

    // Se já está falando, parar antes de iniciar novo
    if (isSpeaking) {
      console.log('[TTS] Parando áudio anterior antes de iniciar novo');
      setIsSpeaking(false);
      // Aguardar um pouco para garantir que o áudio anterior parou
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    try {
      setIsSpeaking(true);
      setError(null);

      // Limpar texto removendo emojis e caracteres especiais antes de enviar
      // Remover TODOS os caracteres Unicode acima de 0x7F exceto acentos portugueses
      let cleanedText = text.split('').filter(char => {
        const code = char.charCodeAt(0);
        // Manter apenas ASCII básico (0-127) e acentos portugueses (0x00C0-0x017F)
        return code <= 0x7F || (code >= 0x00C0 && code <= 0x017F);
      }).join('');
      
      // Remover markdown e caracteres especiais
      cleanedText = cleanedText.replace(/#{1,6}\s+/g, ''); // Headers
      cleanedText = cleanedText.replace(/\*\*/g, ''); // Bold
      cleanedText = cleanedText.replace(/\*/g, ''); // Italic
      cleanedText = cleanedText.replace(/__/g, ''); // Bold
      cleanedText = cleanedText.replace(/_/g, ''); // Italic
      cleanedText = cleanedText.replace(/`/g, ''); // Code
      cleanedText = cleanedText.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1'); // Links
      cleanedText = cleanedText.replace(/!\[([^\]]*)\]\([^\)]+\)/g, ''); // Images
      cleanedText = cleanedText.replace(/[^\x00-\x7F\u00C0-\u017F\s.,!?;:()\-]/g, ' '); // Remover caracteres especiais
      cleanedText = cleanedText.replace(/\s+/g, ' ').trim(); // Normalizar espaços
      
      if (!cleanedText.trim()) {
        console.warn('⚠️ Texto vazio após limpeza, não enviando para TTS');
        setIsSpeaking(false);
        return;
      }

      // Usar APENAS API de TTS do backend (ElevenLabs/Piper)
      console.log('🎙️ Tentando usar API de TTS do backend (ElevenLabs/Piper)...');
      console.log(`📝 Texto original (${text.length} chars) -> Limpo (${cleanedText.length} chars)`);
      console.log(`📝 Texto limpo (primeiros 100 chars): ${cleanedText.substring(0, 100)}`);
      
      try {
        const apiUrl = '/api/tts';
        console.log(`[TTS] Enviando requisição para: ${apiUrl}`);
        console.log(`[TTS] Texto a ser enviado: ${cleanedText.substring(0, 200)}...`);
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: cleanedText }),
        });
        
        console.log(`[TTS] Resposta recebida: status=${response.status}, ok=${response.ok}, contentType=${response.headers.get('content-type')}`);

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          console.log(`[TTS] Content-Type recebido: ${contentType}`);
          
          // Verificar se é realmente áudio
          if (!contentType || !contentType.startsWith('audio/')) {
            console.warn(`[TTS] ⚠️ Content-Type inesperado: ${contentType}, tentando processar como áudio mesmo assim`);
          }
          
          const audioBlob = await response.blob();
          console.log(`[TTS] Blob recebido: tamanho=${audioBlob.size} bytes, type=${audioBlob.type}`);
          
          if (audioBlob.size === 0) {
            throw new Error('Áudio recebido está vazio (0 bytes)');
          }
          
          const audioUrl = URL.createObjectURL(audioBlob);
          console.log(`[TTS] ✅ Áudio recebido do backend TTS (ElevenLabs/Piper), tamanho: ${audioBlob.size} bytes`);

          if (!audioElementRef.current) {
            console.error('[TTS] ❌ audioElementRef.current é null');
            setIsSpeaking(false);
            URL.revokeObjectURL(audioUrl);
            throw new Error('Elemento de áudio não está disponível');
          }

          // Parar e limpar elemento anterior se existir
          if (audioElementRef.current) {
            try {
              audioElementRef.current.pause();
              audioElementRef.current.currentTime = 0;
              audioElementRef.current.src = '';
              // Remover todos os event listeners
              audioElementRef.current.onended = null;
              audioElementRef.current.onerror = null;
              audioElementRef.current.onloadeddata = null;
              audioElementRef.current.onloadstart = null;
            } catch (e) {
              // Ignorar erros
            }
          }

          // Criar novo elemento de áudio (não clonar para evitar problemas)
          const newAudioElement = new Audio();
          audioElementRef.current = newAudioElement;
          
          // Flag para garantir que só reproduz uma vez
          let hasPlayed = false;
          
          newAudioElement.src = audioUrl;
          
          // Configurar event listeners
          newAudioElement.onended = () => {
            console.log('[TTS] ✅ Áudio reproduzido com sucesso');
            setIsSpeaking(false);
            hasPlayed = false;
            URL.revokeObjectURL(audioUrl);
          };
          
          newAudioElement.onerror = (error) => {
            console.error('❌ Erro ao reproduzir áudio:', error);
            console.error(`[TTS] Erro no elemento de áudio:`, newAudioElement.error);
            setIsSpeaking(false);
            hasPlayed = false;
            const errorMsg = newAudioElement.error 
              ? `Erro ao reproduzir áudio: ${newAudioElement.error.message || 'Erro desconhecido'}`
              : 'Erro ao reproduzir áudio. Verifique se o formato de áudio é suportado.';
            setError(errorMsg);
            URL.revokeObjectURL(audioUrl);
          };
          
          newAudioElement.onloadeddata = async () => {
            // Só reproduzir se ainda não reproduziu
            if (!hasPlayed) {
              console.log('[TTS] Áudio carregado, tentando reproduzir...');
              try {
                hasPlayed = true;
                await newAudioElement.play();
                console.log('[TTS] ✅ Áudio reproduzido com sucesso');
                onAudioReady?.(audioUrl);
              } catch (playError) {
                hasPlayed = false;
                console.error('❌ Erro ao reproduzir áudio:', playError);
                setIsSpeaking(false);
                const errorMsg = playError instanceof Error 
                  ? `Erro ao reproduzir áudio: ${playError.message}`
                  : 'Erro ao reproduzir áudio. Verifique as permissões do navegador.';
                setError(errorMsg);
                URL.revokeObjectURL(audioUrl);
              }
            }
          };
          
          newAudioElement.onloadstart = () => {
            console.log('[TTS] Iniciando carregamento do áudio...');
          };
          
          // Se o áudio já estiver carregado, reproduzir imediatamente (mas só uma vez)
          if (newAudioElement.readyState >= 2 && !hasPlayed) {
            console.log(`[TTS] Áudio já carregado (readyState=${newAudioElement.readyState}), reproduzindo imediatamente...`);
            try {
              hasPlayed = true;
              await newAudioElement.play();
              console.log('[TTS] ✅ Áudio reproduzido com sucesso');
              onAudioReady?.(audioUrl);
            } catch (playError) {
              hasPlayed = false;
              console.error('❌ Erro ao reproduzir áudio:', playError);
              setIsSpeaking(false);
              const errorMsg = playError instanceof Error 
                ? `Erro ao reproduzir áudio: ${playError.message}`
                : 'Erro ao reproduzir áudio. Verifique as permissões do navegador.';
              setError(errorMsg);
              URL.revokeObjectURL(audioUrl);
            }
          } else {
            // Aguardar o áudio carregar
            console.log(`[TTS] Áudio ainda não carregado (readyState=${newAudioElement.readyState}), aguardando...`);
          }
          
          return;
        } else {
          // Tentar ler como JSON primeiro, depois como texto
          let errorText = '';
          try {
            const errorJson = await response.json();
            errorText = errorJson.error || JSON.stringify(errorJson);
          } catch {
            // Se não for JSON, ler como texto
            errorText = await response.text();
            // Se for HTML (página de erro), extrair mensagem útil
            if (errorText.includes('<!doctype') || errorText.includes('<html')) {
              errorText = `Erro ${response.status}: Página de erro HTML retornada (rota não encontrada?)`;
            }
          }
          console.error('❌ Erro na API de TTS:', response.status, errorText);
          setError(`Erro na API de TTS: ${response.status} - ${errorText.substring(0, 100)}`);
          throw new Error(`API de TTS retornou erro: ${response.status}`);
        }
      } catch (apiError) {
        console.error('❌ Erro ao chamar API de TTS:', apiError);
        setError('Erro ao chamar API de TTS. Verifique se o backend está rodando e se ElevenLabs está configurado.');
        throw apiError; // Não usar fallback - forçar uso do backend
      }

      // REMOVIDO: Fallback para Web Speech API (soa como Google Tradutor)
      // Usar APENAS ElevenLabs/Piper do backend
      throw new Error('TTS não disponível: API do backend não respondeu corretamente');
      
      // CÓDIGO COMENTADO - Não usar Web Speech API
      /*
      // Fallback para Web Speech API
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-BR';  // FORÇAR português brasileiro
            utterance.rate = 0.92;  // Ligeiramente mais lento para soar mais natural
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            // Tentar usar voz neural mais natural se disponível
            const voices = window.speechSynthesis.getVoices();
            // Priorizar vozes neurais brasileiras
            const ptBRVoice = voices.find((v: SpeechSynthesisVoice) => 
              v.lang === 'pt-BR' && (v.name.includes('Neural') || v.name.includes('Google') || v.name.includes('Brazil'))
            ) || voices.find((v: SpeechSynthesisVoice) => 
              v.lang.startsWith('pt-BR')
            ) || voices.find((v: SpeechSynthesisVoice) => 
              v.lang.startsWith('pt')
            );
            if (ptBRVoice) {
              utterance.voice = ptBRVoice;
              utterance.lang = ptBRVoice.lang;  // Usar idioma da voz selecionada
            }
        
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (err) => {
          console.error('Erro na Web Speech API:', err);
          setError('Erro ao reproduzir áudio com Web Speech API');
          setIsSpeaking(false);
        };
        
        window.speechSynthesis.speak(utterance);
      } else {
        throw new Error('TTS não disponível: API não encontrada e Web Speech API não suportada');
      }
      */
    } catch (err) {
      console.error('Erro ao falar:', err);
      setError(err instanceof Error ? err.message : 'Erro ao reproduzir áudio');
      setIsSpeaking(false);
    }
  }, [ttsEnabled, onAudioReady]);

  /**
   * Parar de falar
   */
  const stopSpeaking = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }
    
    // Parar Web Speech API se estiver em uso
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    setIsSpeaking(false);
  }, []);

  /**
   * Verificar permissão de microfone
   */
  const checkMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      // Verificar se a API está disponível
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('API de mídia não suportada neste navegador');
        return false;
      }

      // Verificar permissão
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      
      if (permissionStatus.state === 'denied') {
        setError('Permissão de microfone negada. Por favor, permita o acesso nas configurações do navegador.');
        return false;
      }

      return true;
    } catch (err) {
      // Se a API de permissões não estiver disponível, tentar acessar diretamente
      console.warn('Não foi possível verificar permissão:', err);
      return true;
    }
  }, []);

  /**
   * Iniciar gravação de voz (STT)
   */
  const startListening = useCallback(async () => {
    if (!sttEnabled || isRecording) return;

    try {
      setError(null);

      // Verificar permissão primeiro
      const hasPermission = await checkMicrophonePermission();
      if (!hasPermission) {
        return;
      }

      // Solicitar acesso ao microfone
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          } 
        });
      } catch (err: any) {
        // Tratar erros específicos de permissão
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Permissão de microfone negada. Clique no ícone de cadeado na barra de endereços e permita o acesso ao microfone.');
          return;
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('Nenhum microfone encontrado. Verifique se o microfone está conectado.');
          return;
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setError('Erro ao acessar o microfone. Verifique se não está sendo usado por outro aplicativo.');
          return;
        } else {
          throw err;
        }
      }

      // Verificar se MediaRecorder está disponível
      if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        // Fallback para outros formatos
        const mimeTypes = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/ogg;codecs=opus',
          'audio/mp4',
        ];
        
        let supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
        if (!supportedMimeType) {
          setError('Formato de áudio não suportado neste navegador');
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: supportedMimeType,
        });

        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          try {
            const audioBlob = new Blob(audioChunksRef.current, { type: supportedMimeType || 'audio/webm' });
            
            // Enviar para API de STT
            const formData = new FormData();
            formData.append('audio', audioBlob, `recording.${supportedMimeType?.split('/')[1]?.split(';')[0] || 'webm'}`);

            const response = await fetch('/api/stt', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              throw new Error('Erro ao processar áudio');
            }

            const data = await response.json();
            if (data.text) {
              onTextReceived?.(data.text);
            } else {
              setError('Não foi possível transcrever o áudio. Tente novamente.');
            }
          } catch (err) {
            console.error('Erro ao processar áudio:', err);
            setError(err instanceof Error ? err.message : 'Erro ao processar áudio');
          } finally {
            // Parar todas as tracks
            stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            setIsListening(false);
          }
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
        setIsListening(true);
      } else {
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus',
        });

        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            
            // Enviar para API de STT
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            const response = await fetch('/api/stt', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              throw new Error('Erro ao processar áudio');
            }

            const data = await response.json();
            if (data.text) {
              onTextReceived?.(data.text);
            } else {
              setError('Não foi possível transcrever o áudio. Tente novamente.');
            }
          } catch (err) {
            console.error('Erro ao processar áudio:', err);
            setError(err instanceof Error ? err.message : 'Erro ao processar áudio');
          } finally {
            // Parar todas as tracks
            stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            setIsListening(false);
          }
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
        setIsListening(true);
      }
    } catch (err) {
      console.error('Erro ao iniciar gravação:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao acessar microfone';
      
      // Mensagens mais específicas
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        setError('Permissão de microfone negada. Clique no ícone de cadeado na barra de endereços e permita o acesso ao microfone.');
      } else if (errorMessage.includes('NotFoundError')) {
        setError('Nenhum microfone encontrado. Verifique se o microfone está conectado.');
      } else {
        setError(errorMessage);
      }
      
      setIsRecording(false);
      setIsListening(false);
    }
  }, [sttEnabled, isRecording, onTextReceived, checkMicrophonePermission]);

  /**
   * Parar gravação de voz
   */
  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, [isRecording]);

  /**
   * Toggle gravação
   */
  const toggleListening = useCallback(() => {
    if (isRecording) {
      stopListening();
    } else {
      startListening();
    }
  }, [isRecording, startListening, stopListening]);

  return {
    // TTS
    speak,
    stopSpeaking,
    isSpeaking,
    
    // STT
    startListening,
    stopListening,
    toggleListening,
    isRecording,
    isListening,
    
    // Estado
    error,
  };
}


