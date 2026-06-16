import createError from 'http-errors';
import appleSignin from 'apple-signin-auth';
import { config } from '@/config/config.js';

/**
 * Verify an Apple identity token (issued by Sign in with Apple JS on the web or
 * the native iOS/Android SDK) and return a normalized identity. The token's `aud`
 * must match one of the configured client IDs (Services ID for web, app bundle ID
 * for native).
 *
 * Apple only returns the user's name on the FIRST sign-in, and it arrives in the
 * client payload — not inside the token — so the client must forward it and we
 * accept it here.
 */
export const verifyAppleToken = async (identityToken, { nonce, name } = {}) => {
  let payload;
  try {
    payload = await appleSignin.verifyIdToken(identityToken, {
      audience: config.apple.clientIds,
      nonce,
    });
  } catch {
    throw createError(401, 'INVALID_APPLE_TOKEN');
  }

  if (!payload?.sub) throw createError(401, 'INVALID_APPLE_TOKEN');

  return {
    provider: 'apple',
    providerId: payload.sub,
    email: payload.email || null,
    emailVerified: String(payload.email_verified) === 'true',
    name: name || null,
  };
};
