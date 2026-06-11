/**
 * `meno generate <module>` command
 * Scaffolds a new module inside an existing MENO project.
 *
 * Usage:
 *   npm run generate <module-name>           # scaffold module
 *   npm run generate <module-name> --dry-run # preview files without writing
 *   npm run generate --list                  # list existing modules
 *
 * The actual file bodies live as real templates under templates/{common,js,ts}/_scaffold/
 * and are rendered through the same engine the project generator uses.
 */
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { renderTemplate } from '../../engine/render.js';

export async function runGenerate(moduleName) {
  const args = process.argv.slice(2); // ['generate', '<name>', '--dry-run']
  const isDryRun = args.includes('--dry-run');

  // --list: show existing modules
  if (moduleName === '--list') {
    return listModules();
  }

  if (!moduleName || moduleName.startsWith('--')) {
    console.error(chalk.red('Usage: meno generate <module-name> [--dry-run]'));
    console.error(chalk.gray('       meno generate --list'));
    console.error(chalk.gray('\nExamples:'));
    console.error(chalk.gray('  npm run generate product'));
    console.error(chalk.gray('  npm run generate product --dry-run'));
    process.exit(1);
  }

  // Detect project root
  const cwd = process.cwd();
  const modulesDir = path.join(cwd, 'src', 'modules');
  const modelsDir = path.join(cwd, 'src', 'models');

  if (!fs.existsSync(modulesDir)) {
    console.error(chalk.red('Not inside a MENO project (src/modules/ not found).'));
    process.exit(1);
  }

  // Detect language
  const isTs = fs.existsSync(path.join(cwd, 'tsconfig.json'));
  const ext = isTs ? 'ts' : 'js';
  const lang = ext;

  const targetModuleDir = path.join(modulesDir, moduleName);

  if (!isDryRun && fs.existsSync(targetModuleDir)) {
    console.error(chalk.red(`Module "${moduleName}" already exists.`));
    process.exit(1);
  }

  const pascal = toPascal(moduleName);
  const camel = toCamel(moduleName);
  const ctx = { name: moduleName, pascal, camel, isTs, lang, ext };

  const filesToCreate = [
    { path: `src/models/${moduleName}.model.${ext}`, template: '{lang}/_scaffold/model.ejs' },
    {
      path: `src/modules/${moduleName}/${moduleName}.validation.${ext}`,
      template: 'common/_scaffold/validation.ejs',
    },
    {
      path: `src/modules/${moduleName}/${moduleName}.service.${ext}`,
      template: '{lang}/_scaffold/service.ejs',
    },
    {
      path: `src/modules/${moduleName}/${moduleName}.controller.${ext}`,
      template: '{lang}/_scaffold/controller.ejs',
    },
    {
      path: `src/modules/${moduleName}/${moduleName}.routes.${ext}`,
      template: 'common/_scaffold/routes.ejs',
    },
  ].map((f) => ({ path: f.path, content: renderTemplate(f.template, ctx) }));

  // ── Dry run: just print what would be created ─────────────────────────────
  if (isDryRun) {
    console.log(chalk.bold.yellow('\n  Dry run — no files will be written:\n'));
    for (const f of filesToCreate) {
      const exists = fs.existsSync(path.join(cwd, f.path));
      const icon = exists ? chalk.red('✗ exists') : chalk.green('✓ new');
      console.log(`  ${icon}  ${chalk.cyan(f.path)}`);
    }
    console.log(`\n  ${chalk.gray('Run without --dry-run to create these files.')}\n`);
    return;
  }

  // ── Write files ───────────────────────────────────────────────────────────
  const spinner = ora(`Generating module ${chalk.cyan(moduleName)}...`).start();

  try {
    fs.mkdirSync(targetModuleDir, { recursive: true });
    fs.mkdirSync(modelsDir, { recursive: true });

    for (const f of filesToCreate) {
      const fullPath = path.join(cwd, f.path);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, f.content, 'utf8');
    }

    spinner.succeed(chalk.green(`Module "${moduleName}" created!`));

    console.log(`
${chalk.bold('Files created:')}
${filesToCreate.map((f) => `  ${chalk.gray(path.dirname(f.path) + '/')}${chalk.cyan(path.basename(f.path))}`).join('\n')}

${chalk.bold('Auto-mounted at:')} ${chalk.cyan(`/${moduleName}`)}
${chalk.gray('(restart the server to activate)')}
`);
  } catch (err) {
    spinner.fail(chalk.red('Failed to generate module'));
    console.error(err);
    process.exit(1);
  }
}

// ── --list ────────────────────────────────────────────────────────────────────

function listModules() {
  const cwd = process.cwd();
  const modulesDir = path.join(cwd, 'src', 'modules');

  if (!fs.existsSync(modulesDir)) {
    console.error(chalk.red('Not inside a MENO project (src/modules/ not found).'));
    process.exit(1);
  }

  const modules = fs
    .readdirSync(modulesDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  if (modules.length === 0) {
    console.log(chalk.gray('\n  No modules found.\n'));
    return;
  }

  console.log(chalk.bold('\n  Modules:\n'));
  for (const m of modules) {
    const routeFile =
      fs.existsSync(path.join(modulesDir, m, `${m}.routes.js`)) ||
      fs.existsSync(path.join(modulesDir, m, `${m}.routes.ts`));
    const icon = routeFile ? chalk.green('✓') : chalk.yellow('?');
    console.log(`  ${icon}  ${chalk.cyan(m)}  ${chalk.gray(`→ /${m}`)}`);
  }
  console.log('');
}

// ── String helpers ────────────────────────────────────────────────────────────

const toPascal = (str) => str.replace(/(^|[-_])([a-z])/g, (_, __, c) => c.toUpperCase());

const toCamel = (str) => {
  const p = toPascal(str);
  return p.charAt(0).toLowerCase() + p.slice(1);
};
