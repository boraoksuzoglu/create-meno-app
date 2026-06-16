import createError from 'http-errors';
import { OAuth2Client } from 'google-auth-library';
import { config } from '@/config/config.js';

// One client is reused across requests; verifyIdToken fetches and caches Google's
// public signing keys internally, so no network round-trip happens per call.
const client = new OAuth2Client();

/**
 * Verify a Google ID token (issued to the web GIS client or a native iOS/Android
 * SDK) and return a normalized identity. The token's `aud` claim must match one
 * of the configured client IDs — that is the entire trust check.
 */
export const verifyGoogleToken = async (idToken) => {
  let ticket;
  try {
    ticket = await client.verifyIdToken({ idToken, audience: config.google.clientIds });
  } catch {
    throw createError(401, 'INVALID_GOOGLE_TOKEN');
  }

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) throw createError(401, 'INVALID_GOOGLE_TOKEN');

  return {
    provider: 'google',
    providerId: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified === true,
    name: payload.name || null,
  };
};
