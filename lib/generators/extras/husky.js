import { v } from '../version-resolver.js';

export function generateHuskySetup(config) {
  const { language } = config;
  const isTs = language === 'ts';
  const ext = isTs ? 'ts' : 'js';

  return {
    // .husky/pre-commit
    preCommit: `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
`,
    // .husky/commit-msg  (optional: enforce conventional commits)
    commitMsg: `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Enforce conventional commit format: type(scope): description
# Examples: feat: add login, fix(auth): handle expired token
npx --no -- commitlint --edit "$1"
`,
    // lint-staged config in package.json (returned separately for merging)
    lintStagedConfig: {
      [`src/**/*.${ext}`]: [`eslint --fix`, `prettier --write`],
      '*.{json,md,yml,yaml}': ['prettier --write'],
    },
  };
}

export function getHuskyDeps() {
  return {
    husky: v('husky', '^9.0.11'),
    'lint-staged': v('lint-staged', '^15.2.2'),
  };
}
