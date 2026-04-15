/**
 * Version Resolver
 * ─────────────────
 * Reads the installed version of a package from the CLI's own node_modules.
 * This ensures generated projects always use the latest versions that the
 * CLI itself was tested against — no more hardcoded stale version strings.
 *
 * How it works:
 *   1. Reads <cli-root>/node_modules/<pkg>/package.json
 *   2. Returns "^<major>.<minor>.<patch>" (caret range for safe updates)
 *   3. Falls back to a hardcoded default if the package isn't installed
 *      (e.g. optional deps that aren't in the CLI's own package.json)
 *
 * To keep generated versions fresh:
 *   Run `npm update` in the meno-boilerplate/ directory periodically,
 *   or set up Dependabot on the CLI repo itself.
 */

import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve from the CLI root (meno-boilerplate/), not from the generated project
const require = createRequire(path.join(__dirname, '../../package.json'));

const cache = new Map();

/**
 * Returns "^x.y.z" for a package installed in the CLI's node_modules.
 * Falls back to `fallback` if not found.
 *
 * @param {string} pkg - npm package name
 * @param {string} fallback - version string to use if pkg not installed
 * @returns {string} caret version range, e.g. "^5.1.0"
 */
export const v = (pkg, fallback) => {
  if (cache.has(pkg)) return cache.get(pkg);

  try {
    const pkgJsonPath = require.resolve(`${pkg}/package.json`);
    const { version } = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
    // Use caret range: ^major.minor.patch
    const result = `^${version}`;
    cache.set(pkg, result);
    return result;
  } catch {
    // Package not installed in CLI — use fallback
    cache.set(pkg, fallback);
    return fallback;
  }
};
