export function generateDbIndexHelper(config) {
  const { language, includeLogger } = config;
  const isTs = language === 'ts';

  const logImport = includeLogger ? `import logger from '@/utils/logger.js';` : '';
  const logInfo = (msg, meta = '{}') =>
    includeLogger ? `logger.info('${msg}', ${meta});` : `console.log('[DB] ${msg}');`;
  const logWarn = (msg, meta = '{}') =>
    includeLogger ? `logger.warn('${msg}', ${meta});` : `console.warn('[DB] ${msg}');`;
  const logError = (msg, meta = '{}') =>
    includeLogger ? `logger.error('${msg}', ${meta});` : `console.error('[DB] ${msg}');`;

  return `import mongoose from 'mongoose';
${logImport}

/**
 * ensureIndexes
 * ─────────────
 * Calls syncIndexes() on every registered Mongoose model at startup.
 *
 * Why:
 *  - Mongoose does NOT automatically sync indexes in production.
 *  - Missing indexes cause slow queries and failed unique constraints.
 *  - This runs once at startup and logs what it finds.
 *
 * ⚠ WARNING — syncIndexes() drops any indexes that exist in MongoDB but are
 *   NOT defined in the Mongoose schema. On large collections this may cause
 *   temporary query degradation while indexes are rebuilt.
 *   Alternative: use model.createIndexes() to only ADD missing indexes
 *   without dropping existing ones.
 *
 * When to call:
 *   Call this AFTER databaseConnection.connect() in server.${isTs ? 'ts' : 'js'}.
 *   It is intentionally non-blocking — a failure here logs a warning
 *   but does NOT crash the server.
 *
 * Usage:
 *   import { ensureIndexes } from '@/utils/db-indexes.js';
 *   await ensureIndexes();
 */
export const ensureIndexes = async ()${isTs ? ': Promise<void>' : ''} => {
  const modelNames = mongoose.modelNames();

  if (modelNames.length === 0) {
    ${logWarn('NO_MODELS_REGISTERED')}
    return;
  }

  ${logInfo('SYNCING_INDEXES', '{ models: modelNames }')}

  const results = await Promise.allSettled(
    modelNames.map(async (name) => {
      const model = mongoose.model(name);
      await model.syncIndexes();
      return name;
    })
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').map((r) => (r${isTs ? ' as PromiseFulfilledResult<string>' : ''}).value);
  const failed    = results.filter((r) => r.status === 'rejected');

  if (succeeded.length > 0) {
    ${logInfo('INDEXES_SYNCED', '{ models: succeeded }')}
  }

  for (const result of failed) {
    const reason = (result${isTs ? ' as PromiseRejectedResult' : ''}).reason;
    ${logError('INDEX_SYNC_FAILED', '{ error: reason?.message ?? String(reason) }')}
  }
};
`;
}
