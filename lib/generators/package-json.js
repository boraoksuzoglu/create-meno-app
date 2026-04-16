import { getEslintPrettierDeps } from './extras/eslint-prettier.js';
import { getHuskyDeps } from './extras/husky.js';
import { v } from './version-resolver.js';

export function generatePackageJson(config) {
  const {
    projectName,
    language,
    includeAuth,
    includeRateLimit,
    includeLogger,
    includeUpload,
    uploadProvider,
    includeEmail,
    includeJest,
    includeEslint,
    includeSwagger,
  } = config;
  const isTs = language === 'ts';
  const ext = isTs ? 'ts' : 'js';

  // ── Runtime dependencies ────────────────────────────────────────────────────
  const deps = {
    express: v('express', '^5.1.0'),
    mongoose: v('mongoose', '^8.20.1'),
    dotenv: v('dotenv', '^17.2.3'),
    cors: v('cors', '^2.8.5'),
    helmet: v('helmet', '^8.1.0'),
    'cookie-parser': v('cookie-parser', '^1.4.7'),
    'express-session': v('express-session', '^1.18.2'),
    'connect-mongo': v('connect-mongo', '^5.1.0'),
    'http-errors': v('http-errors', '^2.0.1'),
    joi: v('joi', '^18.0.2'),
    'module-alias': v('module-alias', '^2.2.3'),
  };

  if (includeSwagger) deps['swagger-ui-express'] = v('swagger-ui-express', '^5.0.1');
  if (includeAuth) deps['bcrypt'] = v('bcrypt', '^5.1.1');
  if (includeRateLimit) {
    deps['express-rate-limit'] = v('express-rate-limit', '^8.2.1');
    if (config.rateLimitStore === 'mongo') {
      deps['rate-limit-mongo'] = v('rate-limit-mongo', '^2.3.2');
    } else if (config.rateLimitStore === 'redis') {
      deps['rate-limit-redis'] = v('rate-limit-redis', '^4.2.0');
      deps['redis'] = v('redis', '^4.7.0');
    }
  }

  if (includeLogger) {
    deps['winston'] = v('winston', '^3.18.3');
    deps['winston-daily-rotate-file'] = v('winston-daily-rotate-file', '^5.0.0');
    deps['colors'] = v('colors', '^1.4.0');
  }

  if (includeUpload) {
    deps['multer'] = v('multer', '^2.0.2');
    if (uploadProvider === 'gcs') {
      deps['@google-cloud/storage'] = v('@google-cloud/storage', '^7.17.3');
      deps['uuid'] = v('uuid', '^13.0.0');
    }
  }

  if (includeEmail) {
    deps['googleapis'] = v('googleapis', '^144.0.0');
    deps['handlebars'] = v('handlebars', '^4.7.8');
    deps['html-to-text'] = v('html-to-text', '^9.0.5');
    deps['p-limit'] = v('p-limit', '^7.2.0');
  }

  // ── Dev dependencies ────────────────────────────────────────────────────────
  const devDeps = { nodemon: v('nodemon', '^3.1.11') };

  if (isTs) {
    Object.assign(devDeps, {
      typescript: v('typescript', '^5.4.5'),
      '@types/node': v('@types/node', '^20.12.7'),
      '@types/express': v('@types/express', '^5.0.0'),
      '@types/cors': v('@types/cors', '^2.8.17'),
      '@types/cookie-parser': v('@types/cookie-parser', '^1.4.7'),
      '@types/express-session': v('@types/express-session', '^1.18.0'),
      tsx: v('tsx', '^4.7.3'),
      'tsconfig-paths': v('tsconfig-paths', '^4.2.0'),
    });
    if (includeAuth) devDeps['@types/bcrypt'] = v('@types/bcrypt', '^5.0.2');
    if (includeUpload) devDeps['@types/multer'] = v('@types/multer', '^1.4.11');
    if (includeSwagger)
      devDeps['@types/swagger-ui-express'] = v('@types/swagger-ui-express', '^4.1.6');
  }

  if (includeEslint) {
    Object.assign(devDeps, getEslintPrettierDeps(config));
    Object.assign(devDeps, getHuskyDeps());
  }

  if (includeJest) {
    Object.assign(devDeps, {
      jest: v('jest', '^30.3.0'),
      '@jest/globals': v('@jest/globals', '^30.3.0'),
      supertest: v('supertest', '^7.2.2'),
      'mongodb-memory-server': v('mongodb-memory-server', '^11.0.1'),
    });
    if (isTs) devDeps['@types/supertest'] = v('@types/supertest', '^6.0.2');
  }

  // ── Scripts ─────────────────────────────────────────────────────────────────
  const devCmd = isTs
    ? 'nodemon --exec tsx --tsconfig tsconfig.json src/server.ts'
    : 'nodemon --import ./src/utils/path-loader.js src/server.js';

  const startCmd = isTs
    ? 'node dist/server.js'
    : 'node --import ./src/utils/path-loader.js src/server.js';

  const testCmd = isTs
    ? 'node --experimental-vm-modules node_modules/.bin/jest --forceExit'
    : 'node --experimental-vm-modules --import ./src/utils/path-loader.js node_modules/.bin/jest --forceExit';

  const scripts = {
    dev: devCmd,
    start: startCmd,
    generate: 'npx create-meno-app generate',
  };

  if (includeAuth) {
    scripts['create:admin'] =
      `node --import ./src/utils/path-loader.js src/scripts/create-admin.${ext}`;
  }

  if (includeEslint) {
    scripts['lint'] = `eslint src/**/*.${ext}`;
    scripts['lint:fix'] = `eslint src/**/*.${ext} --fix`;
    scripts['format'] = 'prettier --write .';
    scripts['format:check'] = 'prettier --check .';
    scripts['prepare'] = 'husky';
  }

  if (isTs) scripts['build'] = 'tsc';

  if (includeJest) {
    scripts['test'] = testCmd;
    scripts['test:coverage'] = testCmd + ' --coverage';
  }

  const lintStaged = includeEslint
    ? {
        [`src/**/*.${ext}`]: ['eslint --fix', 'prettier --write'],
        '*.{json,md,yml,yaml}': ['prettier --write'],
      }
    : undefined;

  return JSON.stringify(
    {
      name: projectName,
      version: '0.1.0',
      description: '',
      type: 'module',
      main: `src/server.${ext}`,
      _moduleAliases: { '@': 'src' },
      scripts,
      ...(lintStaged ? { 'lint-staged': lintStaged } : {}),
      dependencies: deps,
      devDependencies: devDeps,
    },
    null,
    2
  );
}
