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

Generated files are **real template files** under `templates/`, not strings inside
JavaScript. A small engine renders them based on the user's answers.

```
bin/
└── create-meno-app.js        # CLI entry point

lib/
├── create-app.js             # Interactive prompts → config object
├── generator.js              # Orchestrator: runs the manifest + structured builders
├── engine/
│   ├── manifest.js           # Declarative list: which template → which dest, and when
│   ├── render.js             # Resolves a template, renders EJS with the config
│   ├── write.js              # Writes rendered files; runs the manifest
│   └── context.js            # Builds the EJS context (config + isTs/ext + v())
└── generators/               # Structured-DATA builders only (not file bodies)
    ├── package-json.js       # Assembles package.json from feature flags
    ├── version-resolver.js   # Reads live dependency versions from node_modules
    └── extras/
        ├── eslint-prettier.js # ESLint flat config + dep lists
        ├── husky.js           # husky/lint-staged dep list
        └── generate-command.js # `meno generate` (uses the same render engine)

templates/
├── common/                   # Language-agnostic files (one copy for JS and TS)
├── js/                       # JavaScript source templates
└── ts/                       # TypeScript source templates (mirror of js/)
```

### Template conventions

- A file ending in `.ejs` is rendered with [EJS](https://ejs.co/); anything else is
  copied verbatim. The full config is available as EJS locals
  (`includeAuth`, `projectName`, `isTs`, `ext`, the `v()` version helper, …).
- **EJS is only for feature toggles and placeholders** (`<% if (includeEmail) { %>`,
  `<%= projectName %>`) — never for JS-vs-TS type annotations.
- **JavaScript vs TypeScript** differences are handled by keeping two real files:
  `templates/js/.../x.js` and `templates/ts/.../x.ts`. Files that are identical across
  languages live once under `templates/common/`.
- Path tokens `{lang}` and `{ext}` in the manifest both resolve to `js` or `ts`.
- Dot-prefixed outputs use a dotless template name (e.g. `templates/common/gitignore`
  → `.gitignore`) so the file isn't treated as config by tooling.

## Adding a new generated file

1. Add the template under `templates/common/` (language-agnostic) **or** both
   `templates/js/` and `templates/ts/` (language-specific).
2. Add an entry to `lib/engine/manifest.js` with its `template`, `dest`, and `when`
   predicate (reuse the helpers at the top of the file).
3. If it's optional, add the prompt in `lib/create-app.js` and the flag to
   `test/configs.mjs` so it's covered by the matrix.

Structured-data files (package.json, the ESLint config, tsconfig.json) stay as
builders — see `lib/generator.js`.

## Testing

```bash
# Fast: generate every scenario, assert files exist, syntax-check all output
npm test

# Full: generate each scenario into a dir to inspect / install / run by hand
node test/generate-fixtures.mjs /tmp/meno-out

# Lint + format
npm run lint
npm run format:check
```

The config matrix lives in `test/configs.mjs`. The full "does the generated project
actually run" check (npm install + jest + server boot) is done per scenario against
those generated dirs.

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
