export function generateErrorMiddleware(config) {
  const { language, includeLogger } = config;
  const isTs = language === 'ts';

  const loggerImport = includeLogger
    ? `import { logError, logWarning } from '@/utils/logger.js';`
    : '';

  const logErrorCall = includeLogger
    ? `logError(err, { method: req.method, url: req.url, ip: req.ip });`
    : `console.error(err);`;

  const logWarnCall = includeLogger
    ? `logWarning(err.message, { method: req.method, url: req.url, ip: req.ip });`
    : `console.warn(err.message);`;

  if (isTs) {
    return `import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
${loggerImport}

export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  next(createError(404, 'NOT_FOUND'));
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode: number = err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  if (statusCode >= 500) {
    ${logErrorCall}
  } else if (statusCode === 401 || statusCode === 403) {
    ${logWarnCall}
  }

  const response: Record<string, unknown> = {
    status: statusCode,
    message: err.message || 'INTERNAL_SERVER_ERROR',
  };

  if (err.data) response.data = err.data;
  if (!isProduction && err.stack) response.stack = err.stack;

  res.status(statusCode).json(response);
};
`;
  }

  return `import createError from 'http-errors';
${loggerImport}

export const notFound = (req, res, next) => {
  next(createError(404, 'NOT_FOUND'));
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  if (statusCode >= 500) {
    ${logErrorCall}
  } else if (statusCode === 401 || statusCode === 403) {
    ${logWarnCall}
  }

  const response = {
    status: statusCode,
    message: err.message || 'INTERNAL_SERVER_ERROR',
  };

  if (err.data) response.data = err.data;
  if (!isProduction && err.stack) response.stack = err.stack;

  res.status(statusCode).json(response);
};
`;
}
