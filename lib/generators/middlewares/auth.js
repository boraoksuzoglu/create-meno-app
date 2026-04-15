export function generateAuthMiddleware(config) {
  const { language, includeRbac } = config;
  const isTs = language === 'ts';

  const rbacMiddleware = includeRbac
    ? `
/**
 * Role-based access control middleware.
 * Usage: router.get('/admin', isAuthenticated, hasRole(['admin']), handler)
 */
export const hasRole = (allowedRoles${isTs ? ': string[]' : ''}) => {
  return ${isTs ? '(req: Request, _res: Response, next: NextFunction): void' : '(req, res, next)'} => {
    const userRole = req.session${isTs ? '' : ''}?.user?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      throw createError(403, 'FORBIDDEN');
    }
    next();
  };
};
`
    : '';

  if (isTs) {
    return `import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    user?: { _id: string; email: string; role: string };
  }
}

/**
 * Ensures the request has an active session.
 */
export const isAuthenticated = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.session?.userId) {
    (req as any).userId = req.session.userId;
    return next();
  }
  throw createError(401, 'UNAUTHORIZED');
};
${rbacMiddleware}`;
  }

  return `import createError from 'http-errors';

/**
 * Ensures the request has an active session.
 */
export const isAuthenticated = (req, res, next) => {
  if (req.session?.userId) {
    req.userId = req.session.userId;
    return next();
  }
  throw createError(401, 'UNAUTHORIZED');
};
${rbacMiddleware}`;
}
