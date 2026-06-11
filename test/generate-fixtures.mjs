/**
 * Generates every scenario from the config matrix into <outDir>/<scenario>/.
 *
 * Usage:
 *   node test/generate-fixtures.mjs <outDir>
 *
 * Used to produce golden snapshots before the refactor and regenerate output
 * after, so the two trees can be diffed (diff -r) to catch regressions.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { scenarios } from './configs.mjs';
import { generateProject } from '../lib/generator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const outDir = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.join(repoRoot, 'test', '__output__');

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const [name, config] of Object.entries(scenarios)) {
  const target = path.join(outDir, name);
  await generateProject(config, target);
  console.log(`generated: ${name}`);
}

console.log(`\nAll scenarios written to ${outDir}`);
