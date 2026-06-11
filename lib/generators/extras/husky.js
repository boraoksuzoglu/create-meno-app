import { v } from '../version-resolver.js';

/**
 * Husky + lint-staged dev dependencies (merged into the generated package.json).
 * The `.husky/pre-commit` hook itself is a template (templates/common/husky/pre-commit).
 */
export function getHuskyDeps() {
  return {
    husky: v('husky', '^9.0.11'),
    'lint-staged': v('lint-staged', '^15.2.2'),
  };
}
