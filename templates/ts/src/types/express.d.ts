import 'express';

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
