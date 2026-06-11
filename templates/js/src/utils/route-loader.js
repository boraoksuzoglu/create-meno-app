import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Wraps a single async route handler so errors are forwarded to next().
 * This is applied automatically by the route loader — you never call it manually.
 */
const asyncWrap = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Walks every layer in a router and wraps async handlers automatically.
 * This means controllers can be plain async functions — no try/catch needed.
 */
const wrapRouterHandlers = (router) => {
  if (!router?.stack) return;

  for (const layer of router.stack) {
    // A route layer (e.g. router.get('/'))
    if (layer.route) {
      for (const routeLayer of layer.route.stack) {
        if (typeof routeLayer.handle === 'function' && routeLayer.handle.toString().startsWith('async')) {
          routeLayer.handle = asyncWrap(routeLayer.handle);
        }
      }
    }
    // A middleware layer (e.g. router.use(subRouter))
    if (typeof layer.handle === 'function' && layer.handle.toString().startsWith('async')) {
      layer.handle = asyncWrap(layer.handle);
    }
  }
};

/**
 * Auto Route Loader
 * ─────────────────
 * Scans src/modules for files matching *.routes.js and mounts them
 * automatically on Express based on their directory name.
 *
 * Convention:
 *   src/modules/<name>/<name>.routes.js  →  app.use('/<name>', router)
 *
 * All async route handlers are wrapped automatically — thrown errors and
 * rejected promises are forwarded to the Express error handler.
 * Controllers can be plain async functions. No asyncHandler needed.
 *
 * To opt a module out of auto-loading, add this comment on the first line:
 *   // @no-auto-load
 */
export const loadRoutes = async (app) => {
  const modulesDir = path.join(__dirname, '../modules');

  if (!fs.existsSync(modulesDir)) return [];

  const mounted = [];
  const entries = fs.readdirSync(modulesDir, { withFileTypes: true });
  const moduleDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  for (const moduleName of moduleDirs.sort()) {
    const routeFile = path.join(modulesDir, moduleName, `${moduleName}.routes.js`);

    if (!fs.existsSync(routeFile)) continue;

    const firstLine = fs.readFileSync(routeFile, 'utf8').split('\n')[0];
    if (firstLine.includes('@no-auto-load')) continue;

    const fileUrl = pathToFileURL(routeFile).href;
    const routeModule = await import(fileUrl);
    const router = routeModule.default;

    if (!router) {
      console.warn(`[RouteLoader] ${routeFile} has no default export — skipped`);
      continue;
    }

    // Automatically wrap all async handlers in this router
    wrapRouterHandlers(router);

    const prefix = `/${moduleName}`;
    app.use(prefix, router);
    mounted.push(prefix);
  }

  return mounted;
};
