import { useState, ReactNode } from 'react';

interface Agent3DCardProps {
  icon: ReactNode;
  name: string;
  role: string;
  color: string;
  status: 'idle' | 'active' | 'thinking';
}

export function Agent3DCard({ icon, name, role, color, status }: Agent3DCardProps) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * 10;
    const rotY = ((centerX - x) / centerX) * 10;

    setRotateX(rotX);
    setRotateY(rotY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      className="relative h-40 cursor-pointer perspective"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '1000px',
      }}
    >
      <div
        className="w-full h-full rounded-lg border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl p-4 flex flex-col items-center justify-center transition-transform duration-100"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: 'preserve-3d',
          background: `linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%), linear-gradient(135deg, ${color}22 0%, ${color}11 100%)`,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        {/* Glow effect */}
        <div
          className="absolute inset-0 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at center, ${color}40 0%, transparent 70%)`,
            filter: 'blur(20px)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 text-center space-y-2">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto text-white transition-transform duration-300 hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
              boxShadow: `0 0 20px ${color}80`,
            }}
          >
            {icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">{role}</p>
          </div>
          <div className="pt-2">
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium transition-all duration-300 ${
                status === 'active'
                  ? 'bg-secondary/30 text-secondary animate-pulse'
                  : status === 'thinking'
                  ? 'bg-accent/30 text-accent'
                  : 'bg-muted/20 text-muted-foreground'
              }`}
            >
              {status === 'active' ? 'Ativo' : status === 'thinking' ? 'Pensando' : 'Inativo'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
