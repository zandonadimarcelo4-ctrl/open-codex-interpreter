import { useEffect, useRef, useState } from 'react';
import { Zap, Brain, Code, Palette } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'active' | 'thinking';
  color: string;
  icon: React.ReactNode;
}

const AGENTS: Agent[] = [
  {
    id: 'architect',
    name: 'Architect',
    role: 'System Design',
    status: 'idle',
    color: 'oklch(0.6 0.2 280)',
    icon: <Brain className="w-6 h-6" />,
  },
  {
    id: 'developer',
    name: 'Developer',
    role: 'Code Generation',
    status: 'idle',
    color: 'oklch(0.6 0.2 150)',
    icon: <Code className="w-6 h-6" />,
  },
  {
    id: 'designer',
    name: 'Designer',
    role: 'UI/UX',
    status: 'idle',
    color: 'oklch(0.6 0.2 50)',
    icon: <Palette className="w-6 h-6" />,
  },
  {
    id: 'executor',
    name: 'Executor',
    role: 'Task Execution',
    status: 'idle',
    color: 'oklch(0.6 0.2 200)',
    icon: <Zap className="w-6 h-6" />,
  },
];

export function AgentTeamVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const animate = () => {
      // Clear canvas with dark background
      ctx.fillStyle = 'oklch(0.15 0 0)';
      ctx.fillRect(0, 0, width, height);

      // Draw connecting lines between agents
      ctx.strokeStyle = 'oklch(0.3 0 0)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      const positions = [
        { x: width * 0.25, y: height * 0.5 },
        { x: width * 0.5, y: height * 0.3 },
        { x: width * 0.75, y: height * 0.5 },
        { x: width * 0.5, y: height * 0.7 },
      ];

      // Draw connections
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          ctx.beginPath();
          ctx.moveTo(positions[i].x, positions[i].y);
          ctx.lineTo(positions[j].x, positions[j].y);
          ctx.stroke();
        }
      }

      ctx.setLineDash([]);

      // Draw agents
      agents.forEach((agent, index) => {
        const pos = positions[index];
        const isActive = agent.id === activeAgent;
        const radius = isActive ? 45 : 40;

        // Draw glow effect for active agents
        if (isActive) {
          const glowColor = 'oklch(0.6 0.2 280 / 0.2)';
          ctx.fillStyle = glowColor;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, radius + 15, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw agent circle
        ctx.fillStyle = agent.color;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw border
        ctx.strokeStyle = 'oklch(0.95 0 0)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw status indicator
        if (agent.status === 'active') {
          ctx.fillStyle = 'oklch(0.6 0.2 150)';
          ctx.beginPath();
          ctx.arc(pos.x + radius - 8, pos.y - radius + 8, 6, 0, Math.PI * 2);
          ctx.fill();
        } else if (agent.status === 'thinking') {
          ctx.fillStyle = 'oklch(0.6 0.2 50)';
          ctx.beginPath();
          ctx.arc(pos.x + radius - 8, pos.y - radius + 8, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [agents, activeAgent]);

  const handleAgentClick = (agentId: string) => {
    setActiveAgent(activeAgent === agentId ? null : agentId);
    setAgents(agents.map(a => ({
      ...a,
      status: a.id === agentId && activeAgent !== agentId ? 'active' : 'idle'
    })));
  };

  return (
    <div className="w-full space-y-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-lg font-semibold mb-4">Agent Team</h3>
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="w-full border border-border rounded-lg bg-background"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => handleAgentClick(agent.id)}
            className={`p-3 rounded-lg border transition-all ${
              activeAgent === agent.id
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: agent.color }}
              />
              <span className="font-medium text-sm">{agent.name}</span>
            </div>
            <p className="text-xs text-muted-foreground">{agent.role}</p>
            <div className="mt-2 text-xs">
              <span className={`inline-block px-2 py-1 rounded ${
                agent.status === 'active' ? 'bg-secondary/20 text-secondary' :
                agent.status === 'thinking' ? 'bg-accent/20 text-accent' :
                'bg-muted/20 text-muted-foreground'
              }`}>
                {agent.status}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
