/**
 * Generates src/types/ — shared TypeScript interfaces.
 * Only generated for TypeScript projects.
 */
export function generateSharedTypes(config) {
  if (config.language !== 'ts') return null;

  return {
    'express.d.ts': `import 'express';

/**
 * Augments Express Request and Response with MENO-specific properties.
 * These are set by middlewares and available in all controllers.
 */
declare module 'express' {
  interface Request {
    /** Set by auth.middleware.ts — the authenticated user's ID */
    userId?: string;
  }

  interface Locals {
    /** Set by request-id.middleware.ts — unique ID for this request */
    requestId: string;
  }
}
`,
    'pagination.ts': `/**
 * Shared pagination types.
 * Matches the shape returned by paginatedResponse() in @/utils/paginate.ts
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}
`,
    'api.ts': `/**
 * Common API response shapes.
 */
export interface ApiSuccess<T = unknown> {
  data?: T;
  message?: string;
}

export interface ApiError {
  status: number;
  message: string;
  stack?: string;
}
`,
  };
}
