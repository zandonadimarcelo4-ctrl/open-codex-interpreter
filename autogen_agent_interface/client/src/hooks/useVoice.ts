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
  const isStartingRef = useRef<boolean>(false); // Flag para evitar múltiplas chamadas simultâneas

  // Inicializar áudio element
  useEffect(() => {
    audioElementRef.current = new Audio();
    audioElementRef.current.onended = () => setIsSpeaking(false);
    audioElementRef.current.onerror = () => {
      // Só logar erro se for um erro real
      if (audioElementRef.current?.error) {
        const errorCode = audioElementRef.current.error.code;
        // Ignorar erros comuns que não são críticos
        // MEDIA_ERR_ABORTED = 1 (usuário cancelou)
        if (errorCode !== 1) {
          console.warn('[TTS] Erro no elemento de áudio (código', errorCode, ')');
          setError('Erro ao reproduzir áudio');
        }
      }
      setIsSpeaking(false);
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
            // Só logar erro se for um erro real (não apenas um evento)
            if (newAudioElement.error) {
              const errorCode = newAudioElement.error.code;
              const errorMessage = newAudioElement.error.message;
              
              // Ignorar erros comuns que não são críticos
              // MEDIA_ERR_ABORTED = 1 (usuário cancelou)
              if (errorCode === 1) {
                // Usuário cancelou - não é um erro real
                console.log('[TTS] Reprodução cancelada pelo usuário');
                setIsSpeaking(false);
                hasPlayed = false;
                URL.revokeObjectURL(audioUrl);
                return;
              }
              
              // Logar apenas erros reais
              console.error(`[TTS] Erro no elemento de áudio (código ${errorCode}):`, errorMessage);
              setIsSpeaking(false);
              hasPlayed = false;
              const errorMsg = errorMessage || 'Erro ao reproduzir áudio. Verifique se o formato de áudio é suportado.';
              setError(errorMsg);
            } else {
              // Se não houver erro específico, apenas limpar
              console.log('[TTS] Evento de erro sem detalhes - ignorando');
              setIsSpeaking(false);
              hasPlayed = false;
            }
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
        const errorMsg = 'API de mídia não suportada neste navegador. Use um navegador moderno (Chrome, Firefox, Safari, Edge).';
        console.error('[STT]', errorMsg);
        setError(errorMsg);
        return false;
      }

      // Tentar verificar permissão via API (pode não estar disponível em todos os navegadores)
      try {
        // Em alguns navegadores, a API de permissões pode não estar disponível
        if ('permissions' in navigator && 'query' in navigator.permissions) {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          console.log('[STT] Status de permissão:', permissionStatus.state);
          
          if (permissionStatus.state === 'denied') {
            const errorMsg = 'Permissão de microfone negada. Clique no ícone de cadeado na barra de endereços e permita o acesso ao microfone.';
            console.error('[STT]', errorMsg);
            setError(errorMsg);
            return false;
          }
          
          // Se a permissão já foi concedida, retornar true
          if (permissionStatus.state === 'granted') {
            console.log('[STT] ✅ Permissão já concedida');
            return true;
          }
          
          // Se for 'prompt', continuar para solicitar permissão
          if (permissionStatus.state === 'prompt') {
            console.log('[STT] Permissão ainda não solicitada, solicitando...');
          }
        } else {
          console.log('[STT] API de permissões não disponível, tentando acessar diretamente...');
        }
      } catch (permErr) {
        // Se não conseguir verificar permissão (navegador não suporta), tentar acessar diretamente
        console.log('[STT] Não foi possível verificar permissão via API, tentando acessar diretamente...', permErr);
      }

      // Tentar acessar o microfone diretamente para verificar/solicitar permissão
      // Isso vai solicitar permissão se ainda não foi concedida
      console.log('[STT] Tentando acessar microfone...');
      try {
        const testStream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            echoCancellation: true, 
            noiseSuppression: true, 
            autoGainControl: true 
          } 
        });
        // Se chegou aqui, a permissão foi concedida
        console.log('[STT] ✅ Permissão concedida! Parando stream de teste...');
        testStream.getTracks().forEach(track => {
          track.stop();
          console.log('[STT] Track parado:', track.label);
        });
        return true;
      } catch (err: any) {
        console.error('[STT] Erro ao acessar microfone (checkMicrophonePermission):', err.name, err.message, err);
        const errorMessage = err.message || err.toString();
        const errorName = err.name || '';
        const errorStack = err.stack || '';
        
        // Detectar bloqueio do sistema operacional (Windows)
        const isSystemBlock = errorMessage.includes('by system') || 
                              errorMessage.includes('Permission denied by system') ||
                              errorMessage.includes('system-level') ||
                              (errorName === 'NotAllowedError' && errorMessage.toLowerCase().includes('system')) ||
                              (errorName === 'NotAllowedError' && errorStack.includes('system'));
        
        if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
          if (isSystemBlock) {
            // Bloqueio do sistema operacional Windows
            const systemErrorMsg = '🚫 Microfone bloqueado pelo sistema operacional Windows\n\n' +
              '📋 INSTRUÇÕES PARA RESOLVER:\n\n' +
              '1. Pressione Win + I para abrir Configurações do Windows\n' +
              '2. Vá em "Privacidade e Segurança" > "Microfone"\n' +
              '3. Ative "Acesso ao microfone para este dispositivo"\n' +
              '4. Ative "Permitir que aplicativos acessem seu microfone"\n' +
              '5. Ative "Permitir que aplicativos da área de trabalho acessem seu microfone"\n' +
              '6. Verifique se o navegador (Chrome/Edge/Firefox) está na lista de aplicativos permitidos\n' +
              '7. Se o navegador não estiver na lista, adicione manualmente ou reinicie o navegador\n' +
              '8. Recarregue esta página (F5) após fazer as alterações\n\n' +
              '💡 DICA: Se ainda não funcionar, tente reiniciar o navegador completamente.\n' +
              '💡 DICA: Verifique também as configurações de privacidade do navegador.';
            setError(systemErrorMsg);
            console.error('[STT] ❌ Bloqueio do sistema operacional detectado (checkMicrophonePermission):', errorMessage);
          } else {
            // Bloqueio pelo navegador
            const browserErrorMsg = '🚫 Permissão de microfone negada pelo navegador\n\n' +
              '📋 INSTRUÇÕES PARA RESOLVER:\n\n' +
              '1. Clique no ícone de cadeado (🔒) na barra de endereços (à esquerda da URL)\n' +
              '2. Procure a opção "Microfone" ou "Microphone"\n' +
              '3. Selecione "Permitir" ou "Allow"\n' +
              '4. Se não houver opção de "Permitir", clique em "Redefinir permissões" e tente novamente\n' +
              '5. Recarregue a página (F5)\n\n' +
              '💡 DICA: Se ainda não funcionar, verifique as configurações do navegador:\n' +
              '   - Chrome/Edge: Configurações > Privacidade e segurança > Configurações do site > Microfone\n' +
              '   - Firefox: Configurações > Privacidade e Segurança > Permissões > Microfone';
            setError(browserErrorMsg);
            console.error('[STT] ❌ Bloqueio do navegador detectado (checkMicrophonePermission):', errorMessage);
          }
          return false;
        } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
          const notFoundMsg = '🎤 Nenhum microfone encontrado\n\n' +
            '📋 VERIFICAÇÕES:\n\n' +
            '1. Verifique se o microfone está conectado ao computador\n' +
            '2. Verifique se o microfone está funcionando no Windows:\n' +
            '   - Abra Configurações do Windows (Win + I)\n' +
            '   - Vá em "Sistema" > "Som"\n' +
            '   - Teste o microfone no painel de som\n' +
            '3. Verifique se o microfone não está desabilitado:\n' +
            '   - Clique com botão direito no ícone de som na barra de tarefas\n' +
            '   - Selecione "Configurações de som"\n' +
            '   - Verifique se o microfone está ativo\n' +
            '4. Se estiver usando um headset USB, desconecte e reconecte\n' +
            '5. Reinicie o navegador após conectar o microfone';
          setError(notFoundMsg);
          console.error('[STT] ❌ Microfone não encontrado (checkMicrophonePermission):', errorMessage);
          return false;
        } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
          const notReadableMsg = '⚠️ Erro ao acessar o microfone\n\n' +
            '📋 POSSÍVEIS CAUSAS:\n\n' +
            '1. O microfone está sendo usado por outro aplicativo:\n' +
            '   - Feche outros aplicativos que usam o microfone (Teams, Zoom, Discord, etc.)\n' +
            '   - Verifique se algum aplicativo está usando o microfone no Gerenciador de Tarefas\n' +
            '2. O driver do microfone pode estar com problemas:\n' +
            '   - Abra o Gerenciador de Dispositivos (Win + X > Gerenciador de Dispositivos)\n' +
            '   - Verifique se há problemas com o dispositivo de áudio\n' +
            '   - Tente atualizar o driver do microfone\n' +
            '3. O microfone pode estar com problemas de hardware:\n' +
            '   - Teste o microfone em outro aplicativo (Gravador de Voz do Windows)\n' +
            '   - Se não funcionar em outros aplicativos, pode ser problema de hardware\n' +
            '4. Reinicie o navegador e tente novamente';
          setError(notReadableMsg);
          console.error('[STT] ❌ Microfone não legível (checkMicrophonePermission):', errorMessage);
          return false;
        }
        throw err; // Re-lançar outros erros
      }
    } catch (err) {
      console.error('[STT] Erro ao verificar permissão:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorName = err instanceof Error ? (err as any).name : '';
      
      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError' || errorMessage.includes('Permission denied')) {
        const errorMsg = 'Permissão de microfone negada. Clique no ícone de cadeado na barra de endereços e permita o acesso ao microfone.';
        setError(errorMsg);
        return false;
      } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
        const errorMsg = 'Nenhum microfone encontrado. Verifique se o microfone está conectado.';
        setError(errorMsg);
        return false;
      } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
        const errorMsg = 'Erro ao acessar o microfone. Verifique se não está sendo usado por outro aplicativo.';
        setError(errorMsg);
        return false;
      }
      // Se não for erro conhecido, tentar mesmo assim (pode ser um erro temporário)
      console.warn('[STT] Erro desconhecido, tentando mesmo assim:', err);
      return true;
    }
  }, []);

  /**
   * Iniciar gravação de voz (STT)
   */
  const startListening = useCallback(async () => {
    // Proteção contra múltiplas chamadas simultâneas
    if (!sttEnabled) {
      console.log('[STT] ⚠️ STT desabilitado, ignorando');
      setError('STT está desabilitado');
      return;
    }
    
    if (isRecording) {
      console.log('[STT] ⚠️ Gravação já em andamento, ignorando chamada duplicada');
      return;
    }
    
    if (isStartingRef.current) {
      console.log('[STT] ⚠️ Gravação já está iniciando, ignorando chamada duplicada');
      return;
    }

    try {
      isStartingRef.current = true; // Marcar que está iniciando
      setError(null);
      console.log('[STT] 🎙️ Iniciando gravação...');

      // Verificar permissão primeiro (mas não bloquear se não conseguir verificar)
      try {
        const hasPermission = await checkMicrophonePermission();
        if (!hasPermission) {
          console.warn('[STT] ⚠️ Permissão não concedida após verificação');
          // Não retornar aqui - tentar acessar diretamente pode solicitar permissão ou retornar erro mais específico
        } else {
          console.log('[STT] ✅ Permissão verificada e concedida');
        }
      } catch (permErr) {
        console.warn('[STT] ⚠️ Erro ao verificar permissão, tentando acessar diretamente:', permErr);
        // Continuar mesmo se a verificação de permissão falhar - tentar acessar diretamente
      }

      // Solicitar acesso ao microfone
      // IMPORTANTE: Tentar primeiro sem especificar dispositivo (método mais compatível)
      let stream: MediaStream;
      try {
        console.log('[STT] Solicitando acesso ao microfone (método padrão)...');
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          } 
        });
        console.log('[STT] ✅ Acesso ao microfone concedido');
        
        // Listar dispositivos após obter permissão (para debug)
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioInputs = devices.filter(device => device.kind === 'audioinput');
          const activeTracks = stream.getAudioTracks();
          if (activeTracks.length > 0) {
            console.log('[STT] Dispositivo ativo:', activeTracks[0].label);
          }
          console.log('[STT] Dispositivos de áudio disponíveis:', audioInputs.map(d => ({ label: d.label, kind: d.kind })));
        } catch (enumErr) {
          console.warn('[STT] Não foi possível listar dispositivos:', enumErr);
        }
      } catch (err: any) {
        console.error('[STT] Erro ao acessar microfone:', err.name, err.message, err);
        const errorMessage = err.message || err.toString();
        const errorName = err.name || '';
        const errorStack = err.stack || '';
        
        // Detectar bloqueio do sistema operacional (Windows)
        // O erro "Permission denied by system" geralmente indica bloqueio do Windows
        const isSystemBlock = errorMessage.includes('by system') || 
                              errorMessage.includes('Permission denied by system') ||
                              errorMessage.includes('system-level') ||
                              (errorName === 'NotAllowedError' && errorMessage.toLowerCase().includes('system')) ||
                              (errorName === 'NotAllowedError' && errorStack.includes('system'));
        
        // Tratar erros específicos
        if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
          if (isSystemBlock) {
            // Bloqueio do sistema operacional Windows
            const systemErrorMsg = '🚫 Microfone bloqueado pelo sistema operacional Windows\n\n' +
              '📋 INSTRUÇÕES PARA RESOLVER:\n\n' +
              '1. Pressione Win + I para abrir Configurações do Windows\n' +
              '2. Vá em "Privacidade e Segurança" > "Microfone"\n' +
              '3. Ative "Acesso ao microfone para este dispositivo"\n' +
              '4. Ative "Permitir que aplicativos acessem seu microfone"\n' +
              '5. Ative "Permitir que aplicativos da área de trabalho acessem seu microfone"\n' +
              '6. Verifique se o navegador (Chrome/Edge/Firefox) está na lista de aplicativos permitidos\n' +
              '7. Se o navegador não estiver na lista, adicione manualmente ou reinicie o navegador\n' +
              '8. Recarregue esta página (F5) após fazer as alterações\n\n' +
              '💡 DICA: Se ainda não funcionar, tente reiniciar o navegador completamente.\n' +
              '💡 DICA: Verifique também as configurações de privacidade do navegador.';
            setError(systemErrorMsg);
            console.error('[STT] ❌ Bloqueio do sistema operacional detectado:', errorMessage);
          } else {
            // Bloqueio pelo navegador
            const browserErrorMsg = '🚫 Permissão de microfone negada pelo navegador\n\n' +
              '📋 INSTRUÇÕES PARA RESOLVER:\n\n' +
              '1. Clique no ícone de cadeado (🔒) na barra de endereços (à esquerda da URL)\n' +
              '2. Procure a opção "Microfone" ou "Microphone"\n' +
              '3. Selecione "Permitir" ou "Allow"\n' +
              '4. Se não houver opção de "Permitir", clique em "Redefinir permissões" e tente novamente\n' +
              '5. Recarregue a página (F5)\n\n' +
              '💡 DICA: Se ainda não funcionar, verifique as configurações do navegador:\n' +
              '   - Chrome/Edge: Configurações > Privacidade e segurança > Configurações do site > Microfone\n' +
              '   - Firefox: Configurações > Privacidade e Segurança > Permissões > Microfone';
            setError(browserErrorMsg);
            console.error('[STT] ❌ Bloqueio do navegador detectado:', errorMessage);
          }
          return;
        } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
          const notFoundMsg = '🎤 Nenhum microfone encontrado\n\n' +
            '📋 VERIFICAÇÕES:\n\n' +
            '1. Verifique se o microfone está conectado ao computador\n' +
            '2. Verifique se o microfone está funcionando no Windows:\n' +
            '   - Abra Configurações do Windows (Win + I)\n' +
            '   - Vá em "Sistema" > "Som"\n' +
            '   - Teste o microfone no painel de som\n' +
            '3. Verifique se o microfone não está desabilitado:\n' +
            '   - Clique com botão direito no ícone de som na barra de tarefas\n' +
            '   - Selecione "Configurações de som"\n' +
            '   - Verifique se o microfone está ativo\n' +
            '4. Se estiver usando um headset USB, desconecte e reconecte\n' +
            '5. Reinicie o navegador após conectar o microfone';
          setError(notFoundMsg);
          console.error('[STT] ❌ Microfone não encontrado:', errorMessage);
          return;
        } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
          const notReadableMsg = '⚠️ Erro ao acessar o microfone\n\n' +
            '📋 POSSÍVEIS CAUSAS:\n\n' +
            '1. O microfone está sendo usado por outro aplicativo:\n' +
            '   - Feche outros aplicativos que usam o microfone (Teams, Zoom, Discord, etc.)\n' +
            '   - Verifique se algum aplicativo está usando o microfone no Gerenciador de Tarefas\n' +
            '2. O driver do microfone pode estar com problemas:\n' +
            '   - Abra o Gerenciador de Dispositivos (Win + X > Gerenciador de Dispositivos)\n' +
            '   - Verifique se há problemas com o dispositivo de áudio\n' +
            '   - Tente atualizar o driver do microfone\n' +
            '3. O microfone pode estar com problemas de hardware:\n' +
            '   - Teste o microfone em outro aplicativo (Gravador de Voz do Windows)\n' +
            '   - Se não funcionar em outros aplicativos, pode ser problema de hardware\n' +
            '4. Reinicie o navegador e tente novamente';
          setError(notReadableMsg);
          console.error('[STT] ❌ Microfone não legível:', errorMessage);
          return;
        } else if (errorName === 'OverconstrainedError' || errorMessage.includes('constraint')) {
          setError('⚠️ Configurações de áudio não suportadas. Tentando com configurações mais simples...');
          console.warn('[STT] ⚠️ Configurações não suportadas, tentando novamente com configurações padrão');
          // Tentar novamente com configurações mais simples
          setTimeout(() => {
            startListening();
          }, 500);
          return;
        } else {
          // Erro desconhecido - fornecer informações detalhadas
          const unknownErrorMsg = `❌ Erro ao acessar microfone: ${errorName || 'Erro desconhecido'}\n\n` +
            `💬 Detalhes: ${errorMessage}\n\n` +
            '📋 TENTE:\n\n' +
            '1. Recarregue a página (F5)\n' +
            '2. Verifique se o microfone está funcionando no Windows\n' +
            '3. Verifique as permissões do navegador e do Windows\n' +
            '4. Reinicie o navegador\n' +
            '5. Se o problema persistir, verifique os logs do console (F12)';
          setError(unknownErrorMsg);
          console.error('[STT] ❌ Erro desconhecido:', err);
          return;
        }
      }

      // Verificar formato de áudio suportado
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/mpeg',
      ];
      
      let supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
      if (!supportedMimeType) {
        // Se nenhum formato específico for suportado, tentar criar sem especificar (navegador escolhe)
        console.warn('[STT] Nenhum formato específico suportado, usando formato padrão do navegador');
        supportedMimeType = undefined; // Deixar navegador escolher
      } else {
        console.log(`[STT] Usando formato: ${supportedMimeType}`);
      }

      // Criar MediaRecorder com formato suportado (ou formato padrão)
      const mediaRecorder = new MediaRecorder(stream, supportedMimeType ? {
        mimeType: supportedMimeType,
      } : undefined);

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log(`[STT] Dados de áudio recebidos: ${event.data.size} bytes`);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('[STT] Erro no MediaRecorder:', event);
        setError('Erro ao gravar áudio. Tente novamente.');
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setIsListening(false);
        isStartingRef.current = false;
      };

      mediaRecorder.onstop = async () => {
        try {
          console.log(`[STT] Gravação parada. Total de chunks: ${audioChunksRef.current.length}`);
          
          // Determinar tipo MIME do blob
          const blobType = supportedMimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: blobType });
          
          console.log(`[STT] Blob criado: ${audioBlob.size} bytes, tipo: ${blobType}`);
          
          if (audioBlob.size === 0) {
            throw new Error('Áudio vazio. Tente falar mais alto ou verifique o microfone.');
          }
          
          // Enviar para API de STT
          const formData = new FormData();
          const fileExtension = blobType.includes('webm') ? 'webm' : 
                                blobType.includes('ogg') ? 'ogg' : 
                                blobType.includes('mp4') || blobType.includes('mpeg') ? 'mp4' : 'webm';
          formData.append('audio', audioBlob, `recording.${fileExtension}`);

          console.log(`[STT] Enviando áudio para API: ${audioBlob.size} bytes`);
          const response = await fetch('/api/stt', {
            method: 'POST',
            body: formData,
          });

          console.log(`[STT] Resposta recebida: status=${response.status}, ok=${response.ok}`);

          if (!response.ok) {
            let errorMessage = 'Erro ao processar áudio';
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorData.details || errorMessage;
              console.error(`[STT] ❌ Erro da API:`, errorData);
            } catch {
              try {
                const errorText = await response.text();
                errorMessage = errorText || errorMessage;
                console.error(`[STT] ❌ Erro da API (texto):`, errorText);
              } catch {
                console.error(`[STT] ❌ Erro desconhecido da API`);
              }
            }
            throw new Error(errorMessage);
          }

          const data = await response.json();
          console.log(`[STT] ✅ Dados recebidos:`, data);
          
          if (data.text && data.text.trim()) {
            // Verificar se não é mensagem de "não implementado" ou erro de dependência
            if (data.text.includes('ainda não implementada') || 
                data.text.includes('ainda não implementado') ||
                data.error === 'STT não disponível') {
              const errorMsg = data.solution 
                ? `STT não disponível. ${data.suggestion || 'Instale as dependências do STT.'}`
                : 'STT ainda não está completamente implementado. Use texto por enquanto.';
              setError(errorMsg);
              console.warn('[STT] ⚠️ STT não disponível:', data);
            } else {
              console.log(`[STT] ✅ Texto transcrito: "${data.text}"`);
              onTextReceived?.(data.text);
              setError(null); // Limpar erro se sucesso
            }
          } else if (data.error) {
            // Se houver erro na resposta, mostrar mensagem amigável
            const errorMsg = data.suggestion || data.details || data.error || 'Erro ao processar áudio';
            setError(errorMsg);
            console.error('[STT] ❌ Erro na resposta:', data);
          } else {
            setError('Não foi possível transcrever o áudio. Tente novamente.');
            console.warn('[STT] ⚠️ Resposta vazia ou sem texto');
          }
        } catch (err) {
          console.error('❌ Erro ao processar áudio:', err);
          const errorMessage = err instanceof Error ? err.message : 'Erro ao processar áudio';
          setError(errorMessage);
        } finally {
          // Parar todas as tracks
          stream.getTracks().forEach(track => {
            track.stop();
            console.log('[STT] Track parado:', track.label);
          });
          setIsRecording(false);
          setIsListening(false);
          isStartingRef.current = false; // Resetar flag
        }
      };

      // Iniciar gravação
      console.log('[STT] Iniciando gravação...');
      mediaRecorder.start(1000); // Coletar dados a cada 1 segundo
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setIsListening(true);
      isStartingRef.current = false; // Marcar que iniciou com sucesso
      setError(null); // Limpar erros anteriores
    } catch (err) {
      console.error('❌ Erro ao iniciar gravação:', err);
      isStartingRef.current = false; // Resetar flag em caso de erro
      
      const errorMessage = err instanceof Error ? err.message : 'Erro ao acessar microfone';
      const errorName = err instanceof Error ? (err as any).name : '';
      
      // Mensagens mais específicas baseadas no tipo de erro
      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError' || errorMessage.includes('Permission denied')) {
        setError('Permissão de microfone negada. Clique no ícone de cadeado na barra de endereços e permita o acesso ao microfone.');
      } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError' || errorMessage.includes('No microphone')) {
        setError('Nenhum microfone encontrado. Verifique se o microfone está conectado e funcionando.');
      } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError' || errorMessage.includes('not readable')) {
        setError('Erro ao acessar o microfone. Verifique se não está sendo usado por outro aplicativo.');
      } else if (errorName === 'OverconstrainedError' || errorMessage.includes('constraint')) {
        setError('Configurações de áudio não suportadas. Tentando com configurações padrão...');
        // Tentar novamente com configurações mais simples
        setTimeout(() => {
          startListening();
        }, 500);
        return;
      } else {
        setError(`Erro ao acessar microfone: ${errorMessage}`);
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
    setError, // Expor setError para poder limpar erros manualmente
  };
}


