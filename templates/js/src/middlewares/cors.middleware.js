import cors from 'cors';
import { config } from '@/config/config.js';

const corsOptions = {
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

/**
 * Static CORS — uses CORS_ORIGIN env variable (via config).
 * Use for protected (authenticated) endpoints.
 */
export const staticCors = () =>
  cors({ ...corsOptions, origin: config.cors.origins });

/**
 * Dynamic CORS — extend this to support custom domains from DB.
 */
export const dynamicCors = (req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) return next();

  const allowed = config.cors.origins;
  if (allowed.includes(origin)) {
    cors({ ...corsOptions, origin })(req, res, next);
  } else {
    res.status(403).json({ status: 403, message: 'CORS_NOT_ALLOWED' });
  }
};
