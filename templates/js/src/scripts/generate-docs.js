/* eslint-disable no-console */
/**
 * generate-docs.js
 * ─────────────────
 * Markdown documentation generator. Zero hard-coded maps — everything is
 * auto-discovered from source under src/modules/ and src/models/.
 *
 * Run:    npm run docs            → writes docs/
 *         npm run docs -- --check → exits 1 if docs/ is out of date (CI guard)
 *
 * Request bodies and query params are derived from the Joi schemas referenced by
 * validateBody(...) / validateQuery(...). Response examples are inferred from the
 * controller → service → model chain. You normally write only `// @doc` (+ an
 * optional `// @desc`); `@body` / `@query` / `@response` exist only as overrides.
 *
 * All shared parsing/inference lives in src/utils/doc-introspect.js (also used by
 * the Swagger util), so the two stay in sync.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  parseRouteFile,
  resolveValidationSchema,
  joiToSchema,
  schemaToRows,
  schemaToExample,
  parseModel,
  inferResponseExample,
} from '@/utils/doc-introspect.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXT = 'js';

// ── Paths ───────────────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..', '..');
const SRC_MODULES = path.join(ROOT, 'src', 'modules');
const SRC_MODELS = path.join(ROOT, 'src', 'models');
const OUT_DIR = path.join(ROOT, 'docs');

// ── Helpers ───────────────────────────────────────────────────────────────────
const toPascalCase = (s) => s.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
const toTitleCase = (s) => s.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
const tableSafe = (s) => String(s).replace(/\|/g, '\\|');
const json = (obj) => '```json\n' + JSON.stringify(obj, null, 2) + '\n```\n\n';
// Stable (date-free) so `npm run docs -- --check` stays idempotent in CI.
const stamp = '> Auto-generated — do not edit by hand. Run `npm run docs` to regenerate.\n\n';

const authBadge = (ep) => {
  if (ep.roles.length) return `🔒 Requires role: ${ep.roles.join(', ')}`;
  return ep.hasAuth ? '🔑 Auth required' : '🔓 Public';
};

const rowsTable = (rows) => {
  let md = '| Field | Type | Required | Notes |\n|-------|------|----------|-------|\n';
  for (const r of rows) {
    md += `| ${r.name} | ${tableSafe(r.type)} | ${r.required ? '✓' : '-'} | ${tableSafe(r.notes)} |\n`;
  }
  return md + '\n';
};

const readModuleDesc = (src) => {
  for (const line of src.split('\n').slice(0, 12)) {
    const m = line.match(/\/\/\s*@module-desc\s+(.+)/) || line.match(/\/\/\s*@description\s+(.+)/);
    if (m) return m[1].trim();
  }
  return '';
};

// ── Discovery ───────────────────────────────────────────────────────────────
const discoverModules = () => {
  if (!fs.existsSync(SRC_MODULES)) return [];
  return fs
    .readdirSync(SRC_MODULES, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => fs.existsSync(path.join(SRC_MODULES, name, `${name}.routes.${EXT}`)))
    .sort()
    .map((dirName) => {
      const dir = path.join(SRC_MODULES, dirName);
      return {
        dirName,
        dir,
        prefix: `/${dirName}`,
        routesFile: path.join(dir, `${dirName}.routes.${EXT}`),
        valFile: path.join(dir, `${dirName}.validation.${EXT}`),
        desc: readModuleDesc(fs.readFileSync(path.join(dir, `${dirName}.routes.${EXT}`), 'utf8')),
      };
    });
};

const discoverModels = () => {
  if (!fs.existsSync(SRC_MODELS)) return [];
  return fs
    .readdirSync(SRC_MODELS)
    .filter((f) => f.endsWith(`.model.${EXT}`))
    .sort()
    .map((fileName) => {
      const slug = fileName.replace(`.model.${EXT}`, '');
      return { slug, ...parseModel(path.join(SRC_MODELS, fileName)) };
    });
};

// ── Markdown builders ─────────────────────────────────────────────────────────
const buildModuleDoc = async (mod, endpoints) => {
  let md = `# ${toTitleCase(mod.dirName)}\n\n${stamp}`;
  if (mod.desc) md += `${mod.desc}\n\n`;
  md += `**Base path:** \`${mod.prefix}\`\n\n`;

  if (endpoints.length === 0) {
    md += '_No documented endpoints found. Add `// @doc` comments above your routes._\n';
    return md;
  }

  md += '## Endpoints\n\n';
  for (const ep of endpoints) {
    const fullPath = mod.prefix + (ep.path === '/' ? '' : ep.path);
    md += `### ${ep.method} ${fullPath}\n\n`;
    md += `**${ep.summary}** — ${authBadge(ep)}\n\n`;
    if (ep.desc) md += `${ep.desc}\n\n`;

    // ── Query params ───────────────────────────────────────────────────────
    if (ep.queryOverride) {
      md += `**Query:** \`${ep.queryOverride}\`\n\n`;
    } else if (ep.queryVar) {
      const schema = joiToSchema(await resolveValidationSchema(mod.valFile, ep.queryVar));
      const rows = schemaToRows(schema);
      if (rows.length) md += '**Query parameters:**\n\n' + rowsTable(rows);
      else md += `**Query:** \`${ep.queryVar}\`\n\n`;
    }

    // ── Request body ───────────────────────────────────────────────────────
    if (ep.bodyOverride) {
      md += '**Request body:**\n\n```json\n' + ep.bodyOverride + '\n```\n\n';
    } else if (ep.bodyVar) {
      const schema = joiToSchema(await resolveValidationSchema(mod.valFile, ep.bodyVar));
      const rows = schemaToRows(schema);
      if (rows.length) {
        md += '**Request body:**\n\n' + rowsTable(rows);
        md += '_Example:_\n\n' + json(schemaToExample(schema));
      } else {
        md += `**Request body:** \`${ep.bodyVar}\`\n\n`;
      }
    }

    // ── Response ───────────────────────────────────────────────────────────
    if (ep.responses.length) {
      for (const r of ep.responses) {
        md += `**Response ${r.code}:**\n\n\`\`\`json\n${r.body}\n\`\`\`\n\n`;
      }
    } else {
      const inferred = inferResponseExample(mod.dir, mod.dirName, ep, EXT, SRC_MODELS);
      if (inferred) {
        md += `**Response ${inferred.status}** _(inferred)_:\n\n` + json(inferred.example);
      } else {
        md += `**Response:** \`${ep.status}\`\n\n`;
      }
    }
    md += '---\n\n';
  }
  return md;
};

const buildModelDoc = (model) => {
  let md = `# ${toTitleCase(model.slug)}\n\n${stamp}`;
  md += `**Collection:** \`${model.collection}\`\n`;
  if (model.description) md += `**Description:** ${model.description}\n`;
  md += '\n## Fields\n\n';
  md += '| Field | Type | Required | Notes |\n|-------|------|----------|-------|\n';
  for (const f of model.fields) {
    const notes = [];
    if (f.enums.length) notes.push(`enum: ${f.enums.join(', ')}`);
    if (f.ref) notes.push(`→ ${f.ref}`);
    md += `| ${f.name} | ${tableSafe(f.type)} | ${f.required ? '✓' : '-'} | ${tableSafe(notes.join(', '))} |\n`;
  }
  md += '\n';

  const refs = model.fields.filter((f) => f.ref);
  if (refs.length) {
    md += '## Relationships\n\n';
    for (const f of refs) md += `- \`${f.name}\` → [${f.ref}](./${toPascalCase(f.ref)}.md)\n`;
    md += '\n';
  }

  if (model.indexes.length) {
    md += '## Indexes\n\n';
    for (const idx of model.indexes) md += `- \`${idx}\`\n`;
    md += '\n';
  }
  return md;
};

const buildModulesIndex = (summary) => {
  let md = `# Modules Overview\n\n${stamp}`;
  md += '| Module | Base Path | Endpoints | Description |\n|--------|-----------|-----------|-------------|\n';
  for (const m of summary) {
    md += `| [${toTitleCase(m.dirName)}](./modules/${toPascalCase(m.dirName)}.md) | \`${m.prefix}\` | ${m.count} | ${m.desc} |\n`;
  }
  return md + '\n';
};

const buildModelsIndex = (models) => {
  let md = `# Models Overview\n\n${stamp}All models use MongoDB via Mongoose.\n\n`;
  md += '| Model | Collection | Description |\n|-------|-----------|-------------|\n';
  for (const m of models) {
    md += `| [${toTitleCase(m.slug)}](./models/${toPascalCase(m.slug)}.md) | \`${m.collection}\` | ${m.description} |\n`;
  }
  return md + '\n';
};

const buildDocsIndex = (moduleCount, modelCount) => `# Documentation

${stamp}Auto-generated reference for this backend. Regenerate with \`npm run docs\` (or \`npm run docs -- --check\` in CI).

## Navigation

- **[MODULES.md](./MODULES.md)** — REST modules overview (${moduleCount})
- **[MODELS.md](./MODELS.md)** — MongoDB models overview (${modelCount})
- **[modules/](./modules/)** — per-module endpoint details
- **[models/](./models/)** — per-model schema details

## How it works

Request bodies and query params are derived from the Joi schemas in each module's
\`*.validation.${EXT}\`. Response examples are inferred from the controller → service →
model chain. You only write \`// @doc <summary>\` (and an optional \`// @desc\`); the
\`@body\` / \`@query\` / \`@response\` tags are overrides for cases inference can't reach.

## Standard response envelopes

Single resource:

\`\`\`json
{ "item": { "...": "..." } }
\`\`\`

Paginated list:

\`\`\`json
{ "items": [], "total": 0, "page": 1, "limit": 20, "totalPages": 0, "hasNext": false, "hasPrev": false }
\`\`\`

## Error response

Every error goes through the central error handler:

\`\`\`json
{ "status": 422, "message": "VALIDATION_ERROR" }
\`\`\`

\`data\` is included when an error carries it; \`stack\` is included outside production.
`;

// ── Collect → write / check ────────────────────────────────────────────────────
const collectFiles = async () => {
  const files = new Map();
  const modules = discoverModules();
  const summary = [];
  for (const mod of modules) {
    const endpoints = parseRouteFile(mod.routesFile);
    files.set(path.join(OUT_DIR, 'modules', `${toPascalCase(mod.dirName)}.md`), await buildModuleDoc(mod, endpoints));
    summary.push({ ...mod, count: endpoints.length });
  }

  const models = discoverModels();
  for (const model of models) {
    files.set(path.join(OUT_DIR, 'models', `${toPascalCase(model.slug)}.md`), buildModelDoc(model));
  }

  files.set(path.join(OUT_DIR, 'README.md'), buildDocsIndex(modules.length, models.length));
  files.set(path.join(OUT_DIR, 'MODULES.md'), buildModulesIndex(summary));
  files.set(path.join(OUT_DIR, 'MODELS.md'), buildModelsIndex(models));
  return { files, moduleCount: modules.length, modelCount: models.length };
};

/** Existing *.md under the tool-owned docs/modules and docs/models dirs. */
const listManagedDocs = () => {
  const out = [];
  for (const sub of ['modules', 'models']) {
    const dir = path.join(OUT_DIR, sub);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.md')) out.push(path.join(dir, f));
    }
  }
  return out;
};

const main = async () => {
  const check = process.argv.includes('--check');
  const { files, moduleCount, modelCount } = await collectFiles();

  // Orphans: per-module/per-model pages left behind after a module/model is
  // removed. The modules/ & models/ dirs are fully tool-owned, so any *.md there
  // not in the expected set is stale.
  const expected = new Set(files.keys());
  const orphans = listManagedDocs().filter((f) => !expected.has(f));

  if (check) {
    // Fresh repo that hasn't adopted docs yet: nothing to drift from, so pass.
    // (Avoids failing CI on the very first run before `docs/` is committed.)
    if (!fs.existsSync(OUT_DIR)) {
      console.log('ℹ docs/ not generated yet — run `npm run docs` and commit it. Skipping check.');
      return;
    }
    const stale = [];
    for (const [file, content] of files) {
      if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content) stale.push(file);
    }
    if (stale.length || orphans.length) {
      console.error('✗ docs/ is out of date. Run `npm run docs`.');
      for (const f of stale) console.error(`  - ${path.relative(ROOT, f)} (missing or changed)`);
      for (const f of orphans) console.error(`  - ${path.relative(ROOT, f)} (orphaned — should be removed)`);
      process.exit(1);
    }
    console.log('✓ docs/ is up to date.');
    return;
  }

  console.log('📚 Generating docs/ ...\n');
  for (const [file, content] of files) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, 'utf8');
    console.log(`  ✅ ${path.relative(ROOT, file)}`);
  }
  for (const f of orphans) {
    fs.rmSync(f);
    console.log(`  🗑  ${path.relative(ROOT, f)} (orphaned — removed)`);
  }
  console.log(`\n📁 ${OUT_DIR}  —  ${moduleCount} modules, ${modelCount} models`);
  console.log('✨ Done!\n');
};

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
