# Contributing to create-meno-app

Thanks for your interest! Here's how to get started.

## Setup

```bash
git clone https://github.com/your-org/create-meno-app.git
cd create-meno-app
npm install
npm link   # makes create-meno-app available globally
```

## Project Structure

```
bin/
└── create-meno-app.js        # CLI entry point

lib/
├── create-app.js            # Interactive prompts
├── generator.js             # Orchestrates all file generation
└── generators/
    ├── extras/              # Optional features (docker, swagger, ai-context, etc.)
    ├── middlewares/         # Middleware generators
    ├── modules/             # Module generators (auth, example)
    ├── scripts/             # Script generators (create-admin)
    ├── services/            # Service generators (email)
    ├── package-json.js      # Generated package.json
    ├── server.js            # Generated server entry
    ├── version-resolver.js  # Reads live versions from node_modules
    └── ...
```

## Adding a New Generator

1. Create `lib/generators/extras/my-feature.js`
2. Export a `generateMyFeature(config)` function
3. Import and call it in `lib/generator.js`
4. Add the user prompt in `lib/create-app.js` if it's optional
5. Add the config flag to the integration test

## Testing

```bash
# Quick smoke test — generates a project and checks all files exist
node test-integration.js   # (create this file based on existing pattern)

# Lint
npm run lint

# Format
npm run format:check
```

## Keeping Dependencies Fresh

The CLI reads live package versions from its own `node_modules` via `version-resolver.js`.
To update the versions that get written into generated `package.json` files:

```bash
npm update          # update CLI's own deps
npm run lint        # verify nothing broke
```

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Docker Compose generator
fix: swagger import missing when includeSwagger is false
docs: update README with generate command examples
refactor: extract version-resolver from package-json.js
```
