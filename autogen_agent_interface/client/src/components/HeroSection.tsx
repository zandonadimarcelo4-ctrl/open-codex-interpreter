import { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Zap, Brain, Play, Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FloatingOrb } from './FloatingOrb';
import { GlassCard } from './GlassCard';
import { motion } from 'framer-motion';

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    { icon: Brain, text: 'Múltiplos Agentes Inteligentes', delay: 0.1, bgClass: 'bg-primary/10', borderClass: 'border-primary/20', textClass: 'text-primary', hoverBgClass: 'group-hover:bg-primary/20' },
    { icon: Zap, text: 'Execução Paralela e Otimizada', delay: 0.2, bgClass: 'bg-secondary/10', borderClass: 'border-secondary/20', textClass: 'text-secondary', hoverBgClass: 'group-hover:bg-secondary/20' },
    { icon: Sparkles, text: 'Interface Premium Nível Apple', delay: 0.3, bgClass: 'bg-accent/10', borderClass: 'border-accent/20', textClass: 'text-accent', hoverBgClass: 'group-hover:bg-accent/20' },
  ];

  const stats = [
    { label: 'Agentes', value: '4+', sublabel: 'Especialistas', icon: Brain },
    { label: 'Modelos', value: '∞', sublabel: 'Ilimitado', icon: Star },
    { label: 'Uptime', value: '99.9%', sublabel: 'Disponibilidade', icon: Check },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.8 }}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Premium Apple-style Gradient Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/98 to-background" />
        
        {/* Premium soft light orbs - Apple style */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: -100 }}
          animate={{ opacity: 0.2, scale: 1, x: 0 }}
          transition={{ duration: 3, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-1/4 left-1/4 w-[700px] h-[700px] bg-primary/25 rounded-full blur-[140px]"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: 100 }}
          animate={{ opacity: 0.15, scale: 1, x: 0 }}
          transition={{ duration: 3.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-secondary/25 rounded-full blur-[120px]"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.12, scale: 1 }}
          transition={{ duration: 4, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
          className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"
        />
        
        {/* Premium grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-40 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-32 items-center">
          {/* Left Content - Premium Apple Typography */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 40 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-12"
          >
            {/* Premium Badge - Apple style pill */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.9, y: isVisible ? 0 : -10 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.05, y: -2 }}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-border/40 bg-card/30 backdrop-blur-2xl hover:bg-card/50 hover:border-border/60 transition-all duration-500 group cursor-pointer shadow-lg shadow-black/5"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300" />
              </motion.div>
              <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors tracking-wide">
                Powered by AutoGen
              </span>
            </motion.div>

            {/* Premium Heading - Apple typography style */}
            <div className="space-y-8">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
                transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="text-7xl lg:text-8xl xl:text-9xl font-semibold text-foreground leading-[0.95] tracking-tight"
                style={{ 
                  fontFeatureSettings: '"liga" 1, "kern" 1',
                  letterSpacing: '-0.03em',
                  fontWeight: 600
                }}
              >
                Super
                <br />
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isVisible ? 1 : 0 }}
                  transition={{ duration: 1, delay: 0.6 }}
                  className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent"
                >
                  Agente
                </motion.span>
                <br />
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isVisible ? 1 : 0 }}
                  transition={{ duration: 1, delay: 0.8 }}
                  className="text-foreground/90"
                >
                  de IA
                </motion.span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="text-2xl lg:text-3xl text-foreground/50 leading-relaxed max-w-2xl font-light"
                style={{ 
                  letterSpacing: '-0.015em',
                  lineHeight: 1.6
                }}
              >
                Uma interface{' '}
                <span className="text-foreground/70 font-medium">inovadora</span> para gerenciar múltiplos modelos LLM trabalhando em equipe.{' '}
                <span className="text-foreground/60">Autogen framework</span> para desenvolvimento colaborativo e auto-recompensador.
              </motion.p>
            </div>

            {/* Premium Features List - Apple style */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isVisible ? 1 : 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="space-y-5 pt-6"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -30 }}
                  transition={{ duration: 0.8, delay: 0.7 + feature.delay, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ x: 5, scale: 1.02 }}
                  className="flex items-center gap-5 group cursor-pointer"
                >
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-14 h-14 rounded-2xl ${feature.bgClass} border ${feature.borderClass} flex items-center justify-center ${feature.hoverBgClass} transition-all duration-500 shadow-lg`}
                  >
                    <feature.icon className={`w-6 h-6 ${feature.textClass} group-hover:scale-110 transition-transform duration-300`} />
                  </motion.div>
                  <span className="text-foreground/70 font-medium text-xl group-hover:text-foreground transition-colors duration-300 tracking-wide">
                    {feature.text}
                  </span>
                </motion.div>
              ))}
            </motion.div>

            {/* Premium CTA Buttons - Apple style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.8, delay: 1, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap gap-5 pt-8"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  className="bg-foreground text-background hover:bg-foreground/90 px-10 py-8 text-xl rounded-3xl font-medium group transition-all duration-500 hover:shadow-2xl hover:shadow-foreground/30 border-0"
                >
                  Começar Agora
                  <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform duration-500" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="lg"
                  className="px-10 py-8 text-xl rounded-3xl border-2 border-border/40 hover:border-border hover:bg-card/60 backdrop-blur-xl font-medium transition-all duration-500 hover:shadow-xl"
                >
                  <Play className="w-6 h-6 mr-3" />
                  Ver Demonstração
                </Button>
              </motion.div>
            </motion.div>

            {/* Premium Stats - Apple style */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isVisible ? 1 : 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="grid grid-cols-3 gap-10 pt-16 border-t border-border/30"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                  transition={{ duration: 0.8, delay: 1.2 + index * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="space-y-2 cursor-pointer group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className="w-5 h-5 text-foreground/40 group-hover:text-primary transition-colors" />
                    <p className="text-5xl font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">
                      {stat.value}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-foreground/50 uppercase tracking-widest group-hover:text-foreground/70 transition-colors">
                    {stat.label}
                  </p>
                  <p className="text-xs text-foreground/30 mt-1 group-hover:text-foreground/50 transition-colors">
                    {stat.sublabel}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Content - Premium Visual - Apple style */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 50 }}
            animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.95, x: isVisible ? 0 : 50 }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {/* Premium Main Visual Card - Apple glassmorphism */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-[2.5rem] bg-card/30 backdrop-blur-3xl border border-border/40 p-16 shadow-2xl shadow-black/20 hover:shadow-3xl hover:shadow-black/30 transition-all duration-500"
            >
              <div className="aspect-square flex items-center justify-center min-h-[600px]">
                <FloatingOrb />
              </div>
              
              {/* Premium glow effect */}
              <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-50 pointer-events-none" />
            </motion.div>

            {/* Premium Floating Cards - Apple style */}
            <motion.div
              initial={{ opacity: 0, y: 30, x: -30 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30, x: isVisible ? 0 : -30 }}
              transition={{ duration: 1, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.08, y: -8, rotate: -2 }}
              className="absolute -bottom-8 -left-8 w-64 h-48 rounded-3xl bg-gradient-to-br from-primary/25 via-primary/15 to-transparent backdrop-blur-2xl border border-white/10 p-6 shadow-2xl hover:shadow-3xl transition-all duration-500"
            >
              <div className="flex items-start gap-4">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0"
                >
                  <Check className="w-6 h-6 text-primary" />
                </motion.div>
                <div className="flex-1 space-y-2">
                  <div className="text-base font-semibold text-foreground tracking-tight">Análise em Tempo Real</div>
                  <div className="text-sm text-foreground/50 leading-relaxed">Monitoramento contínuo de todas as tarefas e agentes com precisão</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30, x: 30 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30, x: isVisible ? 0 : 30 }}
              transition={{ duration: 1, delay: 1.6, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.08, y: -8, rotate: 2 }}
              className="absolute -top-8 -right-8 w-64 h-48 rounded-3xl bg-gradient-to-br from-secondary/25 via-secondary/15 to-transparent backdrop-blur-2xl border border-white/10 p-6 shadow-2xl hover:shadow-3xl transition-all duration-500"
            >
              <div className="flex items-start gap-4">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="w-12 h-12 rounded-2xl bg-secondary/20 border border-secondary/30 flex items-center justify-center flex-shrink-0"
                >
                  <Sparkles className="w-6 h-6 text-secondary" />
                </motion.div>
                <div className="flex-1 space-y-2">
                  <div className="text-base font-semibold text-foreground tracking-tight">Chat Inteligente</div>
                  <div className="text-sm text-foreground/50 leading-relaxed">Interaja naturalmente com seu super agente de IA</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
