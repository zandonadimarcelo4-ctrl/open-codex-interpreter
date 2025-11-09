import { Brain, Code, Palette, Zap } from 'lucide-react';
import { Agent3DCard } from '@/components/3DAgentCard';
import { FloatingOrb } from '@/components/FloatingOrb';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function Showcase() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">AutoGen Showcase</h1>
          <Link href="/">
            <Button variant="outline">Voltar</Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12 space-y-16">
        {/* Floating Orb Section */}
        <section className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Animação Orbital 3D</h2>
            <p className="text-muted-foreground">Visualização dinâmica com partículas orbitando</p>
          </div>
          <GlassCard className="p-8 flex justify-center">
            <FloatingOrb />
          </GlassCard>
        </section>

        {/* 3D Agent Cards Section */}
        <section className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Cartões de Agentes 3D</h2>
            <p className="text-muted-foreground">Interação com efeito de perspectiva 3D</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Agent3DCard
              icon={<Brain className="w-6 h-6" />}
              name="Architect"
              role="System Design"
              color="oklch(0.6 0.2 280)"
              status="idle"
            />
            <Agent3DCard
              icon={<Code className="w-6 h-6" />}
              name="Developer"
              role="Code Generation"
              color="oklch(0.6 0.2 150)"
              status="active"
            />
            <Agent3DCard
              icon={<Palette className="w-6 h-6" />}
              name="Designer"
              role="UI/UX"
              color="oklch(0.6 0.2 50)"
              status="thinking"
            />
            <Agent3DCard
              icon={<Zap className="w-6 h-6" />}
              name="Executor"
              role="Task Execution"
              color="oklch(0.6 0.2 200)"
              status="idle"
            />
          </div>
        </section>

        {/* Glass Cards Section */}
        <section className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Cartões com Glassmorphism</h2>
            <p className="text-muted-foreground">Efeito de vidro com blur e transparência</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCard className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Inteligência</h3>
                <p className="text-sm text-muted-foreground">Múltiplos modelos LLM trabalhando em equipe</p>
              </div>
            </GlassCard>
            <GlassCard className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Performance</h3>
                <p className="text-sm text-muted-foreground">Execução paralela e otimizada</p>
              </div>
            </GlassCard>
            <GlassCard className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
                <Code className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Inovação</h3>
                <p className="text-sm text-muted-foreground">Interface moderna e intuitiva</p>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* Features Grid */}
        <section className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Características Principais</h2>
            <p className="text-muted-foreground">Tudo que você precisa para gerenciar seu super agente IA</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: 'Chat em Tempo Real',
                description: 'Comunique-se com seu super agente de forma natural e intuitiva',
              },
              {
                title: 'Visualização de Agentes',
                description: 'Veja sua equipe de IA trabalhando em tempo real',
              },
              {
                title: 'Monitoramento de Tarefas',
                description: 'Acompanhe o progresso de cada tarefa em execução',
              },
              {
                title: 'Histórico de Resultados',
                description: 'Acesse todos os resultados anteriores facilmente',
              },
              {
                title: 'Interface Responsiva',
                description: 'Funciona perfeitamente em qualquer dispositivo',
              },
              {
                title: 'Design Inovador',
                description: 'Inspirado no design premium da Apple',
              },
            ].map((feature, index) => (
              <GlassCard key={index} className="p-4">
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="space-y-6 py-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-foreground">Pronto para começar?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Experimente o poder do super agente IA com Autogen. Uma interface inovadora para gerenciar múltiplos modelos trabalhando em equipe.
            </p>
            <Link href="/">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2 text-lg">
                Ir para a Interface Principal
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
