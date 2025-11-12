import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Plus, Paperclip, Mic, Copy, Check, Volume2, VolumeX, Loader2, Image as ImageIcon, Code, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Streamdown } from 'streamdown';
import { trpc } from '@/lib/trpc';
import { detectIntent, extractEntities, type IntentResult } from '@/utils/intentDetector';
import { useWebSocket, type WebSocketMessage } from '@/hooks/useWebSocket';
import { useVoice } from '@/hooks/useVoice';
import { useOCR } from '@/hooks/useOCR';
import { useImageAnalysis } from '@/hooks/useImageAnalysis';
import { useCodeExecution } from '@/hooks/useCodeExecution';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useIsMobile } from '@/hooks/useMobile';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agentName?: string;
  isStreaming?: boolean;
  intent?: IntentResult;
  agents?: string[]; // Agentes AutoGen trabalhando
  images?: string[]; // URLs de imagens anexadas
  codeBlocks?: Array<{ language: string; code: string; result?: string }>; // Blocos de código executados
}

interface AdvancedChatInterfaceProps {
  onNewChat?: () => void;
}

export function AdvancedChatInterface({ onNewChat }: AdvancedChatInterfaceProps = {}) {
  const isMobile = useIsMobile(); // Detecção automática de mobile
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '# Bem-vindo ao AutoGen Super Agent!\n\nSou seu assistente de IA colaborativo com **detecção de intenção inteligente** e **voz estilo Jarvis**.\n\n**Funcionalidades:**\n- 💬 **Chat em Tempo Real** - WebSocket para respostas instantâneas\n- 🎤 **Voz Jarvis (TTS)** - Respostas com voz realista e futurista\n- 🎙️ **Speech-to-Text (STT)** - Entrada de voz\n- 🤖 **AutoGen Framework** - Orquestra todos os agentes\n- 🔧 **Detecção de Intenção** - Sabe quando conversar vs agir\n- 💾 **ChromaDB** - Memória persistente\n\n**Como usar:**\n- Para conversar: "O que é Python?" ou "Como funciona?"\n- Para ação: "Crie um arquivo..." ou "Execute o código..."\n- Para comando: "Faça isso..." ou "Rode o script..."\n- Use o botão 🎤 para falar ao invés de digitar\n\nComo posso ajudá-lo?',
      timestamp: new Date(),
      agentName: 'Super Agent',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false); // Estado para indicar que o modelo está "pensando"
  const [thinkingStartTime, setThinkingStartTime] = useState<number | null>(null); // Timestamp do início do "pensamento"
  const [thinkingDuration, setThinkingDuration] = useState<number | null>(null); // Duração do "pensamento" em segundos
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<number | undefined>();
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('Conectando...');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false); // Flag para evitar tentativas repetidas
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // tRPC mutations
  const chatProcess = trpc.chat.process.useMutation();
  
  // Efeitos sonoros
  const sounds = useSoundEffects(true);
  
  // WebSocket para chat em tempo real
  // IMPORTANTE: Conecta diretamente ao backend Python na porta 8000
  // O backend Python agora gerencia WebSocket, não o servidor TypeScript
  const getWebSocketUrl = () => {
    // URL do backend Python (padrão: ws://localhost:8000/ws)
    const PYTHON_BACKEND_WS_URL = import.meta.env.VITE_PYTHON_BACKEND_WS_URL || "ws://localhost:8000/ws";
    
    // Se estiver em produção ou usando variável de ambiente, usar a URL configurada
    if (import.meta.env.VITE_PYTHON_BACKEND_WS_URL) {
      return PYTHON_BACKEND_WS_URL;
    }
    
    // Em desenvolvimento, conectar diretamente ao backend Python na porta 8000
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      // Usar porta 8000 do backend Python diretamente
      return `ws://${hostname}:8000/ws`;
    }
    
    // Fallback para localhost:8000
    return "ws://localhost:8000/ws";
  };
  
  const { isConnected, isConnecting, send: sendWebSocket } = useWebSocket({
    url: getWebSocketUrl(),
    enabled: true,
    onMessage: (message: WebSocketMessage) => {
      handleWebSocketMessage(message);
    },
    onOpen: () => {
      setConnectionStatus('Conectado');
      // Não tocar som automaticamente - só após interação do usuário
      // sounds.playSuccess(); // Som de conexão estabelecida
    },
    onError: () => {
      setConnectionStatus('Erro na conexão');
      // Não tocar som automaticamente - só após interação do usuário
      // sounds.playError(); // Som de erro
    },
    onClose: () => {
      setConnectionStatus('Desconectado');
      // Não tocar som automaticamente - só após interação do usuário
      // sounds.playNotification(); // Som de notificação
    },
  });
  
  // Atualizar status baseado no estado do WebSocket
  useEffect(() => {
    if (isConnected) {
      setConnectionStatus('Conectado');
    } else if (isConnecting) {
      setConnectionStatus('Conectando...');
    } else {
      setConnectionStatus('Desconectado');
    }
  }, [isConnected, isConnecting]);
  
  // Ref para armazenar handleSendMessage (definido antes de useVoice)
  const handleSendMessageRef = useRef<((text?: string) => Promise<void>) | null>(null);
  
  // Voz Jarvis (TTS) e Speech-to-Text (STT)
  const {
    speak,
    stopSpeaking,
    isSpeaking,
    toggleListening,
    isRecording,
    isListening,
    error: voiceError,
    setError: setVoiceError, // Expor setError para poder limpar erros manualmente
  } = useVoice({
    ttsEnabled: true,
    sttEnabled: true,
    onTextReceived: (text) => {
      setInputValue(text);
      // Usar ref para chamar handleSendMessage depois que estiver definido
      setTimeout(() => {
        if (text.trim() && handleSendMessageRef.current && !isLoading) {
          handleSendMessageRef.current(text);
        }
      }, 100);
    },
    onAudioReady: (audioUrl) => {
      // Áudio pronto para reproduzir
    },
  });

  // OCR para reconhecimento de texto em imagens
  const {
    extractText,
    isProcessing: isProcessingOCR,
    error: ocrError,
    progress: ocrProgress,
  } = useOCR({
    enabled: true,
    onTextExtracted: (text) => {
      // Adicionar texto extraído ao input
      setInputValue(prev => prev ? `${prev}\n\n[Texto da imagem]:\n${text}` : `[Texto da imagem]:\n${text}`);
    },
  });

  // Análise de imagens (multimodal)
  const {
    analyzeImage,
    isProcessing: isProcessingImageAnalysis,
    error: imageAnalysisError,
  } = useImageAnalysis({
    enabled: true,
    onObjectsDetected: (objects) => {
      const objectsText = objects.map(obj => `${obj.class} (${(obj.score * 100).toFixed(0)}%)`).join(', ');
      setInputValue(prev => prev ? `${prev}\n\n[Objetos detectados]: ${objectsText}` : `[Objetos detectados]: ${objectsText}`);
    },
  });

  // Execução de código (Open Interpreter)
  const {
    executeCode,
    executePython,
    isExecuting: isExecutingCode,
    error: codeExecutionError,
  } = useCodeExecution({
    enabled: true,
    onExecutionComplete: (result) => {
      if (result.success && result.output) {
        // Adicionar resultado da execução à última mensagem
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            return prev.map((msg, idx) => 
              idx === prev.length - 1
                ? { ...msg, codeBlocks: [...(msg.codeBlocks || []), { language: 'python', code: '', result: result.output }] }
                : msg
            );
          }
          return prev;
        });
      }
    },
  });
  
  // Processar mensagens WebSocket
  const handleWebSocketMessage = (message: WebSocketMessage) => {
    if (message.type === 'assistant' || message.type === 'stream') {
      const content = message.content || message.message || '';
      
      if (message.type === 'stream') {
        // Streaming de resposta
        setStreamingContent(prev => prev + content);
        // Quando começar a streamar, parar o "pensamento"
        if (isThinking && thinkingStartTime) {
          const duration = Math.round((Date.now() - thinkingStartTime) / 1000);
          setThinkingDuration(duration);
          setIsThinking(false);
          sounds.playReceive(); // Som de receber mensagem
        }
      } else {
        // Resposta completa
        // Calcular tempo de "pensamento"
        let thinkingTimeText = '';
        if (thinkingStartTime) {
          const duration = Math.round((Date.now() - thinkingStartTime) / 1000);
          thinkingTimeText = `\n\n*💭 Pensou na vida por ${duration} segundo${duration !== 1 ? 's' : ''}*`;
          setThinkingDuration(duration);
          setIsThinking(false);
          setThinkingStartTime(null);
        }
        
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: content + thinkingTimeText,
          timestamp: new Date(),
          agentName: message.agent || 'Super Agent',
          agents: activeAgents,
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        setStreamingContent('');
        
        // Resetar estados de loading após receber resposta completa
        setIsLoading(false);
        setIsThinking(false);
        setThinkingStartTime(null);
        
        // Efeitos sonoros
        sounds.playReceive(); // Som de receber mensagem
        sounds.playSuccess(); // Som de sucesso
        
        // Reproduzir voz Jarvis
        speak(content);
      }
    } else if (message.type === 'error') {
      // Tratar erros do WebSocket
      console.error('[WebSocket] Erro recebido:', message.message || message.content);
      sounds.playError();
      
      // Resetar estados em caso de erro
      setIsLoading(false);
      setIsThinking(false);
      setThinkingStartTime(null);
      setStreamingContent('');
      
      // Adicionar mensagem de erro
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: `❌ **Erro**: ${message.message || message.content || 'Erro desconhecido'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } else if (message.type === 'agent_update') {
      // Atualização de agentes AutoGen trabalhando
      if (message.data?.agents) {
        setActiveAgents(message.data.agents);
      }
    } else if (message.type === 'status') {
      setConnectionStatus(message.message || message.status || '');
    } else if (message.type === 'system') {
      const systemMessage: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: message.message || message.content || '',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, systemMessage]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handler para upload de imagens
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingImage(true);
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

    for (const file of imageFiles) {
      try {
        // Criar URL da imagem
        const imageUrl = URL.createObjectURL(file);
        setAttachedImages(prev => [...prev, imageUrl]);

        // Processar OCR e análise de imagem em paralelo
        const [ocrText, detectedObjects] = await Promise.all([
          extractText(file).catch(() => ''),
          analyzeImage(file).catch(() => []),
        ]);

        // Adicionar informações extraídas ao input
        let extractedInfo = '';
        if (ocrText) {
          extractedInfo += `[Texto da imagem]:\n${ocrText}\n\n`;
        }
        if (detectedObjects.length > 0) {
          const objectsText = detectedObjects.map(obj => `${obj.class} (${(obj.score * 100).toFixed(0)}%)`).join(', ');
          extractedInfo += `[Objetos detectados]: ${objectsText}\n\n`;
        }

        if (extractedInfo) {
          setInputValue(prev => prev ? `${prev}\n\n${extractedInfo}` : extractedInfo);
          sounds.playSuccess(); // Som de sucesso ao processar imagem
        }
      } catch (error) {
        sounds.playError(); // Som de erro
        console.error('Erro ao processar imagem:', error);
      }
    }

    setIsProcessingImage(false);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  // Handler para upload de arquivos
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Por enquanto, apenas processar imagens
    // Em produção, adicionar suporte a outros tipos de arquivo
    handleImageUpload(event);
  };

  const copyToClipboard = (text: string, id: string) => {
    sounds.playCopy(); // Som de copiar
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = useCallback(async (text?: string) => {
    const messageText = text || inputValue;
    if (!messageText.trim()) {
      console.log('[Chat] Mensagem vazia, não enviando');
      return;
    }
    if (isLoading) {
      console.log('[Chat] Já está carregando, não enviando');
      return;
    }
    if (isRecording) {
      console.log('[Chat] Está gravando, não enviando');
      return;
    }

    // Detectar intenção no frontend (feedback visual imediato)
    const intent = detectIntent(messageText);
    const entities = extractEntities(messageText);
    
    // Extrair blocos de código da mensagem usando regex
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const codeBlocks: Array<{ language: string; code: string }> = [];
    let match;
    while ((match = codeBlockRegex.exec(messageText)) !== null) {
      codeBlocks.push({
        language: match[1] || 'python',
        code: match[2].trim(),
      });
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      intent,
      images: attachedImages.length > 0 ? [...attachedImages] : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Limpar imagens anexadas após enviar
    if (attachedImages.length > 0) {
      attachedImages.forEach(url => URL.revokeObjectURL(url));
      setAttachedImages([]);
    }
    const currentInput = messageText;
    if (!text) {
      setInputValue('');
    }
    setIsLoading(true);
    setIsThinking(true); // Modelo está "pensando" (gerando thinking tokens)
    setThinkingStartTime(Date.now()); // Iniciar timer do "pensamento"
    setThinkingDuration(null); // Resetar duração anterior
    setStreamingContent('');
    setActiveAgents([]);
    
    // Efeitos sonoros
    sounds.playSend(); // Som de enviar mensagem
    sounds.playThinking(); // Som de pensando

    // Se houver código e for ação/comando, executar código primeiro
    if (codeBlocks.length > 0 && (intent.type === 'action' || intent.type === 'command')) {
      try {
        sounds.playProcessing(); // Som de processando código
        // Executar código automaticamente
        const executionResults = await Promise.all(
          codeBlocks.map(block => executeCode(block.code, block.language))
        );

        // Adicionar resultados da execução à mensagem
        const codeOutput = executionResults
          .map((result, idx) => {
            const lang = (result as any).language || codeBlocks[idx]?.language || 'python';
            if (result.success) {
              return `\n\n**✅ Código ${idx + 1} executado (${lang}):**\n\`\`\`\n${result.output || ''}\n\`\`\``;
            } else {
              return `\n\n**❌ Erro na execução ${idx + 1} (${lang}):**\n\`\`\`\n${result.error || 'Erro desconhecido'}\n\`\`\``;
            }
          })
          .join('\n');

        // Adicionar resultado ao input para enviar junto
        setInputValue(prev => prev + codeOutput);
        sounds.playSuccess(); // Som de sucesso ao executar código
      } catch (error) {
        console.warn('Erro ao executar código:', error);
        sounds.playError(); // Som de erro
      }
    }

    // Tentar usar WebSocket primeiro (chat em tempo real)
    if (isConnected) {
      try {
        console.log('[Chat] Enviando via WebSocket:', currentInput.substring(0, 50));
        sendWebSocket({
          type: 'text',
          message: currentInput,
        });
        // WebSocket vai processar e enviar resposta via handleWebSocketMessage
        // Os estados serão resetados em handleWebSocketMessage quando a resposta chegar
        
        // Timeout de segurança: se não receber resposta em 30s, resetar estados
        setTimeout(() => {
          if (isLoading) {
            console.warn('[Chat] Timeout ao aguardar resposta do WebSocket, resetando estados');
            setIsLoading(false);
            setIsThinking(false);
            setThinkingStartTime(null);
            setStreamingContent('');
          }
        }, 30000);
        
        return;
      } catch (error) {
        console.warn('[Chat] Erro ao enviar via WebSocket, usando tRPC:', error);
        // Resetar estados em caso de erro no WebSocket
        setIsLoading(false);
        setIsThinking(false);
        setThinkingStartTime(null);
        setStreamingContent('');
      }
    } else {
      console.log('[Chat] WebSocket não conectado, usando tRPC');
    }

    // Fallback: usar tRPC
    try {
      // Chamar backend real com tRPC
      const result = await chatProcess.mutateAsync({
        message: currentInput,
        conversationId,
      });

      // Atualizar conversationId se foi criada uma nova
      if (result.conversationId && !conversationId) {
        setConversationId(result.conversationId);
      }

      // Adicionar mensagem de resposta
      const assistantMessage: Message = {
        id: result.messageId.toString(),
        role: 'assistant',
        content: result.content,
        timestamp: new Date(),
        agentName: result.agentName,
        intent: result.intent as IntentResult,
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Reproduzir voz Jarvis
      speak(result.content);
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      
      // Efeito sonoro de erro
      sounds.playError();
      
      // Fallback: usar detecção de intenção local
      let fallbackResponse: string;
      let fallbackAgentName = 'Super Agent';
      
      if (intent.type === 'action' || intent.type === 'command') {
        fallbackResponse = `🔧 **Ação Detectada** (Modo Offline)\n\n` +
          `**Tipo**: ${intent.actionType || 'execução'}\n` +
          `**Confiança**: ${(intent.confidence * 100).toFixed(0)}%\n` +
          `**Razão**: ${intent.reason}\n\n` +
          `⚠️ Backend não disponível. Em modo offline, não posso executar ações.\n\n` +
          `**Sua mensagem**: "${currentInput}"\n\n` +
          `Para executar ações, certifique-se de que o backend está rodando.`;
        fallbackAgentName = 'Executor Agent (Offline)';
      } else if (intent.type === 'question') {
        fallbackResponse = `💬 **Pergunta Detectada** (Modo Offline)\n\n` +
          `**Sua pergunta**: "${currentInput}"\n\n` +
          `⚠️ Backend não disponível. Em modo offline, posso apenas detectar sua intenção.\n\n` +
          `**Tipo detectado**: Pergunta\n` +
          `**Confiança**: ${(intent.confidence * 100).toFixed(0)}%\n\n` +
          `Para respostas completas, certifique-se de que o backend está rodando.`;
        fallbackAgentName = 'Assistant Agent (Offline)';
      } else {
        fallbackResponse = `💭 **Conversa Detectada** (Modo Offline)\n\n` +
          `**Sua mensagem**: "${currentInput}"\n\n` +
          `⚠️ Backend não disponível. Em modo offline, posso apenas detectar sua intenção.\n\n` +
          `**Tipo detectado**: Conversa\n` +
          `**Confiança**: ${(intent.confidence * 100).toFixed(0)}%\n\n` +
          `Para respostas completas, certifique-se de que o backend está rodando.`;
      }

      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fallbackResponse,
        timestamp: new Date(),
        agentName: fallbackAgentName,
        intent,
      };

      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
      setIsThinking(false);
      setThinkingStartTime(null);
      setStreamingContent('');
    }
  }, [inputValue, isLoading, isRecording, isConnected, sendWebSocket, conversationId, attachedImages, sounds, executeCode, speak, chatProcess]);
  
  // Atualizar ref quando handleSendMessage mudar
  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
  }, [handleSendMessage]);

  // Função para criar novo chat
  const handleNewChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: '# Bem-vindo ao AutoGen Super Agent!\n\nSou seu assistente de IA colaborativo com **detecção de intenção inteligente** e **voz estilo Jarvis**.\n\n**Funcionalidades:**\n- 💬 **Chat em Tempo Real** - WebSocket para respostas instantâneas\n- 🎤 **Voz Jarvis (TTS)** - Respostas com voz realista e futurista\n- 🎙️ **Speech-to-Text (STT)** - Entrada de voz\n- 🤖 **AutoGen Framework** - Orquestra todos os agentes\n- 🔧 **Detecção de Intenção** - Sabe quando conversar vs agir\n- 💾 **ChromaDB** - Memória persistente\n\n**Como usar:**\n- Para conversar: "O que é Python?" ou "Como funciona?"\n- Para ação: "Crie um arquivo..." ou "Execute o código..."\n- Para comando: "Faça isso..." ou "Rode o script..."\n- Use o botão 🎤 para falar ao invés de digitar\n\nComo posso ajudá-lo?',
        timestamp: new Date(),
        agentName: 'Super Agent',
      },
    ]);
    setInputValue('');
    setConversationId(undefined);
    setStreamingContent('');
    setActiveAgents([]);
    setAttachedImages([]);
    setIsLoading(false);
    setIsThinking(false);
    setThinkingStartTime(null);
    setThinkingDuration(null);
    
    // Chamar callback se fornecido
    if (onNewChat) {
      onNewChat();
    }
    
    // Efeito sonoro
    sounds.playClick();
  };

  // Haptic feedback para mobile (vibração tátil)
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (isMobile && 'vibrate' in navigator) {
      const patterns = {
        light: 10,
        medium: 20,
        heavy: 30,
      };
      navigator.vibrate(patterns[type]);
    }
  };

  return (
    <motion.div 
      className={`flex flex-col h-full bg-background ${isMobile ? 'mobile-layout' : ''}`}
      initial={isMobile ? { opacity: 0 } : {}}
      animate={isMobile ? { opacity: 1 } : {}}
      transition={{ duration: 0.3 }}
    >
      {/* Status Bar - Premium Mobile Style */}
      {activeAgents.length > 0 && (
        <div className={`border-b border-border/50 ${isMobile ? 'p-2 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent backdrop-blur-md' : 'p-2 bg-card/50 backdrop-blur-sm'}`}>
          <div className={`flex items-center gap-2 ${isMobile ? 'text-[11px] font-medium' : 'text-xs'} text-muted-foreground flex-wrap`}>
            <Loader2 className={`${isMobile ? 'w-3 h-3' : 'w-3 h-3'} animate-spin text-primary`} />
            <span className={isMobile ? 'text-foreground/90' : ''}>{isMobile ? 'Processando...' : 'AutoGen orquestrando:'}</span>
            {!isMobile && (
              <div className="flex gap-1 flex-wrap">
                {activeAgents.map((agent) => (
                  <span key={agent} className="px-2 py-0.5 bg-primary/20 rounded-full text-primary text-xs font-medium">
                    {agent}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages Container - Premium Style */}
      <div 
        className={`flex-1 overflow-y-auto ${isMobile ? 'p-4 space-y-4' : 'p-2 sm:p-4 space-y-3 sm:space-y-4'} ${isMobile ? 'scroll-smooth' : ''}`}
        style={{
          touchAction: 'pan-y pinch-zoom',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`w-full ${isMobile ? 'max-w-[88%]' : 'max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl'} group ${
                message.role === 'user'
                  ? isMobile 
                    ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-3xl rounded-tr-sm shadow-xl shadow-primary/30 p-4'
                    : 'bg-primary text-primary-foreground rounded-lg rounded-tr-none p-3 sm:p-4'
                  : message.role === 'system'
                  ? isMobile
                    ? 'bg-muted/70 backdrop-blur-xl border border-border/50 rounded-3xl shadow-lg p-4'
                    : 'bg-muted/50 border border-border rounded-lg p-3 sm:p-4'
                  : isMobile
                    ? 'bg-card/95 backdrop-blur-xl border border-border/50 rounded-3xl rounded-tl-sm shadow-xl p-4'
                    : 'bg-card border border-border rounded-lg rounded-tl-none p-3 sm:p-4'
              } transition-all`}
            >
              {message.agentName && message.role === 'assistant' && (
                <div className={`flex items-center gap-2 ${isMobile ? 'text-sm font-bold mb-2' : 'text-xs font-semibold'} text-accent`}>
                  <span className={isMobile ? 'bg-accent/20 px-3 py-1 rounded-full' : ''}>{message.agentName}</span>
                  {!isMobile && message.agents && message.agents.length > 0 && (
                    <span className="text-muted-foreground">
                      ({message.agents.join(', ')})
                    </span>
                  )}
                </div>
              )}
              {message.intent && message.role === 'user' && !isMobile && (
                <div className="text-xs text-muted-foreground/70 mb-1">
                  {message.intent.type === 'action' && '🔧 Ação'} 
                  {message.intent.type === 'question' && '💬 Pergunta'}
                  {message.intent.type === 'conversation' && '💭 Conversa'}
                  {message.intent.type === 'command' && '⚡ Comando'}
                  {' '}
                  ({Math.round(message.intent.confidence * 100)}%)
                </div>
              )}
              
              {/* Imagens anexadas */}
              {message.images && message.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {message.images.map((imageUrl, idx) => (
                    <div key={`${message.id}-image-${idx}-${imageUrl.substring(0, 20)}`} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Anexo ${idx + 1}`}
                        className="max-w-xs max-h-48 rounded-lg object-cover border border-border"
                      />
                    </div>
                  ))}
                </div>
              )}
              
              <div className={`${isMobile ? 'text-base leading-relaxed space-y-2' : 'text-sm'} prose prose-invert max-w-none ${isMobile ? 'prose-base' : ''}`}>
                {message.role === 'assistant' ? (
                  <Streamdown>{message.content}</Streamdown>
                ) : (
                  <p className={`whitespace-pre-wrap ${isMobile ? 'leading-relaxed' : ''}`}>{message.content}</p>
                )}
              </div>

              {/* Blocos de código executados */}
              {message.codeBlocks && message.codeBlocks.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.codeBlocks.map((block, idx) => (
                    <div key={`${message.id}-code-${idx}-${block.language}`} className="bg-muted/50 rounded-lg p-3 border border-border">
                      {block.code && (
                        <div className="mb-2">
                          <div className="text-xs text-muted-foreground mb-1">Código {block.language}:</div>
                          <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                            <code>{block.code}</code>
                          </pre>
                        </div>
                      )}
                      {block.result && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Resultado:</div>
                          <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                            <code>{block.result}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className={`flex items-center justify-between ${isMobile ? 'pt-2 mt-2 border-t border-border/30' : 'pt-2'}`}>
                <span className={`text-xs text-muted-foreground ${isMobile ? 'text-muted-foreground/80' : ''}`}>
                  {message.timestamp.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {!isMobile && (
                  <div className="flex items-center gap-1">
                    {message.role === 'assistant' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                          onClick={() => {
                            sounds.playClick();
                            speak(message.content);
                          }}
                          title="Reproduzir voz Jarvis"
                        >
                          <Volume2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                          onClick={() => {
                            sounds.playClick();
                            copyToClipboard(message.content, message.id);
                          }}
                          title="Copiar mensagem"
                        >
                          {copiedId === message.id ? (
                            <Check className="w-3 h-3 text-secondary" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Streaming content */}
        {streamingContent && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-lg rounded-tl-none p-4">
              <div className="text-sm prose prose-invert max-w-none">
                <Streamdown>{streamingContent}</Streamdown>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Streaming...</span>
              </div>
            </div>
          </div>
        )}
        
        {isLoading && !streamingContent && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-lg rounded-tl-none p-4">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
                <span className="text-sm text-muted-foreground">
                  {isThinking ? 'Pensando...' : 'Processando...'}
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Imagens anexadas */}
      {attachedImages.length > 0 && (
        <div className="border-t border-border p-2 bg-card/50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Imagens anexadas:</span>
            {attachedImages.map((imageUrl, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={imageUrl}
                  alt={`Anexo ${idx + 1}`}
                  className="w-16 h-16 rounded-lg object-cover border border-border"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground"
                  onClick={() => {
                    setAttachedImages(prev => prev.filter((_, i) => i !== idx));
                    URL.revokeObjectURL(imageUrl);
                  }}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area - Premium Style com Funcionalidade */}
      <div 
        className={`border-t border-border/50 ${isMobile ? 'p-4 pb-safe bg-gradient-to-t from-card/95 via-card/98 to-card backdrop-blur-2xl shadow-[0_-8px_32px_rgba(0,0,0,0.12)]' : 'p-2 sm:p-4 bg-card'}`}
        style={{
          position: 'relative',
          zIndex: 50,
          touchAction: 'pan-y', // Permitir scroll vertical, mas manter toque responsivo nos botões
        }}
      >
        <div
          className={`flex ${isMobile ? 'flex-row gap-3 items-end' : 'flex-col sm:flex-row gap-2'}`}
          style={{
            touchAction: 'pan-y', // Permitir scroll vertical, mas manter toque nos botões
            position: 'relative',
            zIndex: 50,
            pointerEvents: 'auto',
          }}
        >
          <div className={`flex ${isMobile ? 'gap-4 items-center' : 'gap-2'}`}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="*/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <input
              ref={imageInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            {!isMobile && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                  title="Adicionar arquivo"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                  title="Anexar arquivo"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </>
            )}
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                title="Anexar imagem (OCR + Análise)"
                onClick={() => {
                  sounds.playClick();
                  imageInputRef.current?.click();
                }}
                disabled={isProcessingImage || isProcessingOCR || isProcessingImageAnalysis}
                type="button"
              >
                {isProcessingImage || isProcessingOCR || isProcessingImageAnalysis ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </Button>
            )}
            <Button
              variant={isRecording ? "default" : "ghost"}
              size="icon"
              className={`${isMobile ? 'h-16 w-16 rounded-full min-w-[64px] min-h-[64px] flex-shrink-0 shadow-lg transition-transform active:scale-90 hover:scale-105' : 'h-11 w-11'} ${isRecording ? 'bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/30' : isMobile ? 'bg-primary/10 hover:bg-primary/20 text-primary border-2 border-primary/30' : 'text-muted-foreground hover:text-foreground'}`}
              title={isRecording ? "Parar gravação" : "Entrada de voz (STT)"}
              onClick={(e) => {
                if (isLoading) {
                  e.preventDefault();
                  return;
                }
                console.log('[Mic] onClick triggered');
                triggerHaptic('medium');
                sounds.playClick();
                toggleListening();
              }}
              disabled={isLoading}
              type="button"
              style={{
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'rgba(0,0,0,0)',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 10,
                pointerEvents: 'auto',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                // Área de toque maior no mobile
                ...(isMobile && {
                  minWidth: '64px',
                  minHeight: '64px',
                  padding: '12px',
                }),
              }}
            >
              {isRecording ? (
                <Loader2 className={`${isMobile ? 'w-7 h-7' : 'w-5 h-5'} animate-spin`} />
              ) : (
                <Mic className={`${isMobile ? 'w-7 h-7' : 'w-5 h-5'}`} />
              )}
            </Button>
          </div>
          <div className="flex-1" style={{ position: 'relative', zIndex: 1, pointerEvents: 'auto', minWidth: 0 }}>
            <Input
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!isLoading && !isRecording && inputValue.trim()) {
                    handleSendMessage();
                  }
                }
              }}
              placeholder={isMobile ? (isRecording ? "Gravando..." : "Digite sua mensagem...") : (isRecording ? "Gravando... Clique no microfone para parar" : "Digite sua mensagem, anexe imagens ou use o microfone... (Shift+Enter para nova linha)")}
              className={`flex-1 ${isMobile ? 'h-16 text-base rounded-2xl bg-background/90 backdrop-blur-xl border-2 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-lg px-5 py-4 transition-all' : 'bg-background border-border text-sm sm:text-base h-11'}`}
              disabled={isLoading || isRecording || isProcessingImage}
              style={{
                touchAction: 'manipulation',
                WebkitAppearance: 'none',
                WebkitTapHighlightColor: 'rgba(0,0,0,0)',
                fontSize: isMobile ? '16px' : undefined, // Prevenir zoom no iOS (mínimo 16px)
                pointerEvents: 'auto',
                userSelect: 'text',
                WebkitUserSelect: 'text',
                // Melhorar área de toque no mobile
                ...(isMobile && {
                  minHeight: '64px',
                  paddingTop: '16px',
                  paddingBottom: '16px',
                  paddingLeft: '20px',
                  paddingRight: '20px',
                }),
              }}
            />
          </div>
          {isSpeaking && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              title="Parar voz Jarvis"
              onClick={stopSpeaking}
              type="button"
            >
              <VolumeX className="w-5 h-5" />
            </Button>
          )}
          <Button
            type="button"
            onClick={(e) => {
              if (!inputValue.trim() || isLoading || isRecording || isProcessingImage) {
                e.preventDefault();
                return;
              }
              console.log('[Send] onClick triggered');
              triggerHaptic('light');
              sounds.playClick();
              handleSendMessage();
            }}
            disabled={!inputValue.trim() || isLoading || isRecording || isProcessingImage}
            className={`${isMobile ? 'h-16 w-16 rounded-full shadow-xl shadow-primary/40 hover:shadow-primary/60 min-w-[64px] min-h-[64px] flex-shrink-0 transition-transform active:scale-90 hover:scale-105' : 'h-12 w-12'} bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isLoading ? "Processando..." : isRecording ? "Gravando..." : "Enviar mensagem"}
            style={{
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'rgba(0,0,0,0)',
              cursor: 'pointer',
              position: 'relative',
              zIndex: 10,
              pointerEvents: 'auto',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              // Área de toque maior no mobile
              ...(isMobile && {
                minWidth: '64px',
                minHeight: '64px',
                padding: '12px',
              }),
            }}
          >
            {isLoading ? (
              <Loader2 className={`${isMobile ? 'w-7 h-7' : 'w-5 h-5'} animate-spin`} />
            ) : (
              <Send className={`${isMobile ? 'w-7 h-7' : 'w-5 h-5'}`} />
            )}
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-muted-foreground">
            {isConnected ? (
              <span className="text-green-500">● Conectado</span>
            ) : isConnecting ? (
              <span className="text-yellow-500">● Conectando...</span>
            ) : (
              <span className="text-red-500">● Desconectado</span>
            )}
            {isSpeaking && (
              <span className="ml-2 text-blue-500">🎤 Voz Jarvis ativa</span>
            )}
            {isRecording && (
              <span className="ml-2 text-red-500">🎙️ Gravando...</span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Powered by AutoGen Framework
          </div>
        </div>
        {voiceError && (
          <div className="text-xs text-red-500 mt-1 flex items-center gap-2 flex-wrap">
            <span>⚠️ {voiceError}</span>
            {(voiceError.includes('Permissão') || voiceError.includes('permissão') || voiceError.includes('Permission')) && !permissionRequested && (
              <Button
                variant="ghost"
                size="sm"
                className={`${isMobile ? 'h-8 px-3 text-sm' : 'h-6 px-2 text-xs'} text-red-500 hover:text-red-600 hover:bg-red-500/10 active:scale-95 transition-all`}
                onClick={async () => {
                  try {
                    console.log('[STT] Solicitando permissão de microfone...');
                    
                    // Limpar erro antes de tentar
                    setVoiceError(null);
                    
                    // Verificar se a API está disponível
                    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                      setVoiceError('API de mídia não suportada neste navegador. Use um navegador moderno (Chrome, Firefox, Safari, Edge).');
                      return;
                    }
                    
                    // Tentar solicitar permissão novamente
                    console.log('[STT] Chamando getUserMedia para solicitar permissão...');
                    const stream = await navigator.mediaDevices.getUserMedia({ 
                      audio: { 
                        echoCancellation: true, 
                        noiseSuppression: true, 
                        autoGainControl: true 
                      } 
                    });
                    
                    console.log('[STT] ✅ Permissão concedida! Parando stream de teste...');
                    
                    // Permissão concedida - parar stream de teste imediatamente
                    stream.getTracks().forEach(track => {
                      track.stop();
                      console.log('[STT] Track parado:', track.label);
                    });
                    
                    // Limpar erro completamente
                    setVoiceError(null);
                    
                    // Aguardar um pouco antes de tentar iniciar gravação
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                    // Tentar iniciar gravação automaticamente após permissão concedida
                    console.log('[STT] Iniciando gravação após permissão concedida...');
                    toggleListening();
                  } catch (err: any) {
                    console.error('[STT] Erro ao solicitar permissão:', err);
                    
                    // Tratar erros específicos
                    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                      // Detectar navegador para dar instruções específicas
                      const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
                      const isFirefox = /Firefox/.test(navigator.userAgent);
                      const isEdge = /Edge/.test(navigator.userAgent);
                      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
                      
                      let instructions = '';
                      if (isChrome || isEdge) {
                        instructions = 'Clique no ícone de cadeado (🔒) na barra de endereços > "Permitir" para Microfone > Recarregue a página (F5)';
                      } else if (isFirefox) {
                        instructions = 'Clique no ícone de cadeado (🔒) > "Permissões" > "Usar o microfone" > "Permitir" > Recarregue a página (F5)';
                      } else if (isSafari) {
                        instructions = 'Safari > Configurações > Sites > Microfone > Permitir para este site > Recarregue a página (Cmd+R)';
                      } else {
                        instructions = 'Clique no ícone de cadeado (🔒) na barra de endereços > Permita o acesso ao microfone > Recarregue a página';
                      }
                      
                      setVoiceError(`Permissão de microfone negada. ${instructions}`);
                      setPermissionRequested(true); // Marcar como solicitada para não tentar novamente
                    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                      setVoiceError('Nenhum microfone encontrado. Verifique se há um microfone conectado.');
                      setPermissionRequested(false); // Permitir tentar novamente
                    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                      setVoiceError('Erro ao acessar o microfone. Verifique se não está sendo usado por outro aplicativo.');
                      setPermissionRequested(false); // Permitir tentar novamente
                    } else {
                      setVoiceError(`Erro ao acessar microfone: ${err.message || err.name || 'Erro desconhecido'}`);
                      setPermissionRequested(false); // Permitir tentar novamente
                    }
                  }
                }}
                type="button"
              >
                Solicitar Permissão
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

}

}

}

}

}

}

}

}

}
