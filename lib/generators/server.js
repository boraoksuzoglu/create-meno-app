export function generateServerFile(config) {
  const { language, includeRateLimit, includeLogger } = config;
  const isTs = language === 'ts';
  const ext = isTs ? 'ts' : 'js';

  const loggerImport = includeLogger ? `import logger from '@/utils/logger.js';` : '';

  const rateLimitImport = includeRateLimit
    ? `import { rateLimitGeneral } from '@/middlewares/ratelimit.middleware.js';`
    : '';

  const rateLimitUse = includeRateLimit ? `    app.use(rateLimitGeneral);` : '';

  const logStart = includeLogger
    ? `logger.info('SERVER_STARTED', { port: config.app.port });`
    : `console.log(\`[Server] Listening on port \${config.app.port}\`);`;

  const logRoutes = includeLogger
    ? `logger.info('ROUTES_LOADED', { routes: mounted });`
    : `console.log('[RouteLoader] Mounted:', mounted.join(', '));`;

  const logDbConnect = includeLogger
    ? `logger.info('DATABASE_CONNECTED');`
    : `console.log('[DB] Connected to MongoDB');`;

  return `import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import helmet from 'helmet';
import { config } from '@/config/config.js';
import { staticCors } from '@/middlewares/cors.middleware.js';
import { notFound, errorHandler } from '@/middlewares/error.middleware.js';
import { requestId } from '@/middlewares/request-id.middleware.js';
import { loadRoutes } from '@/utils/route-loader.js';
import { registerGracefulShutdown } from '@/utils/graceful-shutdown.js';
${config.includeSwagger ? `import { setupSwagger } from '@/utils/swagger.js';` : ''}
import { ensureIndexes } from '@/utils/db-indexes.js';
import databaseConnection from '@/utils/database.js';
${rateLimitImport}
${loggerImport}

const startServer = async () => {
  try {
    await databaseConnection.connect();
    ${logDbConnect}
    await ensureIndexes();

    const app = express();
    const httpServer = createServer(app);

    // ── Security ──────────────────────────────────────────────────────────────
    app.set('trust proxy', 1);
    app.use(helmet());
    app.use(staticCors());

    // ── Request ID (attach before everything else) ────────────────────────────
    app.use(requestId);

    // ── Body & cookies ────────────────────────────────────────────────────────
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    // ── Session ───────────────────────────────────────────────────────────────
    app.use(session({
      secret: config.session.secret,
      name: config.session.cookieName,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: config.db.uri,
        ttl: config.session.ttlSeconds,
      }),
      cookie: {
        httpOnly: true,
        secure: config.app.isProduction,
        // 'lax' protects against CSRF for same-site requests.
        // Use 'none' only if your frontend is on a different domain (requires secure: true).
        // Use 'strict' for maximum CSRF protection (breaks cross-origin frontend flows).
        sameSite: 'lax',
        maxAge: config.session.ttlSeconds * 1000,
      },
    }));

    // ── Rate limiting ─────────────────────────────────────────────────────────
${rateLimitUse}

    // ── API docs (development only) ───────────────────────────────────────────
${
  config.includeSwagger
    ? `    if (!config.app.isProduction) {
      await setupSwagger(app);
    }`
    : ''
}

    // ── Auto-load all *.routes.${ext} from src/modules/ ───────────────────────
    // Convention: src/modules/<name>/<name>.routes.${ext} → app.use('/<name>', router)
    // To skip a module, add "// @no-auto-load" as the first line of its routes file.
    const mounted = await loadRoutes(app);
    ${logRoutes}

    // ── Error handling (must be last) ─────────────────────────────────────────
    app.use(notFound);
    app.use(errorHandler);

    // ── Start listening ───────────────────────────────────────────────────────
    httpServer.listen(config.app.port, () => { ${logStart} });

    // ── Graceful shutdown ─────────────────────────────────────────────────────
    registerGracefulShutdown(httpServer);

  } catch (err) {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  }
};

startServer();
`;
}
