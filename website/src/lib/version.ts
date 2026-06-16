import fs from 'fs';
import path from 'path';

const FALLBACK = '1.3.0';

/**
 * The create-meno-app CLI version, read at build time from the repo-root
 * package.json (the website lives in `website/`, so the CLI manifest is one
 * level up). Server-only — keep this out of client components; thread the
 * resolved string in as a prop. Falls back gracefully if the file isn't found
 * (e.g. the website is built in isolation).
 */
export function getCliVersion(): string {
  for (const rel of ['../package.json', 'package.json']) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), 'utf8'));
      if (typeof pkg.name === 'string' && pkg.name === 'create-meno-app' && pkg.version) {
        return pkg.version as string;
      }
    } catch {
      /* try next candidate */
    }
  }
  return FALLBACK;
}
