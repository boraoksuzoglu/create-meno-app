/**
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
};
