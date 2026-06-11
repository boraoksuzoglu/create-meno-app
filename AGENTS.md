# AGENTS.md

Guidance for AI agents (and humans) working on **create-meno-app** — a CLI that
scaffolds a production-ready MongoDB · Express · Node.js backend.

## Commands

```bash
npm test                 # node:test suite: generates every matrix scenario,
                         #   asserts expected files exist, syntax-checks all output
npm run lint             # eslint over lib/ and bin/ (templates are NOT linted)
npm run lint:fix
npm run format           # prettier --write (templates/ is ignored)
npm run format:check

# Run a single test scenario
node --test --test-name-pattern='full-ts' test/generate.test.mjs

# Generate every scenario into a dir for manual install/run inspection
node test/generate-fixtures.mjs /tmp/meno-out

# Run the CLI from source
node bin/create-meno-app.js my-api          # interactive scaffold
cd <generated-project> && node ../create-meno-app/bin/create-meno-app.js generate product
```

The config matrix lives in `test/configs.mjs`. `npm test` is fast and offline
(no install). To prove a generated project actually *runs*, generate it, then in
that dir: `npm install` → `npx tsc --noEmit` (TS) → `npm test` → boot the server
against a `mongodb-memory-server` URI and hit `GET /health`.

## Architecture

The CLI does **not** copy a fixed template directory and does **not** embed source
as strings. It renders real template files based on the user's answers.

**Flow:** `bin/create-meno-app.js` → `lib/create-app.js` (inquirer prompts →
`config` object) → `lib/generator.js`. The `generate` subcommand instead routes to
`lib/generators/extras/generate-command.js`, which uses the same render engine.

**Engine (`lib/engine/`):**
- `manifest.js` — declarative list: `{ template, dest, when }` for every
  template-driven file. This replaces imperative `if (config.x) write(...)`.
- `render.js` — resolves a template under `templates/` and renders it (EJS if the
  file ends in `.ejs`, otherwise verbatim). `{lang}`/`{ext}` path tokens → `js`/`ts`.
- `write.js` — `runManifest()` walks the manifest, rendering each entry whose
  `when(ctx)` passes; `writeFile()` writes it.
- `context.js` — builds the EJS locals: the full `config` plus `isTs`, `lang`,
  `ext`, and the `v()` version helper.

`generator.js` runs the manifest, then a few **structured-data builders** —
`generators/package-json.js`, the ESLint flat config in
`generators/extras/eslint-prettier.js`, and the inline `tsconfig.json`. These stay
as code on purpose (assembling JSON from feature flags, not file bodies).

**Templates (`templates/`):**
- `common/` — language-agnostic files (one copy serves JS and TS).
- `js/` and `ts/` — mirror trees for files that genuinely differ by language.

## Template conventions (read before editing templates)

- **EJS is only for feature toggles and placeholders** (`<% if (includeEmail) { %>`,
  `<%= projectName %>`). Never use EJS for JS-vs-TS type annotations.
- **JS vs TS differences are two real files** under `js/` and `ts/`. If a file is
  identical across languages, it lives once in `common/`. (The one tolerated
  exception is a single isolated type annotation toggle in the locale templates.)
- Dot-prefixed outputs use a **dotless** template name so tooling doesn't treat the
  template itself as config: `templates/common/gitignore` → `.gitignore`.
- `templates/` is excluded from ESLint and Prettier — keep these files hand-formatted.

## Critical gotchas

- **`version-resolver.js` + npx:** `v(pkg, fallback)` reads the version installed in
  the CLI's own `node_modules`. Runtime deps live in `optionalDependencies` (npm
  installs these for npx users → live versions). **devDependencies are NOT installed
  by npx**, so generated projects receive the **fallback** versions for tooling
  (eslint, typescript, jest, @types, …). Fallbacks must therefore be a coherent,
  mutually-compatible set — do not bump them to match the CLI's own devDeps just
  because the CLI uses newer ones (e.g. `lint-staged` 16 drops Node 18 support).
- **`npm test` targets `test/*.test.mjs`, not `test/`** — generated output under
  `test/__output__` / `test/__snapshots__` contains `*.test.js` files that the
  runner would otherwise try to execute.
- Generated **TS + Jest** relies on `@swc/jest` plus moduleNameMapper that strips
  `.js` from imports so `@/x.js` / `./x.js` resolve to the `.ts` source.

## Generated project model (what the tool produces)

Generated apps use an **auto route loader**: any `src/modules/<name>/<name>.routes.<ext>`
is auto-mounted at `/<name>` (no `app.use()`), and async handlers are wrapped
automatically (controllers are plain async functions). All `process.env` reads go
through `src/config/config.<ext>`, which throws at startup on missing vars. See
`README.md` for the full feature list.
