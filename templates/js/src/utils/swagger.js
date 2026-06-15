import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '@/config/config.js';
import {
  parseRouteFile,
  resolveValidationSchema,
  joiToSchema,
  inferResponseExample,
} from '@/utils/doc-introspect.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Auto Swagger
 * ─────────────
 * Scans all *.routes.js files and builds OpenAPI paths automatically.
 *
 * Request body & query params are derived from the Joi schemas referenced by
 * validateBody(...) / validateQuery(...). Response examples are inferred from the
 * controller → service → model chain. None of this needs hand-written examples —
 * see src/utils/doc-introspect.js (shared with `npm run docs`).
 *
 * Annotations (all optional except @doc):
 *   // @doc <summary> [| <successStatusCode>]   ← include the route in the docs
 *   // @desc <description>
 *   // @response <code> <text|json>             ← overrides the inferred response
 *
 * Routes WITHOUT @doc are excluded from the docs.
 */

const buildSwaggerDoc = async () => {
  const modulesDir = path.join(__dirname, '../modules');
  const modelsDir = path.join(__dirname, '../models');
  const paths = {};
  const tags = [];

  if (!fs.existsSync(modulesDir)) return { paths, tags };

  const entries = fs.readdirSync(modulesDir, { withFileTypes: true });
  const moduleDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  for (const moduleName of moduleDirs.sort()) {
    const moduleDir = path.join(modulesDir, moduleName);
    const routeFile = path.join(moduleDir, `${moduleName}.routes.js`);
    if (!fs.existsSync(routeFile)) continue;

    const endpoints = parseRouteFile(routeFile);
    if (endpoints.length === 0) continue;

    const tagName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
    tags.push({ name: tagName, description: `${tagName} endpoints` });

    const valFile = path.join(moduleDir, `${moduleName}.validation.js`);

    for (const ep of endpoints) {
      const fullPath = `/${moduleName}${ep.path === '/' ? '' : ep.path}`.replace(
        /:([a-zA-Z]+)/g,
        '{$1}'
      );
      if (!paths[fullPath]) paths[fullPath] = {};

      const descParts = [];
      if (ep.desc) descParts.push(ep.desc);
      if (ep.roles.length) descParts.push(`Requires role: ${ep.roles.join(', ')}`);

      const operation = {
        tags: [tagName],
        summary: ep.summary,
        ...(descParts.length ? { description: descParts.join(' — ') } : {}),
        responses: {},
      };

      if (ep.hasAuth) operation.security = [{ cookieAuth: [] }];

      // ── Path params ──────────────────────────────────────────────────────
      const paramMatches = ep.path.match(/:([a-zA-Z]+)/g);
      if (paramMatches) {
        operation.parameters = paramMatches.map((p) => ({
          name: p.replace(':', ''),
          in: 'path',
          required: true,
          schema: { type: 'string' },
        }));
      }

      // ── Request body (from Joi) ──────────────────────────────────────────
      if (ep.bodyVar) {
        const schema = joiToSchema(await resolveValidationSchema(valFile, ep.bodyVar));
        if (schema) {
          operation.requestBody = {
            required: true,
            content: { 'application/json': { schema } },
          };
        }
      }

      // ── Query params (from Joi) ──────────────────────────────────────────
      if (ep.queryVar) {
        const schema = joiToSchema(await resolveValidationSchema(valFile, ep.queryVar));
        if (schema && schema.properties) {
          operation.parameters = [
            ...(operation.parameters || []),
            ...Object.entries(schema.properties).map(([pName, pSchema]) => ({
              name: pName,
              in: 'query',
              required: (schema.required || []).includes(pName),
              schema: pSchema,
            })),
          ];
        }
      }

      // ── Responses ────────────────────────────────────────────────────────
      const inferred = inferResponseExample(moduleDir, moduleName, ep, 'js', modelsDir);
      const successCode = inferred?.status || ep.status;
      operation.responses[successCode] = inferred
        ? { description: 'Success', content: { 'application/json': { example: inferred.example } } }
        : { description: 'Success' };
      if (ep.hasAuth) operation.responses[401] = { description: 'Unauthorized' };
      if (ep.roles.length) operation.responses[403] = { description: 'Forbidden' };

      // // @response entries override the inferred ones.
      for (const r of ep.responses) {
        let example;
        try {
          example = JSON.parse(r.body);
        } catch {
          example = undefined;
        }
        operation.responses[r.code] = example
          ? { description: 'Response', content: { 'application/json': { example } } }
          : { description: r.body };
      }

      paths[fullPath][ep.method.toLowerCase()] = operation;
    }
  }

  return { paths, tags };
};

export const setupSwagger = async (app) => {
  const { paths, tags } = await buildSwaggerDoc();

  const doc = {
    openapi: '3.0.0',
    info: {
      title: config.app.name,
      version: '1.0.0',
      description:
        'Auto-generated API documentation. Add // @doc comments above routes to include them.',
    },
    servers: [{ url: `http://localhost:${config.app.port}`, description: 'Local' }],
    components: {
      securitySchemes: {
        cookieAuth: { type: 'apiKey', in: 'cookie', name: 'connect.sid' },
      },
    },
    tags,
    paths,
  };

  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(doc, {
      customSiteTitle: `${config.app.name} API Docs`,
      swaggerOptions: { persistAuthorization: true },
    })
  );
};
