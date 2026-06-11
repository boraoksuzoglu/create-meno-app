/**
 * Filesystem writer + manifest runner.
 *
 * `writeFile` writes a single rendered file, creating parent directories.
 * `runManifest` walks a declarative manifest, renders each applicable entry
 * (those whose `when` predicate passes), and writes it to the resolved dest.
 */
import fs from 'fs';
import path from 'path';
import { renderTemplate, substituteTokens } from './render.js';

export function writeFile(targetDir, relPath, content) {
  const fullPath = path.join(targetDir, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}

/**
 * @param {Array<{template: string, dest: string, when?: (ctx) => boolean}>} manifest
 * @param {object} ctx  rendering context (see engine/context.js)
 * @param {string} targetDir  absolute path of the project being generated
 */
export function runManifest(manifest, ctx, targetDir) {
  for (const entry of manifest) {
    if (entry.when && !entry.when(ctx)) continue;
    const content = renderTemplate(entry.template, ctx);
    const dest = substituteTokens(entry.dest, ctx);
    writeFile(targetDir, dest, content);
  }
}
