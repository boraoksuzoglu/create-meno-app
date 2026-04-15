import fs from 'fs';
import path from 'path';
import { generatePackageJson } from './generators/package-json.js';
import { generateEnvFiles } from './generators/env.js';
import { generateServerFile } from './generators/server.js';
import { generateDatabaseUtil } from './generators/database.js';
import { generateLoggerUtil } from './generators/logger.js';
import { generateErrorMiddleware } from './generators/middlewares/error.js';
import { generateCorsMiddleware } from './generators/middlewares/cors.js';
import { generateValidationMiddleware } from './generators/middlewares/validation.js';
import { generateRateLimitMiddleware } from './generators/middlewares/ratelimit.js';
import { generateAuthModule } from './generators/modules/auth.js';
import { generateAuthMiddleware } from './generators/middlewares/auth.js';
import { generatePathLoader } from './generators/path-loader.js';
import { generateRouteLoader } from './generators/route-loader.js';
import { generateJestConfig } from './generators/jest.js';
import { generateGitignore } from './generators/gitignore.js';
import { generateReadme } from './generators/readme.js';
import { generateUploadUtil } from './generators/upload.js';
import { generateExampleModule } from './generators/modules/example.js';
import { generateEmailService } from './generators/services/email.js';
import { generateEmailLocales } from './generators/services/email-locales.js';
import { generateEmailTemplates } from './generators/services/email-templates.js';
import { generateCreateAdminScript } from './generators/scripts/create-admin.js';
// Extras
import { generateHealthRoute } from './generators/extras/health.js';
import { generateConfigModule } from './generators/extras/config.js';
import { generateRequestIdMiddleware } from './generators/extras/request-id.js';
import { generateGracefulShutdown } from './generators/extras/graceful-shutdown.js';
import { generateSwaggerSetup } from './generators/extras/swagger.js';
import { generateAiContextFiles } from './generators/extras/ai-context.js';
import {
  generateEslintConfig,
  generatePrettierConfig,
  generatePrettierIgnore,
} from './generators/extras/eslint-prettier.js';
import {
  generateDockerfile,
  generateDockerCompose,
  generateDockerIgnore,
} from './generators/extras/docker.js';
import {
  generateCiWorkflow,
  generateDependabotConfig,
} from './generators/extras/github-actions.js';
import {
  generateErrorCodes,
  generateRoles,
  generatePaginateUtil,
} from './generators/extras/constants.js';
import { generateHuskySetup, getHuskyDeps } from './generators/extras/husky.js';
import { generateSharedTypes } from './generators/extras/types.js';
import { generateDbIndexHelper } from './generators/extras/db-indexes.js';

/**
 * Main project generator — orchestrates all file generation
 */
export async function generateProject(config, targetDir) {
  const { language: lang } = config;
  const ext = lang === 'ts' ? 'ts' : 'js';

  // ── Directory scaffold ──────────────────────────────────────────────────────
  const dirs = [
    'src/config',
    'src/middlewares',
    'src/models',
    'src/utils',
    'src/constants',
    'logs',
  ];

  if (config.includeAuth) {
    dirs.push('src/modules/auth');
    dirs.push('src/scripts');
  }

  dirs.push('src/modules/example');
  dirs.push('src/modules/health');

  if (config.includeEmail) {
    dirs.push('src/services/email');
    dirs.push('src/templates/emails');
    if (config.emailMultiLang) dirs.push('src/locales/email');
  }

  if (config.includeJest) dirs.push('src/__tests__/helpers');
  if (config.includeGithubActions) dirs.push('.github/workflows');

  dirs.forEach((d) => fs.mkdirSync(path.join(targetDir, d), { recursive: true }));

  // ── Root files ──────────────────────────────────────────────────────────────
  write(targetDir, 'package.json', generatePackageJson(config));
  write(targetDir, '.env.example', generateEnvFiles(config));
  write(targetDir, '.env', generateEnvFiles(config));
  write(targetDir, '.gitignore', generateGitignore());
  write(targetDir, 'README.md', generateReadme(config));

  if (lang === 'ts') write(targetDir, 'tsconfig.json', generateTsConfig());

  // ── ESLint + Prettier ───────────────────────────────────────────────────────
  if (config.includeEslint) {
    write(targetDir, 'eslint.config.js', generateEslintConfig(config));
    write(targetDir, '.prettierrc', generatePrettierConfig());
    write(targetDir, '.prettierignore', generatePrettierIgnore());
  }

  // ── Docker ──────────────────────────────────────────────────────────────────
  if (config.includeDocker) {
    write(targetDir, 'Dockerfile', generateDockerfile(config));
    write(targetDir, 'docker-compose.yml', generateDockerCompose(config));
    write(targetDir, '.dockerignore', generateDockerIgnore());
  }

  // ── GitHub Actions ──────────────────────────────────────────────────────────
  if (config.includeGithubActions) {
    write(targetDir, '.github/workflows/ci.yml', generateCiWorkflow(config));
    write(targetDir, '.github/dependabot.yml', generateDependabotConfig());
  }

  // ── Husky + lint-staged ─────────────────────────────────────────────────────
  if (config.includeEslint) {
    const husky = generateHuskySetup(config);
    write(targetDir, '.husky/pre-commit', husky.preCommit);
    // lint-staged config is injected into package.json via generatePackageJson
  }

  // ── Utils ───────────────────────────────────────────────────────────────────
  write(targetDir, `src/utils/path-loader.${ext}`, generatePathLoader(lang));
  write(targetDir, `src/utils/route-loader.${ext}`, generateRouteLoader(lang));
  write(targetDir, `src/utils/graceful-shutdown.${ext}`, generateGracefulShutdown(config));
  if (config.includeSwagger) {
    write(targetDir, `src/utils/swagger.${ext}`, generateSwaggerSetup(config));
  }
  write(targetDir, `src/utils/database.${ext}`, generateDatabaseUtil(lang));
  write(targetDir, `src/utils/db-indexes.${ext}`, generateDbIndexHelper(config));
  write(targetDir, `src/utils/paginate.${ext}`, generatePaginateUtil(config));
  if (config.includeLogger) write(targetDir, `src/utils/logger.${ext}`, generateLoggerUtil(lang));
  if (config.includeUpload) write(targetDir, `src/utils/upload.${ext}`, generateUploadUtil(config));

  // ── Shared TypeScript types ─────────────────────────────────────────────────
  if (lang === 'ts') {
    const types = generateSharedTypes(config);
    if (types) {
      Object.entries(types).forEach(([filename, content]) => {
        write(targetDir, `src/types/${filename}`, content);
      });
    }
  }

  // ── Config module ───────────────────────────────────────────────────────────
  write(targetDir, `src/config/config.${ext}`, generateConfigModule(config));

  // ── Constants ───────────────────────────────────────────────────────────────
  write(targetDir, `src/constants/error-codes.${ext}`, generateErrorCodes(config));
  write(targetDir, `src/constants/roles.${ext}`, generateRoles(config));

  // ── Middlewares ─────────────────────────────────────────────────────────────
  write(targetDir, `src/middlewares/error.middleware.${ext}`, generateErrorMiddleware(config));
  write(targetDir, `src/middlewares/cors.middleware.${ext}`, generateCorsMiddleware(config));
  write(
    targetDir,
    `src/middlewares/validation.middleware.${ext}`,
    generateValidationMiddleware(config)
  );
  write(
    targetDir,
    `src/middlewares/request-id.middleware.${ext}`,
    generateRequestIdMiddleware(config)
  );
  if (config.includeRateLimit)
    write(
      targetDir,
      `src/middlewares/ratelimit.middleware.${ext}`,
      generateRateLimitMiddleware(config)
    );
  if (config.includeAuth)
    write(targetDir, `src/middlewares/auth.middleware.${ext}`, generateAuthMiddleware(config));

  // ── Health module (auto-mounted at /health) ─────────────────────────────────
  write(targetDir, `src/modules/health/health.routes.${ext}`, generateHealthRoute(config));

  // ── Email service ───────────────────────────────────────────────────────────
  if (config.includeEmail) {
    write(targetDir, `src/services/email/email.service.${ext}`, generateEmailService(config));
    if (config.emailMultiLang) {
      const locales = generateEmailLocales(config);
      write(targetDir, `src/locales/email/en.${ext}`, locales.en);
      write(targetDir, `src/locales/email/tr.${ext}`, locales.tr);
    }
    const templates = generateEmailTemplates(config);
    Object.entries(templates).forEach(([filename, content]) => {
      write(targetDir, `src/templates/emails/${filename}`, content);
    });
  }

  // ── Auth module ─────────────────────────────────────────────────────────────
  if (config.includeAuth) {
    const authFiles = generateAuthModule(config);
    Object.entries(authFiles).forEach(([filename, content]) => {
      if (filename.startsWith('__models__/')) {
        write(targetDir, `src/models/${filename.replace('__models__/', '')}`, content);
      } else {
        write(targetDir, `src/modules/auth/${filename}`, content);
      }
    });
    write(targetDir, `src/scripts/create-admin.${ext}`, generateCreateAdminScript(config));
  }

  // ── Example module ──────────────────────────────────────────────────────────
  const exampleFiles = generateExampleModule(config);
  Object.entries(exampleFiles).forEach(([filename, content]) => {
    if (filename.startsWith('__models__/')) {
      write(targetDir, `src/models/${filename.replace('__models__/', '')}`, content);
    } else {
      write(targetDir, `src/modules/example/${filename}`, content);
    }
  });

  // ── Server entry ────────────────────────────────────────────────────────────
  write(targetDir, `src/server.${ext}`, generateServerFile(config));

  // ── AI context files (only for selected tools) ──────────────────────────────
  const aiTools = config.aiTools ?? [];
  if (aiTools.length > 0) {
    const aiFiles = generateAiContextFiles(config);
    if (aiTools.includes('kiro'))
      write(targetDir, '.kiro/steering/project.md', aiFiles.kiroSteering);
    if (aiTools.includes('cursor'))
      write(targetDir, '.cursor/rules/project.mdc', aiFiles.cursorRules);
    if (aiTools.includes('claude')) write(targetDir, 'CLAUDE.md', aiFiles.claudeMd);
  }

  // ── Jest ────────────────────────────────────────────────────────────────────
  if (config.includeJest) {
    write(targetDir, 'jest.config.js', generateJestConfig(config));
    write(targetDir, 'jest.setup.js', `import { jest } from '@jest/globals';\n`);
    write(targetDir, 'src/__tests__/helpers/db.js', generateTestDbHelper());
    write(targetDir, 'src/__tests__/helpers/db.teardown.js', generateTestDbTeardown());
    write(targetDir, 'src/__tests__/helpers/app.js', generateTestAppHelper(config));
    if (config.includeAuth)
      write(targetDir, 'src/__tests__/auth.test.js', generateAuthTest(config));
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function write(targetDir, relPath, content) {
  const fullPath = path.join(targetDir, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}

function generateTsConfig() {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        outDir: 'dist',
        rootDir: 'src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        baseUrl: '.',
        paths: { '@/*': ['src/*'] },
      },
      include: ['src'],
      exclude: ['node_modules', 'dist'],
    },
    null,
    2
  );
}

function generateTestDbHelper() {
  return `import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';

export default async function globalSetup() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  const tmpFile = path.join(process.cwd(), 'src/__tests__/helpers/.mongod-uri.tmp');
  fs.writeFileSync(tmpFile, uri);
  global.__MONGOD__ = mongod;
  process.env.MONGODB_URI = uri;
  process.env.NODE_ENV = 'test';
}
`;
}

function generateTestDbTeardown() {
  return `import fs from 'fs';
import path from 'path';

export default async function globalTeardown() {
  if (global.__MONGOD__) await global.__MONGOD__.stop();
  const tmpFile = path.join(process.cwd(), 'src/__tests__/helpers/.mongod-uri.tmp');
  if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
}
`;
}

function generateTestAppHelper(config) {
  const authImport = config.includeAuth
    ? `import authRoutes from '@/modules/auth/auth.routes.js';`
    : '';
  const authRoute = config.includeAuth ? `app.use('/auth', authRoutes);` : '';
  return `import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { notFound, errorHandler } from '@/middlewares/error.middleware.js';
${authImport}

export function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(session({ secret: 'test-secret', resave: false, saveUninitialized: false }));
  ${authRoute}
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
`;
}

function generateAuthTest() {
  return `import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { buildApp } from './helpers/app.js';

const app = buildApp();

beforeAll(async () => {
  const uri = fs.readFileSync(path.join(process.cwd(), 'src/__tests__/helpers/.mongod-uri.tmp'), 'utf8');
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('Auth', () => {
  const email = 'test@example.com';
  const password = 'password123';

  it('POST /auth/register — creates user', async () => {
    const res = await request(app).post('/auth/register').send({ email, password, confirmPassword: password });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(email);
  });

  it('POST /auth/register — duplicate email returns 409', async () => {
    const res = await request(app).post('/auth/register').send({ email, password, confirmPassword: password });
    expect(res.status).toBe(409);
  });

  it('POST /auth/login — valid credentials', async () => {
    const res = await request(app).post('/auth/login').send({ email, password });
    expect(res.status).toBe(200);
  });

  it('POST /auth/login — wrong password returns 401', async () => {
    const res = await request(app).post('/auth/login').send({ email, password: 'wrong' });
    expect(res.status).toBe(401);
  });
});
`;
}
