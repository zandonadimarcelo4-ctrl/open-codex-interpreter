import { HeroSection } from '@/components/HeroSection';
import { GlassCard } from '@/components/GlassCard';
import { Agent3DCard } from '@/components/3DAgentCard';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Brain, Code, Palette, Zap, ArrowRight, CheckCircle, Download, Smartphone, Monitor, Share2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function Landing() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Detectar se o app pode ser instalado (PWA)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Se não houver prompt, mostrar instruções
      alert('Para instalar o app:\n\nAndroid: Toque no menu (⋮) > "Adicionar à tela inicial"\n\niOS: Toque no botão Compartilhar > "Adicionar à Tela de Início"');
      return;
    }

    // Mostrar prompt de instalação
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation - Apple style */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-5 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-semibold tracking-tight text-foreground"
            style={{ fontFeatureSettings: '"liga" 1, "kern" 1' }}
          >
            AutoGen
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <Link href="/showcase">
              <Button variant="ghost" className="text-foreground/70 hover:text-foreground hover:bg-card/50 rounded-xl px-5 py-2.5 font-medium transition-all duration-200">
                Showcase
              </Button>
            </Link>
            <Link href="/app">
              <Button className="bg-foreground text-background hover:bg-foreground/90 rounded-xl px-6 py-2.5 font-medium transition-all duration-200 hover:scale-105">
                Iniciar Chat
              </Button>
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section - Apple style */}
      <section className="py-32 border-t border-border/30">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-5 mb-20"
          >
            <h2 className="text-5xl lg:text-6xl font-semibold text-foreground tracking-tight" style={{ fontFeatureSettings: '"liga" 1, "kern" 1' }}>
              Características Poderosas
            </h2>
            <p className="text-xl lg:text-2xl text-foreground/60 max-w-2xl mx-auto font-light leading-relaxed" style={{ letterSpacing: '-0.01em' }}>
              Tudo que você precisa para gerenciar um super agente de IA com múltiplos modelos colaborativos
            </p>
          </motion.div>

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
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <GlassCard className="p-8 space-y-5 hover:border-primary/50 transition-all duration-300 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-all">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-3 tracking-tight">{feature.title}</h3>
                    <p className="text-sm text-foreground/60 leading-relaxed">{feature.description}</p>
                  </div>
                </GlassCard>
              </motion.div>
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

      {/* Download App Section - Mobile First */}
      <section className="py-20 sm:py-32 border-t border-border/30 bg-gradient-to-b from-background to-card/30">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12"
        >
          <div className="text-center space-y-6 mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground tracking-tight" style={{ fontFeatureSettings: '"liga" 1, "kern" 1' }}>
              Adicione à Tela Inicial
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl text-foreground/60 font-light leading-relaxed max-w-2xl mx-auto" style={{ letterSpacing: '-0.01em' }}>
              Use AutoGen como um app nativo. Adicione à tela inicial do seu celular para acesso rápido
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Android Instructions */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6 sm:p-8"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Android</h3>
                  <p className="text-sm text-foreground/60">Chrome / Edge</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-primary">1</span>
                  </div>
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    Toque no menu <strong className="text-foreground">⋮</strong> (três pontos) no canto superior direito
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-primary">2</span>
                  </div>
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    Selecione <strong className="text-foreground">"Adicionar à tela inicial"</strong> ou <strong className="text-foreground">"Instalar app"</strong>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-primary">3</span>
                  </div>
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    Confirme e o app será adicionado à sua tela inicial
                  </p>
                </div>
              </div>

              {isInstallable ? (
                <Button
                  onClick={handleInstallClick}
                  size="lg"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium transition-all duration-300 hover:scale-105"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Instalar Agora
                </Button>
              ) : (
                <Button
                  onClick={handleInstallClick}
                  size="lg"
                  variant="outline"
                  className="w-full rounded-xl font-medium transition-all duration-300 hover:scale-105"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar à Tela Inicial
                </Button>
              )}
            </motion.div>

            {/* iOS Instructions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6 sm:p-8"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">iOS (iPhone/iPad)</h3>
                  <p className="text-sm text-foreground/60">Safari</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-primary">1</span>
                  </div>
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    Toque no botão <strong className="text-foreground"><Share2 className="w-4 h-4 inline" /> Compartilhar</strong> na parte inferior da tela
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-primary">2</span>
                  </div>
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    Role para baixo e selecione <strong className="text-foreground">"Adicionar à Tela de Início"</strong>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-primary">3</span>
                  </div>
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    Toque em <strong className="text-foreground">"Adicionar"</strong> no canto superior direito
                  </p>
                </div>
              </div>

              <Button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'AutoGen Super Agent',
                      text: 'Adicione AutoGen à sua tela inicial',
                      url: window.location.href
                    });
                  } else {
                    alert('Use o botão Compartilhar do Safari para adicionar à tela inicial');
                  }
                }}
                size="lg"
                variant="outline"
                className="w-full rounded-xl font-medium transition-all duration-300 hover:scale-105"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Compartilhar e Adicionar
              </Button>
            </motion.div>
          </div>

          {/* Quick Access Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6 sm:p-8 text-center"
          >
            <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">
              ✨ Acesso Rápido e Offline
            </h3>
            <p className="text-foreground/70 mb-4 leading-relaxed max-w-2xl mx-auto">
              Após adicionar à tela inicial, você terá acesso rápido ao AutoGen, mesmo sem internet. 
              O app funciona como um aplicativo nativo com todas as funcionalidades.
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-sm text-foreground/60">
              <span className="px-3 py-1 bg-card/50 rounded-full">⚡ Acesso Rápido</span>
              <span className="px-3 py-1 bg-card/50 rounded-full">📱 App Nativo</span>
              <span className="px-3 py-1 bg-card/50 rounded-full">🌐 Funciona Offline</span>
              <span className="px-3 py-1 bg-card/50 rounded-full">🔄 Sincronização Automática</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* CTA Section - Apple style */}
      <section className="py-20 sm:py-32 border-t border-border/30">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 text-center space-y-8 sm:space-y-10"
        >
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold text-foreground tracking-tight" style={{ fontFeatureSettings: '"liga" 1, "kern" 1' }}>
              Pronto para revolucionar seu workflow?
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl text-foreground/60 font-light leading-relaxed" style={{ letterSpacing: '-0.01em' }}>
              Junte-se a milhares de usuários que já estão usando AutoGen para aumentar sua produtividade
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 pt-4">
            <Link href="/app">
              <Button size="lg" className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90 px-8 sm:px-10 py-6 sm:py-7 text-base sm:text-lg rounded-2xl font-medium group transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-foreground/20">
                Começar Agora
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
            <Link href="/showcase">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-8 sm:px-10 py-6 sm:py-7 text-base sm:text-lg rounded-2xl border-2 border-border/50 hover:border-border hover:bg-card/50 backdrop-blur-sm font-medium transition-all duration-300 hover:scale-105"
              >
                Ver Demonstração
              </Button>
            </Link>
          </div>
        </motion.div>
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
