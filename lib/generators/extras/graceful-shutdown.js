export function generateGracefulShutdown(config) {
  const { language, includeLogger } = config;
  const isTs = language === 'ts';

  const logImport = includeLogger ? `import logger from '@/utils/logger.js';` : '';
  const log = (msg, meta = '{}') =>
    includeLogger ? `logger.info('${msg}', ${meta});` : `console.log('[Shutdown] ${msg}');`;

  return `import { Server } from 'http';
import databaseConnection from '@/utils/database.js';
${logImport}

const SHUTDOWN_TIMEOUT_MS = 10_000;

/**
 * Graceful Shutdown
 * ──────────────────
 * Listens for SIGTERM and SIGINT (Docker stop, Ctrl+C, Kubernetes pod eviction).
 *
 * On signal:
 *  1. Stop accepting new connections (server.close)
 *  2. Wait for in-flight requests to finish (up to SHUTDOWN_TIMEOUT_MS)
 *  3. Close MongoDB connection
 *  4. Exit cleanly with code 0
 *
 * If shutdown takes too long, forces exit with code 1.
 *
 * @param server - The http.Server instance returned by app.listen()
 */
export const registerGracefulShutdown = (server${isTs ? ': Server' : ''})${isTs ? ': void' : ''} => {
  const shutdown = async (signal${isTs ? ': string' : ''}) => {
    ${log('SHUTDOWN_INITIATED', '{ signal }')}

    // Force-exit if graceful shutdown takes too long
    const forceExit = setTimeout(() => {
      ${log('SHUTDOWN_TIMEOUT')}
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref(); // don't keep the event loop alive just for this timer

    try {
      // 1. Stop accepting new HTTP connections
      await new Promise${isTs ? '<void>' : ''}((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve()))
      );
      ${log('HTTP_SERVER_CLOSED')}

      // 2. Close database connection
      await databaseConnection.disconnect();
      ${log('DATABASE_DISCONNECTED')}

      clearTimeout(forceExit);
      ${log('SHUTDOWN_COMPLETE')}
      process.exit(0);
    } catch (err${isTs ? ': any' : ''}) {
      ${log('SHUTDOWN_ERROR', '{ error: err?.message }')}
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
};
`;
}
