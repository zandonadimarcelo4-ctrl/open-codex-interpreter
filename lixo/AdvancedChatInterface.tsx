import { useState, useRef, useEffect } from 'react';
import { Send, Plus, Paperclip, Mic, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Streamdown } from 'streamdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentName?: string;
  isStreaming?: boolean;
}

export function AdvancedChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '# Bem-vindo ao AutoGen Super Agent!\n\nSou seu assistente de IA colaborativo, trabalhando com uma equipe de especialistas:\n\n- **Architect**: Desenha soluções\n- **Developer**: Implementa código\n- **Designer**: Cria interfaces\n- **Executor**: Executa tarefas\n\nComo posso ajudá-lo?',
      timestamp: new Date(),
      agentName: 'Super Agent',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate streaming response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `## Análise da Solicitação\n\nVocê pediu: **"${inputValue}"**\n\n### Plano de Execução\n\n1. **Análise** - Entendendo os requisitos\n2. **Design** - Criando arquitetura\n3. **Implementação** - Desenvolvendo solução\n4. **Validação** - Testando resultados\n\n### Resultado\n\n\`\`\`javascript\n// Exemplo de código gerado\nconst resultado = await superAgent.execute({\n  tarefa: "${inputValue}",\n  prioridade: "alta",\n  timeout: 30000\n});\n\nconsole.log(resultado);\n\`\`\`\n\n**Status**: ✅ Concluído com sucesso!`,
        timestamp: new Date(),
        agentName: 'Super Agent',
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md xl:max-w-lg group ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-lg rounded-tr-none'
                  : 'bg-card border border-border rounded-lg rounded-tl-none'
              } p-4 space-y-2`}
            >
              {message.agentName && message.role === 'assistant' && (
                <div className="text-xs font-semibold text-accent">
                  {message.agentName}
                </div>
              )}
              <div className="text-sm prose prose-invert max-w-none">
                {message.role === 'assistant' ? (
                  <Streamdown>{message.content}</Streamdown>
                ) : (
                  <p>{message.content}</p>
                )}
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">
                  {message.timestamp.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {message.role === 'assistant' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                    onClick={() => copyToClipboard(message.content, message.id)}
                  >
                    {copiedId === message.id ? (
                      <Check className="w-4 h-4 text-secondary" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-lg rounded-tl-none p-4">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4 bg-card">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            title="Adicionar arquivo"
          >
            <Plus className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            title="Anexar arquivo"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            title="Entrada de voz"
          >
            <Mic className="w-5 h-5" />
          </Button>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Digite sua mensagem aqui... (Shift+Enter para nova linha)"
            className="flex-1 bg-background border-border"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-primary hover:bg-primary/90"
            title="Enviar mensagem"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground mt-2 text-center">
          Powered by AutoGen Framework
        </div>
      </div>
    </div>
  );
}
