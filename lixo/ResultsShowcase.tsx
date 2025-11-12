import { Card } from '@/components/ui/card';
import { Code, Image, FileText, BarChart3 } from 'lucide-react';

interface Result {
  id: string;
  type: 'code' | 'image' | 'document' | 'data';
  title: string;
  description: string;
  preview: string;
  timestamp: Date;
}

export function ResultsShowcase() {
  const results: Result[] = [
    {
      id: '1',
      type: 'code',
      title: 'Componente React',
      description: 'Componente de interface de usuário',
      preview: 'export function Button() { return <button>Click</button>; }',
      timestamp: new Date(Date.now() - 60000),
    },
    {
      id: '2',
      type: 'document',
      title: 'Documentação',
      description: 'Guia de implementação',
      preview: '# Guia de Implementação\n\n## Instalação\n...',
      timestamp: new Date(Date.now() - 120000),
    },
    {
      id: '3',
      type: 'data',
      title: 'Análise de Dados',
      description: 'Resultados da análise',
      preview: 'Total: 1,250 | Média: 85.5 | Máximo: 100',
      timestamp: new Date(Date.now() - 180000),
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'code':
        return <Code className="w-4 h-4" />;
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      case 'data':
        return <BarChart3 className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'code':
        return 'bg-primary/10 text-primary';
      case 'image':
        return 'bg-secondary/10 text-secondary';
      case 'document':
        return 'bg-accent/10 text-accent';
      case 'data':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted/10 text-muted-foreground';
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-muted-foreground uppercase">
        Resultados Recentes
      </div>

      {results.map((result) => (
        <Card
          key={result.id}
          className="p-3 hover:border-primary/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded ${getTypeColor(result.type)}`}>
              {getIcon(result.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {result.title}
              </p>
              <p className="text-xs text-muted-foreground">{result.description}</p>
              <div className="mt-2 p-2 bg-background rounded text-xs font-mono text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                {result.preview}
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2 text-right">
            {result.timestamp.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}
