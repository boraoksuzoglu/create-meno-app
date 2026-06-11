import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '@/config/config.js';
import { Express } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Auto Swagger
 * ─────────────
 * Scans all *.routes.ts files and builds OpenAPI paths automatically.
 *
 * How to document a route:
 *   Add a comment starting with "// @doc" on the line ABOVE the route:
 *
 *     // @doc List all products
 *     router.get("/", ctrl.list);
 *
 *     // @doc Create a product | 201
 *     router.post("/", validateBody(createProductSchema), ctrl.create);
 *
 * Format:  // @doc <summary> [| <successStatusCode>]
 *
 * The system automatically:
 *   - Detects HTTP method and path from the router call
 *   - Extracts Joi validation schemas for request body/query docs
 *   - Converts Joi schemas to OpenAPI schema objects
 *   - Groups routes by module name as tags
 *   - Detects :param path parameters
 *   - Detects isAuthenticated middleware for security requirements
 *
 * Routes WITHOUT @doc are excluded from the docs.
 */

// ── Joi to OpenAPI converter ──────────────────────────────────────────────────

const joiTypeMap: Record<string, Record<string, any>> = {
  string:  { type: 'string' },
  number:  { type: 'number' },
  boolean: { type: 'boolean' },
  date:    { type: 'string', format: 'date-time' },
  array:   { type: 'array' },
  object:  { type: 'object' },
};

const joiToOpenApi = (joiSchema: any): Record<string, any> | null => {
  if (!joiSchema || !joiSchema.describe) return null;
  try { return joiDescToOpenApi(joiSchema.describe()); }
  catch { return null; }
};

const joiDescToOpenApi = (desc: any): Record<string, any> => {
  if (!desc) return { type: 'object' };

  if (desc.type === "object" && desc.keys) {
    const properties: Record<string, any> = {};
    const required: string[] = [];
    for (const [key, child] of Object.entries(desc.keys)) {
      properties[key] = joiDescToOpenApi(child as any);
      const flags = (child as any).flags || {};
      if (flags.presence === 'required') required.push(key);
    }
    return {
      type: 'object',
      ...(Object.keys(properties).length ? { properties } : {}),
      ...(required.length ? { required } : {}),
    };
  }

  const base = joiTypeMap[desc.type] || { type: 'string' };
  const result: Record<string, any> = { ...base };
  if (desc.rules) {
    for (const rule of desc.rules) {
      if (rule.name === 'email') result.format = 'email';
      if (rule.name === 'min') result.minLength = rule.args?.limit;
      if (rule.name === 'max') result.maxLength = rule.args?.limit;
    }
  }
  if (desc.allow && desc.allow.length > 0) {
    const filtered = desc.allow.filter((v: any) => v !== "" && v !== null);
    if (filtered.length > 0) result.enum = filtered;
  }
  return result;
};

// ── Route file parser ──────────────────────────────────────────────────────────

const parseRouteFile = (filePath: string) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const endpoints = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('// @doc')) continue;

    const docContent = line.replace('// @doc', '').trim();
    const [summary, statusStr] = docContent.split('|').map((s: string) => s.trim());
    const status = statusStr ? parseInt(statusStr, 10) : undefined;

    for (let j = i + 1; j < lines.length; j++) {
      const nextLine = lines[j].trim();
      if (!nextLine || nextLine.startsWith('//')) continue;

      const routeMatch = nextLine.match(
        /router\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/i
      );

      if (routeMatch) {
        const method = routeMatch[1].toLowerCase();
        const routePath = routeMatch[2];
        const hasAuth = nextLine.includes('isAuthenticated');

        let validationVar = null;
        let validationType = null;
        const bodyMatch = nextLine.match(/validateBody\(\s*(\w+)/);
        const queryMatch = nextLine.match(/validateQuery\(\s*(\w+)/);
        if (bodyMatch) { validationVar = bodyMatch[1]; validationType = 'body'; }
        else if (queryMatch) { validationVar = queryMatch[1]; validationType = 'query'; }

        endpoints.push({
          method, path: routePath,
          summary: summary || `${method.toUpperCase()} ${routePath}`,
          status: status || (method === 'post' ? 201 : 200),
          hasAuth, validationVar, validationType,
        });
      }
      break;
    }
  }
  return endpoints;
};

// ── Validation schema resolver ─────────────────────────────────────────────────

const resolveValidationSchema = async (moduleDir: string, moduleName: string, varName: string) => {
  try {
    const valFile = path.join(moduleDir, `${moduleName}.validation.ts`);
    if (!fs.existsSync(valFile)) return null;
    const { pathToFileURL } = await import('url');
    const mod = await import(pathToFileURL(valFile).href);
    return mod[varName] || null;
  } catch { return null; }
};

// ── Build OpenAPI document ────────────────────────────────────────────────────

const buildSwaggerDoc = async () => {
  const modulesDir = path.join(__dirname, '../modules');
  const paths: Record<string, any> = {};
  const tags: any[] = [];

  if (!fs.existsSync(modulesDir)) return { paths, tags };

  const entries = fs.readdirSync(modulesDir, { withFileTypes: true });
  const moduleDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  for (const moduleName of moduleDirs.sort()) {
    const moduleDir = path.join(modulesDir, moduleName);
    const routeFile = path.join(moduleDir, `${moduleName}.routes.ts`);
    if (!fs.existsSync(routeFile)) continue;

    const endpoints = parseRouteFile(routeFile);
    if (endpoints.length === 0) continue;

    const tagName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
    tags.push({ name: tagName, description: `${tagName} endpoints` });

    for (const ep of endpoints) {
      const fullPath = `/${moduleName}${ep.path === '/' ? '' : ep.path}`
        .replace(/:([a-zA-Z]+)/g, '{$1}');

      if (!paths[fullPath]) paths[fullPath] = {};

      const operation: Record<string, any> = {
        tags: [tagName],
        summary: ep.summary,
        responses: {
          [ep.status]: { description: 'Success' },
          ...(ep.hasAuth ? { 401: { description: 'Unauthorized' } } : {}),
        },
      };

      if (ep.hasAuth) operation.security = [{ cookieAuth: [] }];

      const paramMatches = ep.path.match(/:([a-zA-Z]+)/g);
      if (paramMatches) {
        operation.parameters = paramMatches.map((p: string) => ({
          name: p.replace(':', ''), in: 'path', required: true, schema: { type: 'string' },
        }));
      }

      if (ep.validationVar) {
        const joiSchema = await resolveValidationSchema(moduleDir, moduleName, ep.validationVar);
        const openApiSchema = joiToOpenApi(joiSchema);
        if (openApiSchema && ep.validationType === 'body') {
          operation.requestBody = {
            required: true, content: { 'application/json': { schema: openApiSchema } },
          };
        } else if (openApiSchema && ep.validationType === 'query' && openApiSchema.properties) {
          operation.parameters = [
            ...(operation.parameters || []),
            ...Object.entries(openApiSchema.properties).map(([pName, schema]) => ({
              name: pName, in: 'query',
              required: (openApiSchema.required || []).includes(pName),
              schema,
            })),
          ];
        }
      }

      paths[fullPath][ep.method] = operation;
    }
  }

  return { paths, tags };
};

// ── Setup ─────────────────────────────────────────────────────────────────────

export const setupSwagger = async (app: Express): Promise<void> => {
  const { paths, tags } = await buildSwaggerDoc();

  const doc = {
    openapi: '3.0.0',
    info: {
      title: config.app.name,
      version: '1.0.0',
      description: 'Auto-generated API documentation. Add // @doc comments above routes to include them.',
    },
    servers: [
      { url: `http://localhost:${config.app.port}`, description: "Local" },
    ],
    components: {
      securitySchemes: {
        cookieAuth: { type: 'apiKey', in: 'cookie', name: 'connect.sid' },
      },
    },
    tags,
    paths,
  };

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(doc, {
    customSiteTitle: `${config.app.name} API Docs`,
    swaggerOptions: { persistAuthorization: true },
  }));
};