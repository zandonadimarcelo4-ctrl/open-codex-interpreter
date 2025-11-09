import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Clock, Zap, Loader2, TrendingUp } from 'lucide-react';

interface ExecutionStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  timestamp?: Date;
  duration?: number;
  progress?: number; // Progresso individual (0-100)
  estimatedTimeRemaining?: number; // Tempo estimado restante em ms
}

export function TaskExecutionPanel() {
  // Usar IDs únicos baseados em timestamp para evitar duplicação
  const [steps, setSteps] = useState<ExecutionStep[]>(() => {
    const baseTime = Date.now();
    return [
      {
        id: `step-${baseTime}-1`,
        title: 'Análise de Requisitos',
        description: 'Analisando a tarefa solicitada',
        status: 'completed',
        timestamp: new Date(baseTime - 5000),
        duration: 2000,
        progress: 100,
      },
      {
        id: `step-${baseTime}-2`,
        title: 'Planejamento',
        description: 'Criando plano de execução',
        status: 'completed',
        timestamp: new Date(baseTime - 3000),
        duration: 1500,
        progress: 100,
      },
      {
        id: `step-${baseTime}-3`,
        title: 'Execução',
        description: 'Executando tarefas em paralelo',
        status: 'running',
        timestamp: new Date(baseTime),
        progress: 65,
        estimatedTimeRemaining: 1200,
      },
      {
        id: `step-${baseTime}-4`,
        title: 'Validação',
        description: 'Validando resultados',
        status: 'pending',
        progress: 0,
      },
      {
        id: `step-${baseTime}-5`,
        title: 'Entrega',
        description: 'Preparando resultados finais',
        status: 'pending',
        progress: 0,
      },
    ];
  });

  const startTimeRef = useRef<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [averageStepTime, setAverageStepTime] = useState(0);

  // Atualizar tempo decorrido
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTimeRef.current);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Simular progresso em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setSteps(prev => {
        // Criar novo array para evitar mutação
        const updatedSteps = prev.map((step, idx) => {
          // Atualizar progresso da etapa em execução
          if (step.status === 'running' && step.progress !== undefined) {
            const newProgress = Math.min(100, (step.progress || 0) + Math.random() * 5);
            const remainingSteps = prev.length - idx - 1;
            const avgTime = averageStepTime || 2000;
            const estimatedTime = remainingSteps * avgTime * (1 - newProgress / 100);

            if (newProgress >= 100) {
              // Completar etapa atual (não iniciar próxima aqui - será feito no próximo map)
              return {
                ...step,
                status: 'completed',
                progress: 100,
                duration: Date.now() - (step.timestamp?.getTime() || Date.now()),
              };
            }

            return {
              ...step,
              progress: newProgress,
              estimatedTimeRemaining: estimatedTime,
            };
          }

          // Iniciar próxima etapa quando a anterior completar
          // Verificar se a etapa anterior está completed
          if (step.status === 'pending' && idx > 0) {
            const prevStep = prev[idx - 1];
            if (prevStep && prevStep.status === 'completed') {
              return {
                ...step, // Manter o ID original do step
                status: 'running',
                timestamp: new Date(),
                progress: 0,
              };
            }
          }

          return step;
        });

        // Calcular tempo médio por etapa usando os steps atualizados
        const completedSteps = updatedSteps.filter(s => s.status === 'completed' && s.duration);
        if (completedSteps.length > 0) {
          const avg = completedSteps.reduce((sum, s) => sum + (s.duration || 0), 0) / completedSteps.length;
          setAverageStepTime(avg);
        }

        return updatedSteps;
      });
    }, 500); // Atualizar a cada 500ms para animação mais suave

    return () => clearInterval(interval);
  }, [averageStepTime]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-accent animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const runningStep = steps.find(s => s.status === 'running');
  const totalCount = steps.length;
  
  // Calcular progresso geral considerando progresso individual
  const overallProgress = steps.reduce((acc, step) => {
    if (step.status === 'completed') return acc + 100;
    if (step.status === 'running') return acc + (step.progress || 0);
    return acc;
  }, 0) / totalCount;

  const progressPercent = Math.min(100, overallProgress);

  // Calcular tempo estimado restante
  const remainingSteps = steps.filter(s => s.status === 'pending' || s.status === 'running').length;
  const estimatedTimeRemaining = runningStep?.estimatedTimeRemaining 
    ? runningStep.estimatedTimeRemaining + (remainingSteps - 1) * averageStepTime
    : remainingSteps * averageStepTime;

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  };

  return (
    <div className="space-y-4">
      {/* Progresso Geral Melhorado */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-foreground">Progresso Geral</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {completedCount} de {totalCount} concluído
            </span>
            <span className="text-xs font-medium text-accent">
              {progressPercent.toFixed(1)}%
            </span>
          </div>
        </div>
        
        {/* Barra de progresso melhorada */}
        <div className="relative">
          <Progress value={progressPercent} className="h-3" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-foreground/80">
              {Math.round(progressPercent)}%
            </span>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>Tempo decorrido: {formatTime(elapsedTime)}</span>
          </div>
          {estimatedTimeRemaining > 0 && (
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3 h-3" />
              <span>Estimado: {formatTime(estimatedTimeRemaining)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Etapas Individuais */}
      <div className="space-y-2">
        {steps.map((step, index) => {
          const isActive = step.status === 'running';
          const isCompleted = step.status === 'completed';
          
          return (
            <Card 
              key={step.id} 
              className={`p-3 space-y-2 transition-all duration-300 ${
                isActive ? 'ring-2 ring-accent/50 bg-accent/5' : ''
              } ${isCompleted ? 'opacity-90' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {getStatusIcon(step.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground">{step.title}</p>
                    <div className="flex items-center gap-2">
                      {step.duration && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {(step.duration / 1000).toFixed(1)}s
                        </span>
                      )}
                      {step.status === 'running' && step.progress !== undefined && (
                        <span className="text-xs font-medium text-accent whitespace-nowrap">
                          {Math.round(step.progress)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>

              {/* Barra de progresso individual */}
              {(step.status === 'running' || step.status === 'completed') && step.progress !== undefined && (
                <div className="ml-8 space-y-1">
                  <Progress 
                    value={step.progress} 
                    className="h-1.5"
                  />
                  {step.status === 'running' && step.estimatedTimeRemaining && (
                    <p className="text-[10px] text-muted-foreground">
                      Tempo restante: ~{formatTime(step.estimatedTimeRemaining)}
                    </p>
                  )}
                </div>
              )}

              {/* Conector entre etapas */}
              {index < steps.length - 1 && (
                <div className={`ml-2 h-4 border-l-2 transition-colors duration-300 ${
                  isCompleted ? 'border-green-500/30' : 'border-border'
                }`} />
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
