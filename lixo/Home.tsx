import { useState } from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_TITLE, getLoginUrl } from "@/const";
import { Sidebar } from '@/components/Sidebar';
import { AdvancedChatInterface } from '@/components/AdvancedChatInterface';
import { RightPanel } from '@/components/RightPanel';
import { AgentTeamVisualization } from '@/components/AgentTeamVisualization';

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">{APP_TITLE}</h1>
            <p className="text-muted-foreground">Super Agente LLM com Autogen</p>
          </div>
          <div className="space-y-4">
            <p className="text-foreground">
              Uma interface inovadora para um super agente de IA que trabalha como uma equipe de desenvolvimento.
            </p>
            <Button
              onClick={() => (window.location.href = getLoginUrl())}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Entrar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-border bg-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold text-foreground">AutoGen Super Agent</h2>
              <p className="text-xs text-muted-foreground">Equipe de Desenvolvimento IA</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{user?.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-muted-foreground hover:text-foreground"
            >
              Sair
            </Button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden gap-4 p-4">
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 bg-card rounded-lg border border-border overflow-hidden flex flex-col">
              <AdvancedChatInterface />
            </div>
          </div>

          <div className="hidden xl:flex w-80 flex-col">
            <div className="flex-1 bg-card rounded-lg border border-border overflow-hidden p-4">
              <AgentTeamVisualization />
            </div>
          </div>

          <div className="hidden lg:flex w-80 flex-col">
            <RightPanel
              isOpen={rightPanelOpen}
              onToggle={() => setRightPanelOpen(!rightPanelOpen)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
