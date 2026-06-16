import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { generateProject } from './generator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));

const banner = `
${chalk.bold.cyan('  ███╗   ███╗███████╗███╗   ██╗ ██████╗ ')}
${chalk.bold.cyan('  ████╗ ████║██╔════╝████╗  ██║██╔═══██╗')}
${chalk.bold.cyan('  ██╔████╔██║█████╗  ██╔██╗ ██║██║   ██║')}
${chalk.bold.cyan('  ██║╚██╔╝██║██╔══╝  ██║╚██╗██║██║   ██║')}
${chalk.bold.cyan('  ██║ ╚═╝ ██║███████╗██║ ╚████║╚██████╔╝')}
${chalk.bold.cyan('  ╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝ ╚═════╝ ')}

  ${chalk.bold.white('create-meno-app')} ${chalk.gray(`v${version}`)}
  ${chalk.gray('MongoDB · Express · Node.js')}
  ${chalk.gray('Production-ready boilerplate generator')}
`;

export async function createApp() {
  console.log(banner);

  const projectName = process.argv[2];

  const answers = await inquirer.prompt([
    // ── Project basics ──────────────────────────────────────────────────────
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: projectName || 'my-meno-app',
      when: !projectName,
      validate: (input) => {
        if (!input.trim()) return 'Project name cannot be empty';
        if (!/^[a-z0-9-_]+$/i.test(input)) return 'Use only letters, numbers, hyphens, underscores';
        return true;
      },
    },
    {
      type: 'list',
      name: 'language',
      message: 'Language:',
      choices: [
        { name: 'JavaScript (ESM)', value: 'js' },
        { name: 'TypeScript', value: 'ts' },
      ],
    },

    // ── Auth ────────────────────────────────────────────────────────────────
    {
      type: 'confirm',
      name: 'includeAuth',
      message: 'Include Auth module? (register, login, logout, forgot/reset password)',
      default: true,
    },
    {
      type: 'confirm',
      name: 'includeRbac',
      message: 'Include RBAC? (roles & permissions middleware)',
      default: true,
      when: (ans) => ans.includeAuth,
    },
    {
      type: 'checkbox',
      name: 'socialProviders',
      message: 'Add social sign-in? (verifies client ID tokens — web + mobile)',
      choices: [
        { name: 'Google Sign-In', value: 'google' },
        { name: 'Apple Sign-In', value: 'apple' },
      ],
      default: [],
      when: (ans) => ans.includeAuth,
    },

    // ── Core features ───────────────────────────────────────────────────────
    {
      type: 'confirm',
      name: 'includeRateLimit',
      message: 'Include rate limiting?',
      default: true,
    },
    {
      type: 'list',
      name: 'rateLimitStore',
      message: 'Rate limit store (in-memory is not safe for multi-instance deployments):',
      choices: [
        { name: 'In-memory (single instance / dev only)', value: 'memory' },
        { name: 'MongoDB (recommended for production)', value: 'mongo' },
        { name: 'Redis', value: 'redis' },
      ],
      default: 'mongo',
      when: (ans) => ans.includeRateLimit,
    },
    {
      type: 'confirm',
      name: 'includeLogger',
      message: 'Include Winston logger with daily rotation?',
      default: true,
    },

    // ── Upload ──────────────────────────────────────────────────────────────
    {
      type: 'confirm',
      name: 'includeUpload',
      message: 'Include file upload?',
      default: false,
    },
    {
      type: 'list',
      name: 'uploadProvider',
      message: 'Upload provider:',
      choices: [
        { name: 'Local disk (Multer)', value: 'local' },
        { name: 'Google Cloud Storage (GCS)', value: 'gcs' },
      ],
      when: (ans) => ans.includeUpload,
    },

    // ── Email ───────────────────────────────────────────────────────────────
    {
      type: 'confirm',
      name: 'includeEmail',
      message: 'Include Gmail API email service?',
      default: false,
    },
    {
      type: 'confirm',
      name: 'emailMultiLang',
      message: 'Multi-language email templates? (en + tr)',
      default: true,
      when: (ans) => ans.includeEmail,
    },

    // ── Testing ─────────────────────────────────────────────────────────────
    {
      type: 'confirm',
      name: 'includeJest',
      message: 'Include Jest test setup?',
      default: true,
    },

    // ── Code quality ────────────────────────────────────────────────────────
    {
      type: 'confirm',
      name: 'includeEslint',
      message: 'Include ESLint + Prettier?',
      default: true,
    },

    // ── DevOps ──────────────────────────────────────────────────────────────
    {
      type: 'confirm',
      name: 'includeSwagger',
      message: 'Include Swagger / OpenAPI docs? (GET /docs)',
      default: true,
    },
    {
      type: 'confirm',
      name: 'includeMdDocs',
      message: 'Include Markdown docs generator? (npm run docs → docs/)',
      default: false,
    },
    {
      type: 'confirm',
      name: 'includeDocker',
      message: 'Include Docker setup? (Dockerfile, docker-compose, .dockerignore)',
      default: false,
    },
    {
      type: 'confirm',
      name: 'includeGithubActions',
      message: 'Include GitHub Actions CI workflow?',
      default: false,
    },

    // ── AI tools ────────────────────────────────────────────────────────────
    {
      type: 'checkbox',
      name: 'aiTools',
      message: 'Generate AI context files for: (space to select, enter to skip)',
      choices: [
        { name: 'Kiro  (.kiro/steering/project.md)', value: 'kiro' },
        { name: 'Cursor (.cursor/rules/project.mdc)', value: 'cursor' },
        { name: 'Claude (CLAUDE.md)', value: 'claude' },
      ],
      default: [],
    },
  ]);

  const config = {
    projectName: projectName || answers.projectName,
    language: answers.language,
    includeAuth: answers.includeAuth ?? true,
    includeRbac: answers.includeRbac ?? false,
    socialProviders: answers.socialProviders ?? [],
    includeRateLimit: answers.includeRateLimit ?? true,
    rateLimitStore: answers.rateLimitStore || 'memory',
    includeLogger: answers.includeLogger ?? true,
    includeUpload: answers.includeUpload ?? false,
    uploadProvider: answers.uploadProvider || 'local',
    includeEmail: answers.includeEmail ?? false,
    emailMultiLang: answers.emailMultiLang ?? false,
    includeJest: answers.includeJest ?? true,
    includeEslint: answers.includeEslint ?? true,
    includeSwagger: answers.includeSwagger ?? true,
    includeMdDocs: answers.includeMdDocs ?? false,
    includeDocker: answers.includeDocker ?? false,
    includeGithubActions: answers.includeGithubActions ?? false,
    aiTools: answers.aiTools ?? [],
  };

  const targetDir = path.resolve(process.cwd(), config.projectName);

  if (fs.existsSync(targetDir)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `Directory "${config.projectName}" already exists. Overwrite?`,
        default: false,
      },
    ]);
    if (!overwrite) {
      console.log(chalk.yellow('\nAborted.'));
      process.exit(0);
    }
    fs.rmSync(targetDir, { recursive: true, force: true });
  }

  console.log('');
  const spinner = ora(`Creating ${chalk.cyan(config.projectName)}...`).start();

  try {
    await generateProject(config, targetDir);
    spinner.succeed(chalk.green('Project created!'));
  } catch (err) {
    spinner.fail(chalk.red('Failed to create project'));
    console.error(err);
    process.exit(1);
  }

  // ── Next steps ────────────────────────────────────────────────────────────
  const steps = [
    `  ${chalk.cyan(`cd ${config.projectName}`)}`,
    `  ${chalk.cyan('npm install')}`,
    `  ${chalk.cyan('cp .env.example .env')}   ${chalk.gray('# fill in your values')}`,
  ];

  if (config.includeAuth) {
    steps.push(
      `  ${chalk.cyan('npm run create:admin')}  ${chalk.gray('# create first admin user')}`
    );
  }

  steps.push(`  ${chalk.cyan('npm run dev')}`);

  const extras = [];
  if (config.includeDocker)
    extras.push(`  ${chalk.cyan('docker compose up')}  ${chalk.gray('# run with Docker')}`);
  if (!config.includeDocker)
    extras.push(`  ${chalk.cyan('GET /health')}         ${chalk.gray('# health check endpoint')}`);
  if (config.includeMdDocs)
    extras.push(
      `  ${chalk.cyan('npm run docs')}        ${chalk.gray('# generate Markdown docs into docs/')}`
    );
  if (config.socialProviders.length)
    extras.push(
      `  ${chalk.gray(`Social sign-in: ${config.socialProviders.join(', ')} — see README for client IDs setup`)}`
    );
  if (config.aiTools.length)
    extras.push(`  ${chalk.gray(`AI context generated for: ${config.aiTools.join(', ')}`)}`);

  console.log(`
${chalk.bold('Next steps:')}

${steps.join('\n')}
${extras.length ? '\n' + extras.join('\n') : ''}
${chalk.gray('Docs available at GET /docs (development only)')}

${chalk.gray('Happy coding! 🚀')}
`);
}
