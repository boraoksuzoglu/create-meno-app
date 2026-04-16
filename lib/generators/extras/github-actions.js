export function generateCiWorkflow(config) {
  const { includeJest, language } = config;
  const isTs = language === 'ts';

  const testStep = includeJest
    ? `
      - name: Run tests
        run: npm test
        env:
          NODE_ENV: test`
    : '';

  const buildStep = isTs
    ? `
      - name: Build TypeScript
        run: npm run build`
    : '';

  return `name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    name: Test & Lint
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci
${
  config.includeEslint
    ? `
      - name: Lint
        run: npm run lint`
    : ''
}
      - name: Security audit
        run: npm audit --audit-level=high
${testStep}${buildStep}
`;
}

export function generateDependabotConfig() {
  return `version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
    groups:
      dev-dependencies:
        dependency-type: development
`;
}
