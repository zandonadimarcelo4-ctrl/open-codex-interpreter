import { useState, useRef, useEffect } from 'react';
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

export function AdvancedChatInterface() {
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<number | undefined>();
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('Conectando...');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // tRPC mutations
  const chatProcess = trpc.chat.process.useMutation();
  
  // WebSocket para chat em tempo real
  const { isConnected, isConnecting, send: sendWebSocket } = useWebSocket({
    url: `ws://localhost:${import.meta.env.VITE_PORT || 3000}/ws`,
    enabled: true,
    onMessage: (message: WebSocketMessage) => {
      handleWebSocketMessage(message);
    },
    onOpen: () => {
      setConnectionStatus('Conectado');
    },
    onError: () => {
      setConnectionStatus('Erro na conexão');
    },
    onClose: () => {
      setConnectionStatus('Desconectado');
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
  
  // Voz Jarvis (TTS) e Speech-to-Text (STT)
  const {
    speak,
    stopSpeaking,
    isSpeaking,
    toggleListening,
    isRecording,
    isListening,
    error: voiceError,
  } = useVoice({
    ttsEnabled: true,
    sttEnabled: true,
    onTextReceived: (text) => {
      setInputValue(text);
      handleSendMessage(text);
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
      } else {
        // Resposta completa
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: content,
          timestamp: new Date(),
          agentName: message.agent || 'Super Agent',
          agents: activeAgents,
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        setStreamingContent('');
        
        // Reproduzir voz Jarvis
        speak(content);
      }
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
        }
      } catch (error) {
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
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputValue;
    if (!messageText.trim() || isLoading) return;

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
    setStreamingContent('');
    setActiveAgents([]);

    // Se houver código e for ação/comando, executar código primeiro
    if (codeBlocks.length > 0 && (intent.type === 'action' || intent.type === 'command')) {
      try {
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
      } catch (error) {
        console.warn('Erro ao executar código:', error);
      }
    }

    // Tentar usar WebSocket primeiro (chat em tempo real)
    if (isConnected) {
      try {
        sendWebSocket({
          type: 'text',
          message: currentInput,
        });
        // WebSocket vai processar e enviar resposta via handleWebSocketMessage
        return;
      } catch (error) {
        console.warn('Erro ao enviar via WebSocket, usando tRPC:', error);
      }
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
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Status Bar - Mostrar agentes AutoGen trabalhando */}
      {activeAgents.length > 0 && (
        <div className="border-b border-border bg-card/50 backdrop-blur-sm p-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>AutoGen orquestrando:</span>
            <div className="flex gap-1 flex-wrap">
              {activeAgents.map((agent) => (
                <span key={agent} className="px-2 py-0.5 bg-primary/20 rounded text-primary text-xs">
                  {agent}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages Container - Responsivo */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl group ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-lg rounded-tr-none'
                  : message.role === 'system'
                  ? 'bg-muted/50 border border-border rounded-lg'
                  : 'bg-card border border-border rounded-lg rounded-tl-none'
              } p-3 sm:p-4 space-y-2`}
            >
              {message.agentName && message.role === 'assistant' && (
                <div className="flex items-center gap-2 text-xs font-semibold text-accent">
                  <span>{message.agentName}</span>
                  {message.agents && message.agents.length > 0 && (
                    <span className="text-muted-foreground">
                      ({message.agents.join(', ')})
                    </span>
                  )}
                </div>
              )}
              {message.intent && message.role === 'user' && (
                <div className="text-xs text-muted-foreground/70">
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
              
              <div className="text-sm prose prose-invert max-w-none">
                {message.role === 'assistant' ? (
                  <Streamdown>{message.content}</Streamdown>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
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
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">
                  {message.timestamp.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <div className="flex items-center gap-1">
                  {message.role === 'assistant' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                        onClick={() => speak(message.content)}
                        title="Reproduzir voz Jarvis"
                      >
                        <Volume2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                        onClick={() => copyToClipboard(message.content, message.id)}
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
                <span className="text-sm text-muted-foreground">Processando...</span>
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

      {/* Input Area */}
      <div className="border-t border-border p-2 sm:p-4 bg-card">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2">
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
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              title="Adicionar arquivo"
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              title="Anexar arquivo"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              title="Anexar imagem (OCR + Análise)"
              onClick={() => imageInputRef.current?.click()}
              disabled={isProcessingImage || isProcessingOCR || isProcessingImageAnalysis}
            >
              {isProcessingImage || isProcessingOCR || isProcessingImageAnalysis ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </Button>
            <Button
              variant={isRecording ? "default" : "ghost"}
              size="icon"
              className={`${isRecording ? 'bg-red-500 hover:bg-red-600' : 'text-muted-foreground hover:text-foreground'}`}
              title={isRecording ? "Parar gravação" : "Entrada de voz (STT)"}
              onClick={toggleListening}
              disabled={isLoading}
            >
              {isRecording ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </Button>
          </div>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={isRecording ? "Gravando... Clique no microfone para parar" : "Digite sua mensagem, anexe imagens ou use o microfone... (Shift+Enter para nova linha)"}
            className="flex-1 bg-background border-border text-sm sm:text-base"
            disabled={isLoading || isRecording || isProcessingImage}
          />
          {isSpeaking && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              title="Parar voz Jarvis"
              onClick={stopSpeaking}
            >
              <VolumeX className="w-5 h-5" />
            </Button>
          )}
          <Button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading || isRecording}
            className="bg-primary hover:bg-primary/90"
            title="Enviar mensagem"
          >
            <Send className="w-5 h-5" />
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
          <div className="text-xs text-red-500 mt-1 flex items-center gap-2">
            <span>⚠️ {voiceError}</span>
            {voiceError.includes('Permissão') && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => {
                  // Tentar solicitar permissão novamente
                  navigator.mediaDevices.getUserMedia({ audio: true })
                    .then(() => {
                      // Permissão concedida
                    })
                    .catch(() => {
                      // Permissão ainda negada
                    });
                }}
              >
                Solicitar Permissão
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
