export function generateErrorCodes(config) {
  const isTs = config.language === 'ts';

  return `/**
 * Error Codes
 * ────────────
 * Centralised error code constants.
 * Use these instead of raw strings to avoid typos and enable IDE autocomplete.
 *
 * Usage:
 *   import { ErrorCodes } from '@/constants/error-codes.js';
 *   throw createError(404, ErrorCodes.USER_NOT_FOUND);
 */
export const ErrorCodes = {
  // Generic
  NOT_FOUND:                'NOT_FOUND',
  UNAUTHORIZED:             'UNAUTHORIZED',
  FORBIDDEN:                'FORBIDDEN',
  VALIDATION_ERROR:         'VALIDATION_ERROR',
  INTERNAL_ERROR:           'INTERNAL_SERVER_ERROR',
  TOO_MANY_REQUESTS:        'TOO_MANY_REQUESTS',
  // Auth
  EMAIL_ALREADY_EXISTS:     'EMAIL_ALREADY_EXISTS',
  INVALID_CREDENTIALS:      'INVALID_CREDENTIALS',
  USER_NOT_FOUND:           'USER_NOT_FOUND',
  INVALID_CURRENT_PASSWORD: 'INVALID_CURRENT_PASSWORD',
  INVALID_OR_EXPIRED_TOKEN: 'INVALID_OR_EXPIRED_TOKEN',
  PASSWORDS_DO_NOT_MATCH:   'PASSWORDS_DO_NOT_MATCH',
}${isTs ? ' as const' : ''};
${isTs ? '\nexport type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];\n' : ''}`;
}

export function generateRoles(config) {
  const isTs = config.language === 'ts';

  return `/**
 * Roles
 * ──────
 * User role constants. Extend as needed.
 */
export const Roles = {
  USER:  'user',
  ADMIN: 'admin',
}${isTs ? ' as const' : ''};
${isTs ? '\nexport type Role = typeof Roles[keyof typeof Roles];\n' : ''}`;
}

export function generatePaginateUtil(config) {
  const isTs = config.language === 'ts';

  return `/**
 * Pagination utility
 * ───────────────────
 * Extracts and validates page/limit from query params.
 * Returns full pagination metadata including totalPages, hasNext, hasPrev.
 *
 * Usage (in a service):
 *   const { page, limit, skip } = paginate(req.query);
 *   const [items, total] = await Promise.all([
 *     Model.find().skip(skip).limit(limit),
 *     Model.countDocuments(),
 *   ]);
 *   return paginatedResponse(items, total, page, limit);
 */
${
  isTs
    ? `export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const paginate = (query: { page?: string; limit?: string }): PaginationParams => {`
    : `export const paginate = (query = {}) => {`
}
  const page  = Math.max(Number(query.page)  || 1, 1);
  const limit = Math.min(Number(query.limit) || 20, 100);
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Wraps a list result with full pagination metadata.
 *
 * @example
 * const { page, limit, skip } = paginate(req.query);
 * const [items, total] = await Promise.all([Model.find().skip(skip).limit(limit), Model.countDocuments()]);
 * return paginatedResponse(items, total, page, limit);
 * // → { items, total, page, limit, totalPages, hasNext, hasPrev }
 */
export const paginatedResponse = ${
    isTs
      ? '<T>(items: T[], total: number, page: number, limit: number): PaginatedResponse<T> => {'
      : '(items, total, page, limit) => {'
  }
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;
  return {
    items,
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};
`;
}
