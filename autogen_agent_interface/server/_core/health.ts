/**
 * Health check endpoint
 * Para verificação de saúde em plataformas de deploy
 */

import { Request, Response } from 'express';

export function healthCheck(req: Request, res: Response): void {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  };

  res.status(200).json(health);
}

