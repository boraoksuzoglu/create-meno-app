export function generateHealthRoute(config) {
  const { language } = config;
  const isTs = language === 'ts';

  return `import express from 'express';
import mongoose from 'mongoose';
import { config } from '@/config/config.js';

const router = express.Router();

/**
 * GET /health
 * Used by load balancers, Docker HEALTHCHECK, and monitoring tools.
 * Returns 200 when the app is ready to serve traffic, 503 otherwise.
 */
// @doc Health check
router.get('/', (_req, res) => {
  const dbState = mongoose.connection.readyState;
  // 1 = connected, 2 = connecting
  const dbOk = dbState === 1 || dbState === 2;

  const payload = {
    status: dbOk ? 'ok' : 'degraded',
    uptime: Math.floor(process.uptime()),
    db: dbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    env: config.app.env,
  };

  res.status(dbOk ? 200 : 503).json(payload);
});

export default router;
`;
}
