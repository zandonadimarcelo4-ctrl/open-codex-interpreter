import { useState } from 'react';
import { Menu, Plus, Search, Clock, Trash2, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface ConversationItem {
  id: string;
  title: string;
  timestamp: Date;
}

export function Sidebar({
  isOpen,
  onToggle,
  onNewChat,
}: {
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
}) {
  const [conversations, setConversations] = useState<ConversationItem[]>([
    {
      id: '1',
      title: 'Projeto de Dashboard',
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: '2',
      title: 'Análise de Dados',
      timestamp: new Date(Date.now() - 86400000),
    },
    {
      id: '3',
      title: 'Desenvolvimento de API',
      timestamp: new Date(Date.now() - 172800000),
    },
  ]);

  const deleteConversation = (id: string) => {
    setConversations(conversations.filter(c => c.id !== id));
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-card border-r border-border transform transition-transform duration-300 z-50 lg:relative lg:translate-x-0 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">AutoGen</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>

          <Button
            onClick={onNewChat}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Conversa
          </Button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              className="pl-10 bg-background border-border"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-3">
            Histórico
          </div>

          {conversations.map((conv) => (
            <div
              key={conv.id}
              className="group p-3 rounded-lg bg-background hover:bg-background/80 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {conv.title}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {conv.timestamp.toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteConversation(conv.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>
    </>
  );
}
