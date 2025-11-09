import { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Zap, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FloatingOrb } from './FloatingOrb';
import { GlassCard } from './GlassCard';

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-20">
      {/* Gradient Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl opacity-20" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div
            className={`space-y-8 transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/50 bg-primary/10 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Powered by Autogen</span>
            </div>

            {/* Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Super Agente de IA
                <span className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Equipe Colaborativa
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl">
                Uma interface inovadora para gerenciar múltiplos modelos LLM trabalhando em equipe. Autogen framework para desenvolvimento colaborativo e auto-recompensador.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-3">
              {[
                { icon: Brain, text: 'Múltiplos Agentes Inteligentes' },
                { icon: Zap, text: 'Execução Paralela e Otimizada' },
                { icon: Sparkles, text: 'Interface Inovadora Nível Apple' },
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-foreground font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-lg group"
              >
                Começar Agora
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                className="px-8 py-6 text-lg rounded-lg border-primary/50 hover:bg-primary/10"
              >
                Ver Demonstração
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-border">
              {[
                { label: 'Agentes', value: '4+' },
                { label: 'Modelos', value: 'Ilimitado' },
                { label: 'Uptime', value: '99.9%' },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <p className="text-2xl font-bold text-primary">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Visual */}
          <div
            className={`relative transition-all duration-1000 delay-300 ${
              isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <GlassCard className="p-8 flex justify-center items-center min-h-96">
              <FloatingOrb />
            </GlassCard>

            {/* Floating Cards */}
            <div className="absolute -bottom-8 -left-8 w-48 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg backdrop-blur-xl border border-white/10 p-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="text-sm font-semibold text-foreground mb-2">Análise em Tempo Real</div>
              <div className="text-xs text-muted-foreground">Monitoramento contínuo de todas as tarefas</div>
            </div>

            <div className="absolute -top-8 -right-8 w-48 h-32 bg-gradient-to-br from-secondary/20 to-accent/20 rounded-lg backdrop-blur-xl border border-white/10 p-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="text-sm font-semibold text-foreground mb-2">Chat Inteligente</div>
              <div className="text-xs text-muted-foreground">Interaja naturalmente com seu super agente</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
