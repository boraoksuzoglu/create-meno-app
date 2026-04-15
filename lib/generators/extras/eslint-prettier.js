import { v } from '../version-resolver.js';

export function generateEslintConfig(config) {
  const isTs = config.language === 'ts';

  if (isTs) {
    return `import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: './tsconfig.json', ecmaVersion: 'latest', sourceType: 'module' },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    ignores: ['node_modules/', 'dist/', 'coverage/'],
  },
];
`;
  }

  return `import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
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

export function generatePrettierConfig() {
  return `{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
`;
}

export function generatePrettierIgnore() {
  return `node_modules/
dist/
coverage/
logs/
*.hbs
`;
}

export function getEslintPrettierDeps(config) {
  const isTs = config.language === 'ts';
  const deps = {
    eslint: v('eslint', '^9.0.0'),
    '@eslint/js': v('@eslint/js', '^9.0.0'),
    prettier: v('prettier', '^3.2.5'),
    'eslint-config-prettier': v('eslint-config-prettier', '^9.1.0'),
    'eslint-plugin-prettier': v('eslint-plugin-prettier', '^5.1.3'),
  };
  if (isTs) {
    deps['@typescript-eslint/eslint-plugin'] = v('@typescript-eslint/eslint-plugin', '^7.7.0');
    deps['@typescript-eslint/parser'] = v('@typescript-eslint/parser', '^7.7.0');
  }
  return deps;
}
