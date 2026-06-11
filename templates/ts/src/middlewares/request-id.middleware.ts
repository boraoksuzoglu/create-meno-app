import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

/**
 * Request ID Middleware
 * ─────────────────────
 * Attaches a unique ID to every request for distributed tracing.
 *
 * - Reuses X-Request-ID if the upstream (e.g. load balancer) already set one.
 * - Exposes the ID on res.locals.requestId and echoes it back in the response header.
 * - The logger automatically picks it up via res.locals.requestId.
 *
 * Usage in logs:
 *   logger.info('ORDER_CREATED', { requestId: res.locals.requestId, orderId });
 */
export const requestId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const id = (req.headers['x-request-id'] as string) || randomUUID();
  res.locals.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
};
