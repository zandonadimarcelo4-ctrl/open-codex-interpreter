import { useEffect, useRef } from 'react';

export function FloatingOrb() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    let time = 0;
    let animationFrameId: number;

    const animate = () => {
      time += 0.01;

      // Clear canvas
      ctx.fillStyle = 'transparent';
      ctx.clearRect(0, 0, width, height);

      // Draw orbiting particles
      const orbitRadius = 80;
      const particleCount = 12;

      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2 + time;
        const x = centerX + Math.cos(angle) * orbitRadius;
        const y = centerY + Math.sin(angle) * orbitRadius;

        // Draw particle
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 8);
        gradient.addColorStop(0, 'oklch(0.6 0.2 280 / 0.8)');
        gradient.addColorStop(1, 'oklch(0.6 0.2 280 / 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw central orb
      const centralGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 40);
      centralGradient.addColorStop(0, 'oklch(0.6 0.2 280 / 0.6)');
      centralGradient.addColorStop(0.5, 'oklch(0.6 0.2 150 / 0.3)');
      centralGradient.addColorStop(1, 'oklch(0.6 0.2 50 / 0)');

      ctx.fillStyle = centralGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
      ctx.fill();

      // Draw pulsing core
      const coreSize = 15 + Math.sin(time * 2) * 5;
      const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreSize);
      coreGradient.addColorStop(0, 'oklch(0.8 0.2 280)');
      coreGradient.addColorStop(1, 'oklch(0.6 0.2 280 / 0)');

      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
      ctx.fill();

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={300}
      className="w-full h-auto"
      style={{
        filter: 'drop-shadow(0 0 30px oklch(0.6 0.2 280 / 0.5))',
      }}
    />
  );
}
