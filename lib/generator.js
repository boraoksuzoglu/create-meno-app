import fs from 'fs';
import path from 'path';
import { buildContext } from './engine/context.js';
import { manifest } from './engine/manifest.js';
import { runManifest, writeFile } from './engine/write.js';
import { generatePackageJson } from './generators/package-json.js';
import { generateEslintConfig } from './generators/extras/eslint-prettier.js';

/**
 * Main project generator.
 *
 * Template-driven files come from the declarative manifest (see engine/manifest.js)
 * and are rendered by the engine. A few structured-data files (package.json, the
 * ESLint flat config, tsconfig.json) are produced by dedicated builders because
 * code — not a template — is the right tool for assembling them.
 */
export async function generateProject(config, targetDir) {
  const ctx = buildContext(config);

  fs.mkdirSync(targetDir, { recursive: true });

  // ── Template-driven files ───────────────────────────────────────────────────
  runManifest(manifest, ctx, targetDir);

  // ── Structured-data builders ────────────────────────────────────────────────
  writeFile(targetDir, 'package.json', generatePackageJson(config));

  if (config.includeEslint) {
    writeFile(targetDir, 'eslint.config.js', generateEslintConfig(config));
  }

  if (ctx.isTs) {
    writeFile(targetDir, 'tsconfig.json', generateTsConfig());
  }

  // ── Runtime directories ─────────────────────────────────────────────────────
  // The logger writes here; create it so the app starts cleanly out of the box.
  fs.mkdirSync(path.join(targetDir, 'logs'), { recursive: true });
}

function generateTsConfig() {
  return (
    JSON.stringify(
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
          // `paths` resolves relative to this tsconfig (no deprecated baseUrl needed;
          // works on TypeScript 5 and 6).
          paths: { '@/*': ['./src/*'] },
        },
        include: ['src'],
        exclude: ['node_modules', 'dist'],
      },
      null,
      2
    ) + '\n'
  );
}
