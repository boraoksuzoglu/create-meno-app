export function generateCorsMiddleware(config) {
  const isTs = config.language === 'ts';

  if (isTs) {
    return `import cors from 'cors';
import { Request, Response, NextFunction } from 'express';

const getAllowedOrigins = (): string[] =>
  process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://localhost:3001'];

const corsOptions = {
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

/**
 * Static CORS — uses CORS_ORIGIN env variable.
 * Use for protected (authenticated) endpoints.
 */
export const staticCors = () =>
  cors({ ...corsOptions, origin: getAllowedOrigins() });

/**
 * Dynamic CORS — extend this to support custom domains from DB.
 */
export const dynamicCors = (req: Request, res: Response, next: NextFunction): void => {
  const origin = req.headers.origin;
  if (!origin) return next();

  const allowed = getAllowedOrigins();
  if (allowed.includes(origin)) {
    cors({ ...corsOptions, origin })(req, res, next);
  } else {
    res.status(403).json({ status: 403, message: 'CORS_NOT_ALLOWED' });
  }
};
`;
  }

  return `import cors from 'cors';

const getAllowedOrigins = () =>
  process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://localhost:3001'];

const corsOptions = {
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

/**
 * Static CORS — uses CORS_ORIGIN env variable.
 * Use for protected (authenticated) endpoints.
 */
export const staticCors = () =>
  cors({ ...corsOptions, origin: getAllowedOrigins() });

/**
 * Dynamic CORS — extend this to support custom domains from DB.
 */
export const dynamicCors = (req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) return next();

  const allowed = getAllowedOrigins();
  if (allowed.includes(origin)) {
    cors({ ...corsOptions, origin })(req, res, next);
  } else {
    res.status(403).json({ status: 403, message: 'CORS_NOT_ALLOWED' });
  }
};
`;
}
