import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react';

interface ExecutionStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  timestamp?: Date;
  duration?: number;
}

export function TaskExecutionPanel() {
  const [steps, setSteps] = useState<ExecutionStep[]>([
    {
      id: '1',
      title: 'Análise de Requisitos',
      description: 'Analisando a tarefa solicitada',
      status: 'completed',
      timestamp: new Date(Date.now() - 5000),
      duration: 2000,
    },
    {
      id: '2',
      title: 'Planejamento',
      description: 'Criando plano de execução',
      status: 'completed',
      timestamp: new Date(Date.now() - 3000),
      duration: 1500,
    },
    {
      id: '3',
      title: 'Execução',
      description: 'Executando tarefas em paralelo',
      status: 'running',
      timestamp: new Date(),
    },
    {
      id: '4',
      title: 'Validação',
      description: 'Validando resultados',
      status: 'pending',
    },
    {
      id: '5',
      title: 'Entrega',
      description: 'Preparando resultados finais',
      status: 'pending',
    },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSteps(prev =>
        prev.map((step, idx) => {
          if (step.status === 'running' && idx < prev.length - 1) {
            const nextStep = prev[idx + 1];
            if (nextStep.status === 'pending') {
              return { ...step, status: 'completed', duration: Math.random() * 2000 + 1000 };
            }
          }
          return step;
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-secondary" />;
      case 'running':
        return <Zap className="w-5 h-5 text-accent animate-pulse" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const totalCount = steps.length;
  const progressPercent = (completedCount / totalCount) * 100;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-foreground">Progresso Geral</h3>
          <span className="text-xs text-muted-foreground">
            {completedCount} de {totalCount} concluído
          </span>
        </div>
        <div className="w-full bg-background rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary via-accent to-secondary transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {steps.map((step, index) => (
          <Card key={step.id} className="p-3 space-y-2">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getStatusIcon(step.status)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              {step.duration && (
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {(step.duration / 1000).toFixed(1)}s
                </div>
              )}
            </div>

            {step.status === 'running' && (
              <div className="ml-8 h-1 bg-background rounded-full overflow-hidden">
                <div className="h-full bg-accent animate-pulse" style={{ width: '60%' }} />
              </div>
            )}

            {index < steps.length - 1 && (
              <div className="ml-2 h-4 border-l-2 border-border" />
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
