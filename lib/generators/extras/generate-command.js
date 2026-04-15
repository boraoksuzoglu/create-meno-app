/**
 * `meno generate <module>` command
 * Scaffolds a new module inside an existing MENO project.
 *
 * Usage:
 *   npm run generate <module-name>           # scaffold module
 *   npm run generate <module-name> --dry-run # preview files without writing
 *   npm run generate --list                  # list existing modules
 */
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';

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

  const targetModuleDir = path.join(modulesDir, moduleName);

  if (!isDryRun && fs.existsSync(targetModuleDir)) {
    console.error(chalk.red(`Module "${moduleName}" already exists.`));
    process.exit(1);
  }

  const pascal = toPascal(moduleName);
  const camel = toCamel(moduleName);

  const filesToCreate = [
    {
      path: `src/models/${moduleName}.model.${ext}`,
      content: generateModel(moduleName, pascal, isTs),
    },
    {
      path: `src/modules/${moduleName}/${moduleName}.validation.${ext}`,
      content: generateValidation(moduleName, pascal, isTs),
    },
    {
      path: `src/modules/${moduleName}/${moduleName}.service.${ext}`,
      content: generateService(moduleName, pascal, camel, isTs),
    },
    {
      path: `src/modules/${moduleName}/${moduleName}.controller.${ext}`,
      content: generateController(moduleName, camel, isTs),
    },
    {
      path: `src/modules/${moduleName}/${moduleName}.routes.${ext}`,
      content: generateRoutes(moduleName, camel, isTs),
    },
  ];

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

// ── Template generators ───────────────────────────────────────────────────────

function generateModel(name, pascal, isTs) {
  if (isTs) {
    return `import mongoose, { Document } from 'mongoose';

export interface I${pascal} extends Document {
  name: string;
  isActive: boolean;
}

const ${name}Schema = new mongoose.Schema<I${pascal}>(
  {
    name:     { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<I${pascal}>('${pascal}', ${name}Schema);
`;
  }
  return `import mongoose from 'mongoose';

const ${name}Schema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('${pascal}', ${name}Schema);
`;
}

function generateValidation(name, pascal, isTs) {
  return `import Joi from 'joi';

export const create${pascal}Schema = Joi.object({
  name: Joi.string().trim().max(200).required(),
});

export const update${pascal}Schema = Joi.object({
  name:     Joi.string().trim().max(200).optional(),
  isActive: Joi.boolean().optional(),
});
`;
}

function generateService(name, pascal, camel, isTs) {
  return `import createError from 'http-errors';
import ${pascal} from '@/models/${name}.model.js';
import { paginate, paginatedResponse } from '@/utils/paginate.js';

export const list${pascal}s = async (query${isTs ? ': { page?: string; limit?: string }' : ''} = {}) => {
  const { page, limit, skip } = paginate(query);
  const [items, total] = await Promise.all([
    ${pascal}.find({ isActive: true }).skip(skip).limit(limit).sort({ createdAt: -1 }),
    ${pascal}.countDocuments({ isActive: true }),
  ]);
  return paginatedResponse(items, total, page, limit);
};

export const get${pascal}ById = async (id${isTs ? ': string' : ''}) => {
  const item = await ${pascal}.findById(id);
  if (!item) throw createError(404, '${name.toUpperCase()}_NOT_FOUND');
  return { item };
};

export const create${pascal} = async (data${isTs ? ': { name: string }' : ''}) => {
  const item = await ${pascal}.create(data);
  return { item };
};

export const update${pascal} = async (id${isTs ? ': string' : ''}, data${isTs ? ': Partial<{ name: string; isActive: boolean }>' : ''}) => {
  const item = await ${pascal}.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  if (!item) throw createError(404, '${name.toUpperCase()}_NOT_FOUND');
  return { item };
};

export const delete${pascal} = async (id${isTs ? ': string' : ''}) => {
  const item = await ${pascal}.findByIdAndDelete(id);
  if (!item) throw createError(404, '${name.toUpperCase()}_NOT_FOUND');
  return { message: 'DELETED' };
};
`;
}

function generateController(name, camel, isTs) {
  const req = isTs ? 'req: any, res: any' : 'req, res';
  return `import * as ${camel}Service from './${name}.service.js';

// Plain async functions.
// The route loader automatically wraps all async handlers — no manual wrapping needed.

export const list   = async (${req}) => res.json(await ${camel}Service.list${toPascal(name)}s(req.query));
export const getOne = async (${req}) => res.json(await ${camel}Service.get${toPascal(name)}ById(req.params.id));
export const create = async (${req}) => res.status(201).json(await ${camel}Service.create${toPascal(name)}(req.body));
export const update = async (${req}) => res.json(await ${camel}Service.update${toPascal(name)}(req.params.id, req.body));
export const remove = async (${req}) => res.json(await ${camel}Service.delete${toPascal(name)}(req.params.id));
`;
}

function generateRoutes(name, camel, isTs) {
  const pascal = toPascal(name);
  return `import express from 'express';
import * as ctrl from './${name}.controller.js';
import { create${pascal}Schema, update${pascal}Schema } from './${name}.validation.js';
import { validateBody } from '@/middlewares/validation.middleware.js';

const router = express.Router();

// @doc List ${name}s
router.get('/',    ctrl.list);
// @doc Get ${name} by ID
router.get('/:id', ctrl.getOne);
// @doc Create ${name} | 201
router.post(  '/',    validateBody(create${pascal}Schema), ctrl.create);
// @doc Update ${name}
router.put(   '/:id', validateBody(update${pascal}Schema), ctrl.update);
// @doc Delete ${name}
router.delete('/:id', ctrl.remove);

export default router;
`;
}

// ── String helpers ────────────────────────────────────────────────────────────

const toPascal = (str) => str.replace(/(^|[-_])([a-z])/g, (_, __, c) => c.toUpperCase());

const toCamel = (str) => {
  const p = toPascal(str);
  return p.charAt(0).toLowerCase() + p.slice(1);
};
