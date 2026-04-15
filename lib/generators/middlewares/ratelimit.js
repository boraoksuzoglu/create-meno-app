export function generateRateLimitMiddleware(config) {
  const isTs = config.language === 'ts';

  return `import rateLimit from 'express-rate-limit';

// Skip rate limiting in test environment
const skipInTest = () => process.env.NODE_ENV === 'test';

/** General API rate limit: 200 req / 1 min */
export const rateLimitGeneral = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: 'TOO_MANY_REQUESTS',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
});

/** Auth endpoints: 10 req / 15 min */
export const rateLimitAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'TOO_MANY_LOGIN_ATTEMPTS',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
});

/** Upload endpoints: 20 req / 1 hour */
export const rateLimitUpload = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'TOO_MANY_UPLOAD_REQUESTS',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
});
`;
}
