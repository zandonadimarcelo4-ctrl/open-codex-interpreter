import { HeroSection } from '@/components/HeroSection';
import { GlassCard } from '@/components/GlassCard';
import { Agent3DCard } from '@/components/3DAgentCard';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Brain, Code, Palette, Zap, ArrowRight, CheckCircle } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            AutoGen
          </div>
          <div className="flex items-center gap-4">
            <Link href="/showcase">
              <Button variant="ghost" className="text-foreground">
                Showcase
              </Button>
            </Link>
            <Link href="/">
              <Button className="bg-primary hover:bg-primary/90">
                Entrar
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
              Características Poderosas
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tudo que você precisa para gerenciar um super agente de IA com múltiplos modelos colaborativos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                title: 'Múltiplos Agentes',
                description: 'Trabalhe com uma equipe de especialistas em IA, cada um com sua expertise',
              },
              {
                icon: Zap,
                title: 'Execução Rápida',
                description: 'Processamento paralelo e otimizado para máxima performance',
              },
              {
                icon: Code,
                title: 'Geração de Código',
                description: 'Gere código de qualidade produção automaticamente',
              },
              {
                icon: Palette,
                title: 'Design Inteligente',
                description: 'Crie interfaces bonitas com ajuda de IA',
              },
              {
                icon: CheckCircle,
                title: 'Auto-Recompensa',
                description: 'Sistema de aprendizado contínuo e auto-otimização',
              },
              {
                icon: ArrowRight,
                title: 'Fácil Integração',
                description: 'Integre com seus sistemas existentes sem esforço',
              },
            ].map((feature, index) => (
              <GlassCard key={index} className="p-6 space-y-4 hover:border-primary/50 transition-all">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Agents Section */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
              Sua Equipe de Agentes
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Conheça os especialistas que trabalham para você
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
              Pronto para revolucionar seu workflow?
            </h2>
            <p className="text-xl text-muted-foreground">
              Junte-se a milhares de usuários que já estão usando AutoGen para aumentar sua produtividade
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/">
              <Button className="bg-primary hover:bg-primary/90 px-8 py-6 text-lg rounded-lg group">
                Começar Agora
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/showcase">
              <Button
                variant="outline"
                className="px-8 py-6 text-lg rounded-lg border-primary/50 hover:bg-primary/10"
              >
                Ver Demonstração
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p>© 2025 AutoGen Super Agent Interface. Powered by Autogen Framework.</p>
        </div>
      </footer>
    </div>
  );
}
