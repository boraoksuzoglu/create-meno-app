/**
 * CLI generation tests.
 *
 * For every scenario in the config matrix this:
 *   1. generates the project into a temp dir,
 *   2. asserts the expected files exist (and conditional ones are present/absent),
 *   3. runs `node --check` on every generated .js file to catch syntax errors.
 *
 * These are fast and require no network or `npm install` — they validate that
 * the template engine produces a coherent, syntactically valid project. The
 * heavier "does it actually run" checks live in test/verify-matrix.mjs.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { scenarios } from './configs.mjs';
import { generateProject } from '../lib/generator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function listFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
}

for (const [name, config] of Object.entries(scenarios)) {
  test(`generate: ${name}`, async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), `meno-${name}-`));
    try {
      await generateProject(config, dir);
      const ext = config.language === 'ts' ? 'ts' : 'js';

      // Always-present files
      for (const rel of ['package.json', '.env.example', 'README.md', `src/server.${ext}`]) {
        assert.ok(fs.existsSync(path.join(dir, rel)), `${name}: missing ${rel}`);
      }

      // Conditional files match their flags
      const checks = [
        [config.includeAuth, `src/modules/auth/auth.service.${ext}`],
        [config.includeAuth, `src/models/user.model.${ext}`],
        [config.includeRateLimit, `src/middlewares/ratelimit.middleware.${ext}`],
        [config.includeLogger, `src/utils/logger.${ext}`],
        [config.includeSwagger, `src/utils/swagger.${ext}`],
        [config.includeMdDocs, `src/scripts/generate-docs.${ext}`],
        [config.includeSwagger || config.includeMdDocs, `src/utils/doc-introspect.${ext}`],
        [config.includeUpload, `src/utils/upload.${ext}`],
        [config.includeEmail, `src/services/email/email.service.${ext}`],
        [config.includeJest, 'jest.config.js'],
        [config.includeEslint, 'eslint.config.js'],
        [config.includeDocker, 'Dockerfile'],
        [config.includeGithubActions, '.github/workflows/ci.yml'],
        [config.language === 'ts', 'tsconfig.json'],
      ];
      for (const [enabled, rel] of checks) {
        assert.equal(
          fs.existsSync(path.join(dir, rel)),
          Boolean(enabled),
          `${name}: ${rel} presence should be ${Boolean(enabled)}`
        );
      }

      // Every generated .js file must be syntactically valid
      for (const file of listFiles(dir)) {
        if (file.endsWith('.js')) {
          execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
        }
      }
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
}
