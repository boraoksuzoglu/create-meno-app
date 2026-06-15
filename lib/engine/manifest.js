/**
 * Generation manifest
 * ────────────────────
 * Declarative list of every template-driven file in a generated project.
 * The orchestrator (lib/generator.js) renders each entry whose `when`
 * predicate passes and writes it to `dest`.
 *
 * Path tokens: `{lang}` and `{ext}` both resolve to "js" or "ts".
 *  - Language-agnostic templates live under templates/common/
 *  - Templates that differ between JS and TS live under templates/{js,ts}/
 *
 * Files produced by structured-data builders (package.json, eslint config,
 * tsconfig) are NOT listed here — see lib/generator.js.
 */

// ── Predicate helpers (read as English) ─────────────────────────────────────────
const always = () => true;
const auth = (c) => c.includeAuth;
const ts = (c) => c.isTs;
const rateLimit = (c) => c.includeRateLimit;
const rateLimitMongoTs = (c) => c.isTs && c.includeRateLimit && c.rateLimitStore === 'mongo';
const logger = (c) => c.includeLogger;
const swagger = (c) => c.includeSwagger;
const mdDocs = (c) => c.includeMdDocs;
const docIntrospect = (c) => c.includeSwagger || c.includeMdDocs;
const uploadLocal = (c) => c.includeUpload && c.uploadProvider === 'local';
const uploadGcs = (c) => c.includeUpload && c.uploadProvider === 'gcs';
const email = (c) => c.includeEmail;
const emailMultiLang = (c) => c.includeEmail && c.emailMultiLang;
const emailAuth = (c) => c.includeEmail && c.includeAuth;
const jest = (c) => c.includeJest;
const jestAuth = (c) => c.includeJest && c.includeAuth;
const eslint = (c) => c.includeEslint;
const docker = (c) => c.includeDocker;
const githubActions = (c) => c.includeGithubActions;
const aiKiro = (c) => c.aiTools?.includes('kiro');
const aiCursor = (c) => c.aiTools?.includes('cursor');
const aiClaude = (c) => c.aiTools?.includes('claude');

export const manifest = [
  // ── Root / project files ──────────────────────────────────────────────────
  { template: 'common/gitignore', dest: '.gitignore', when: always },
  { template: 'common/env.example.ejs', dest: '.env.example', when: always },
  { template: 'common/env.example.ejs', dest: '.env', when: always },
  { template: 'common/README.md.ejs', dest: 'README.md', when: always },

  // ── ESLint / Prettier (eslint config itself is built in generator.js) ──────
  { template: 'common/prettierrc', dest: '.prettierrc', when: eslint },
  { template: 'common/prettierignore', dest: '.prettierignore', when: eslint },
  { template: 'common/husky/pre-commit', dest: '.husky/pre-commit', when: eslint },

  // ── Docker ─────────────────────────────────────────────────────────────────
  { template: 'common/docker/Dockerfile.ejs', dest: 'Dockerfile', when: docker },
  { template: 'common/docker/docker-compose.yml.ejs', dest: 'docker-compose.yml', when: docker },
  { template: 'common/dockerignore', dest: '.dockerignore', when: docker },

  // ── GitHub Actions ───────────────────────────────────────────────────────────
  { template: 'common/github/ci.yml.ejs', dest: '.github/workflows/ci.yml', when: githubActions },
  { template: 'common/github/dependabot.yml', dest: '.github/dependabot.yml', when: githubActions },

  // ── Jest ─────────────────────────────────────────────────────────────────────
  { template: '{lang}/jest.config.js', dest: 'jest.config.js', when: jest },
  { template: 'common/jest.setup.js', dest: 'jest.setup.js', when: jest },
  {
    template: 'common/src/__tests__/helpers/db.js',
    dest: 'src/__tests__/helpers/db.js',
    when: jest,
  },
  {
    template: 'common/src/__tests__/helpers/db.teardown.js',
    dest: 'src/__tests__/helpers/db.teardown.js',
    when: jest,
  },
  {
    template: 'common/src/__tests__/helpers/app.js.ejs',
    dest: 'src/__tests__/helpers/app.js',
    when: jest,
  },
  {
    template: 'common/src/__tests__/auth.test.js',
    dest: 'src/__tests__/auth.test.js',
    when: jestAuth,
  },

  // ── Server entry ─────────────────────────────────────────────────────────────
  { template: 'common/src/server.ejs', dest: 'src/server.{ext}', when: always },

  // ── Config ───────────────────────────────────────────────────────────────────
  { template: '{lang}/src/config/config.{ext}.ejs', dest: 'src/config/config.{ext}', when: always },

  // ── Constants ────────────────────────────────────────────────────────────────
  {
    template: '{lang}/src/constants/error-codes.{ext}',
    dest: 'src/constants/error-codes.{ext}',
    when: always,
  },
  { template: '{lang}/src/constants/roles.{ext}', dest: 'src/constants/roles.{ext}', when: always },

  // ── Middlewares ──────────────────────────────────────────────────────────────
  {
    template: '{lang}/src/middlewares/cors.middleware.{ext}',
    dest: 'src/middlewares/cors.middleware.{ext}',
    when: always,
  },
  {
    template: '{lang}/src/middlewares/request-id.middleware.{ext}',
    dest: 'src/middlewares/request-id.middleware.{ext}',
    when: always,
  },
  {
    template: '{lang}/src/middlewares/validation.middleware.{ext}',
    dest: 'src/middlewares/validation.middleware.{ext}',
    when: always,
  },
  {
    template: '{lang}/src/middlewares/error.middleware.{ext}.ejs',
    dest: 'src/middlewares/error.middleware.{ext}',
    when: always,
  },
  {
    template: '{lang}/src/middlewares/auth.middleware.{ext}.ejs',
    dest: 'src/middlewares/auth.middleware.{ext}',
    when: auth,
  },
  {
    template: '{lang}/src/middlewares/ratelimit.middleware.{ext}.ejs',
    dest: 'src/middlewares/ratelimit.middleware.{ext}',
    when: rateLimit,
  },

  // ── Models ───────────────────────────────────────────────────────────────────
  {
    template: '{lang}/src/models/example.model.{ext}',
    dest: 'src/models/example.model.{ext}',
    when: always,
  },
  {
    template: '{lang}/src/models/user.model.{ext}',
    dest: 'src/models/user.model.{ext}',
    when: auth,
  },

  // ── Example module ───────────────────────────────────────────────────────────
  {
    template: '{lang}/src/modules/example/example.controller.{ext}',
    dest: 'src/modules/example/example.controller.{ext}',
    when: always,
  },
  {
    template: '{lang}/src/modules/example/example.service.{ext}',
    dest: 'src/modules/example/example.service.{ext}',
    when: always,
  },
  {
    template: '{lang}/src/modules/example/example.validation.{ext}',
    dest: 'src/modules/example/example.validation.{ext}',
    when: always,
  },
  {
    template: 'common/src/modules/example/example.routes.ejs',
    dest: 'src/modules/example/example.routes.{ext}',
    when: always,
  },

  // ── Auth module ──────────────────────────────────────────────────────────────
  {
    template: '{lang}/src/modules/auth/auth.controller.{ext}',
    dest: 'src/modules/auth/auth.controller.{ext}',
    when: auth,
  },
  {
    template: '{lang}/src/modules/auth/auth.validation.{ext}',
    dest: 'src/modules/auth/auth.validation.{ext}',
    when: auth,
  },
  {
    template: '{lang}/src/modules/auth/auth.routes.{ext}',
    dest: 'src/modules/auth/auth.routes.{ext}',
    when: auth,
  },
  {
    template: '{lang}/src/modules/auth/auth.service.{ext}.ejs',
    dest: 'src/modules/auth/auth.service.{ext}',
    when: auth,
  },
  {
    template: '{lang}/src/scripts/create-admin.{ext}',
    dest: 'src/scripts/create-admin.{ext}',
    when: auth,
  },

  // ── Scripts ──────────────────────────────────────────────────────────────────
  {
    template: '{lang}/src/scripts/generate-docs.{ext}',
    dest: 'src/scripts/generate-docs.{ext}',
    when: mdDocs,
  },

  // ── Health module ────────────────────────────────────────────────────────────
  {
    template: '{lang}/src/modules/health/health.routes.{ext}',
    dest: 'src/modules/health/health.routes.{ext}',
    when: always,
  },

  // ── Utils ────────────────────────────────────────────────────────────────────
  { template: '{lang}/src/utils/database.{ext}', dest: 'src/utils/database.{ext}', when: always },
  { template: '{lang}/src/utils/paginate.{ext}', dest: 'src/utils/paginate.{ext}', when: always },
  {
    template: '{lang}/src/utils/path-loader.{ext}',
    dest: 'src/utils/path-loader.{ext}',
    when: always,
  },
  {
    template: '{lang}/src/utils/route-loader.{ext}',
    dest: 'src/utils/route-loader.{ext}',
    when: always,
  },
  {
    template: '{lang}/src/utils/db-indexes.{ext}.ejs',
    dest: 'src/utils/db-indexes.{ext}',
    when: always,
  },
  {
    template: '{lang}/src/utils/graceful-shutdown.{ext}.ejs',
    dest: 'src/utils/graceful-shutdown.{ext}',
    when: always,
  },
  { template: '{lang}/src/utils/swagger.{ext}', dest: 'src/utils/swagger.{ext}', when: swagger },
  {
    template: '{lang}/src/utils/doc-introspect.{ext}',
    dest: 'src/utils/doc-introspect.{ext}',
    when: docIntrospect,
  },
  { template: '{lang}/src/utils/logger.{ext}', dest: 'src/utils/logger.{ext}', when: logger },
  {
    template: '{lang}/src/utils/upload.local.{ext}',
    dest: 'src/utils/upload.{ext}',
    when: uploadLocal,
  },
  {
    template: '{lang}/src/utils/upload.gcs.{ext}',
    dest: 'src/utils/upload.{ext}',
    when: uploadGcs,
  },

  // ── Shared TypeScript types (TS only) ────────────────────────────────────────
  { template: 'ts/src/types/api.ts', dest: 'src/types/api.ts', when: ts },
  { template: 'ts/src/types/express.d.ts', dest: 'src/types/express.d.ts', when: ts },
  { template: 'ts/src/types/pagination.ts', dest: 'src/types/pagination.ts', when: ts },
  {
    template: 'ts/src/types/rate-limit-mongo.d.ts',
    dest: 'src/types/rate-limit-mongo.d.ts',
    when: rateLimitMongoTs,
  },

  // ── Email service ────────────────────────────────────────────────────────────
  {
    template: '{lang}/src/services/email/email.service.{ext}.ejs',
    dest: 'src/services/email/email.service.{ext}',
    when: email,
  },
  {
    template: 'common/src/locales/email/en.js.ejs',
    dest: 'src/locales/email/en.{ext}',
    when: emailMultiLang,
  },
  {
    template: 'common/src/locales/email/tr.js.ejs',
    dest: 'src/locales/email/tr.{ext}',
    when: emailMultiLang,
  },
  {
    template: 'common/src/templates/emails/welcome.hbs',
    dest: 'src/templates/emails/welcome.hbs',
    when: email,
  },
  {
    template: 'common/src/templates/emails/forgot-password.hbs',
    dest: 'src/templates/emails/forgot-password.hbs',
    when: emailAuth,
  },
  {
    template: 'common/src/templates/emails/password-changed.hbs',
    dest: 'src/templates/emails/password-changed.hbs',
    when: emailAuth,
  },

  // ── AI context files ─────────────────────────────────────────────────────────
  { template: 'common/ai/kiro.md.ejs', dest: '.kiro/steering/project.md', when: aiKiro },
  { template: 'common/ai/cursor.mdc.ejs', dest: '.cursor/rules/project.mdc', when: aiCursor },
  { template: 'common/ai/claude.md.ejs', dest: 'CLAUDE.md', when: aiClaude },
];
