export function generatePathLoader(lang) {
  if (lang === 'ts') {
    return `// TypeScript uses tsconfig paths — this file is not needed for TS projects.
// Path aliases are handled by tsconfig.json "paths" option.
`;
  }

  return `// Registers the '@/' module alias so imports like '@/utils/logger.js' resolve correctly.
import { addAliases } from 'module-alias';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

addAliases({
  '@': path.join(__dirname, '..'),
});
`;
}
