import { v } from '../version-resolver.js';

export function generateEslintConfig(config) {
  const isTs = config.language === 'ts';

  if (isTs) {
    // typescript-eslint v8+ uses the unified "typescript-eslint" package
    // with ESLint v9 flat config — no separate plugin/parser imports needed
    return `import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    ignores: ['node_modules/', 'dist/', 'coverage/'],
  },
);
`;
  }

  return `import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    ignores: ['node_modules/', 'dist/', 'coverage/'],
  },
];
`;
}

export function getEslintPrettierDeps(config) {
  const isTs = config.language === 'ts';
  const deps = {
    eslint: v('eslint', '^9.0.0'),
    '@eslint/js': v('@eslint/js', '^9.0.0'),
    globals: v('globals', '^15.0.0'),
    prettier: v('prettier', '^3.2.5'),
    'eslint-config-prettier': v('eslint-config-prettier', '^9.1.0'),
    'eslint-plugin-prettier': v('eslint-plugin-prettier', '^5.1.3'),
  };
  if (isTs) {
    // Use the unified "typescript-eslint" v8+ package — compatible with ESLint v9
    deps['typescript-eslint'] = v('typescript-eslint', '^8.0.0');
  }
  return deps;
}
