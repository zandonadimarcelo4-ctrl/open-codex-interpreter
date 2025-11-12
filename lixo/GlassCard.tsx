import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border border-white/10
        bg-gradient-to-br from-white/10 to-white/5
        backdrop-blur-xl backdrop-saturate-150
        shadow-xl hover:shadow-2xl
        transition-all duration-300
        ${className}
      `}
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      {/* Animated gradient border */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(135deg, oklch(0.6 0.2 280) 0%, oklch(0.6 0.2 150) 100%)',
          padding: '1px',
          pointerEvents: 'none',
        }}
      >
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
          }}
        />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
