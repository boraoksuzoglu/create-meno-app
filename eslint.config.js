import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['lib/**/*.js', 'bin/**/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    ignores: ['node_modules/', 'test-output/', 'test-integration-output/'],
  },
];
