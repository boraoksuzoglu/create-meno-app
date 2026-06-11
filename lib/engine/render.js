/**
 * Template renderer
 * ─────────────────
 * Resolves a template file under `templates/` and renders it.
 *
 * Resolution: manifest entries name a template path relative to `templates/`,
 * optionally using the `{lang}` / `{ext}` tokens (both resolve to "js" or "ts").
 * Language-agnostic templates live under `templates/common/`; templates that
 * genuinely differ between JavaScript and TypeScript live under `templates/js/`
 * and `templates/ts/` as two real, lintable files.
 *
 * Rendering: files ending in `.ejs` are rendered with EJS using the build
 * context as locals (so a template can reference `includeAuth`, `projectName`,
 * `v(...)`, etc. directly). Any other file is read verbatim.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const TEMPLATES_ROOT = path.resolve(__dirname, '../../templates');

/** Replace {lang} / {ext} tokens in a path spec. */
export function substituteTokens(spec, ctx) {
  return spec.replace(/\{lang\}/g, ctx.lang).replace(/\{ext\}/g, ctx.ext);
}

/**
 * Resolve a template spec to an absolute path on disk.
 * Throws a clear error if the template does not exist.
 */
export function resolveTemplate(spec, ctx) {
  const rel = substituteTokens(spec, ctx);
  const abs = path.join(TEMPLATES_ROOT, rel);
  if (!fs.existsSync(abs)) {
    throw new Error(`[engine] Template not found: ${rel} (looked in ${TEMPLATES_ROOT})`);
  }
  return abs;
}

/**
 * Render a template spec with the given context and return its string content.
 */
export function renderTemplate(spec, ctx) {
  const abs = resolveTemplate(spec, ctx);
  const raw = fs.readFileSync(abs, 'utf8');

  if (!abs.endsWith('.ejs')) return raw;

  return ejs.render(raw, ctx, {
    filename: abs, // enables <%- include(...) %> relative resolution
    rmWhitespace: false,
  });
}
