export function generateRateLimitMiddleware(config) {
  const isTs = config.language === 'ts';
  const store = config.rateLimitStore || 'memory';

  const storeImport =
    store === 'mongo'
      ? `import { MongoStore } from 'rate-limit-mongo';
import { config as appConfig } from '@/config/config.js';`
      : store === 'redis'
        ? `import { RedisStore } from 'rate-limit-redis';
import { createClient } from 'redis';

const redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
redisClient.connect().catch(console.error);`
        : '';

  const storeFactory =
    store === 'mongo'
      ? `// Shared store instance — avoids opening multiple DB connections
const mongoStore = new MongoStore({
  uri: appConfig.db.uri,
  collectionName: 'rate_limits',
  expireTimeMs: 60 * 60 * 1000, // TTL covers the longest window (1h upload limit)
});`
      : store === 'redis'
        ? `const createRedisStore = (prefix${isTs ? ': string' : ''}) => new RedisStore({
  prefix,
  sendCommand: (...args${isTs ? ': string[]' : ''}) => redisClient.sendCommand(args),
});`
        : '';

  const generalStore =
    store === 'mongo'
      ? `  store: mongoStore,`
      : store === 'redis'
        ? `  store: createRedisStore('rl:general:'),`
        : '';

  const authStore =
    store === 'mongo'
      ? `  store: mongoStore,`
      : store === 'redis'
        ? `  store: createRedisStore('rl:auth:'),`
        : '';

  const uploadStore =
    store === 'mongo'
      ? `  store: mongoStore,`
      : store === 'redis'
        ? `  store: createRedisStore('rl:upload:'),`
        : '';

  return `import rateLimit from 'express-rate-limit';
${storeImport}

// Skip rate limiting in test environment
const skipInTest = () => process.env.NODE_ENV === 'test';

${storeFactory}

/** General API rate limit: 200 req / 1 min */
export const rateLimitGeneral = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: 'TOO_MANY_REQUESTS',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
${generalStore}
});

/** Auth endpoints: 10 req / 15 min */
export const rateLimitAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'TOO_MANY_LOGIN_ATTEMPTS',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
${authStore}
});

/** Upload endpoints: 20 req / 1 hour */
export const rateLimitUpload = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'TOO_MANY_UPLOAD_REQUESTS',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
${uploadStore}
});
`;
}
