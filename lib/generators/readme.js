export function generateReadme(config) {
  const {
    projectName,
    language,
    includeAuth,
    includeUpload,
    uploadProvider,
    includeEmail,
    includeJest,
    includeLogger,
  } = config;
  const isTs = language === 'ts';
  const ext = isTs ? 'ts' : 'js';

  const features = [
    '- Express 5 + Mongoose 8',
    '- Session-based auth (connect-mongo)',
    '- Helmet + CORS + rate limiting',
    '- Joi validation middleware',
    '- Centralized error handling',
    includeLogger ? '- Winston logger — daily rotation, `logs/YYYY-MM-DD/` subfolders' : null,
    includeAuth
      ? '- Auth module (register / login / logout / change password / forgot & reset password)'
      : null,
    includeAuth ? '- Admin seed script (`npm run create:admin`)' : null,
    includeUpload && uploadProvider === 'gcs'
      ? '- Google Cloud Storage upload (signed URL cache)'
      : null,
    includeUpload && uploadProvider === 'local' ? '- Local file upload (Multer)' : null,
    includeEmail ? '- Gmail API email service (Handlebars templates)' : null,
    includeEmail && config.emailMultiLang ? '- Multi-language email templates (en + tr)' : null,
    includeJest ? '- Jest + MongoDB Memory Server test setup' : null,
    '- **Auto route loader** — zero `app.use()` boilerplate',
    '- **Auto async wrapping** — controllers are plain async functions, errors caught automatically',
    isTs ? '- TypeScript with strict mode' : '- JavaScript ESM with `@/` path alias',
  ]
    .filter(Boolean)
    .join('\n');

  const scripts = [
    '| `npm run dev` | Start dev server with nodemon |',
    '| `npm run generate <name>` | Scaffold a new module |',
    includeAuth ? '| `npm run create:admin` | Create first admin user |' : null,
    includeJest ? '| `npm test` | Run tests |' : null,
  ]
    .filter(Boolean)
    .join('\n');

  return `# ${projectName}

> Scaffolded with **create-meno-app** — MongoDB · Express · Node.js

## Features

${features}

## Getting Started

\`\`\`bash
npm install
cp .env.example .env
npm run dev
\`\`\`

## Project Structure

\`\`\`
src/
├── models/                # ALL Mongoose models (never inside modules)
├── middlewares/           # auth, cors, error, validation, ratelimit, request-id
├── modules/               # Feature modules — auto-mounted by route-loader
│   ├── auth/              # → /auth
│   └── example/           # → /example
${
  includeEmail
    ? `├── services/email/        # Gmail API + Handlebars
├── templates/emails/      # .hbs email templates
`
    : ''
}├── utils/
│   ├── route-loader.${ext}    # auto-mounts routes + wraps async handlers
│   ├── database.${ext}
│   ├── paginate.${ext}
│   └── ...
└── server.${ext}
\`\`\`

## Auto Route Loader

**You never write \`app.use()\` for modules.**

Drop a \`<name>/<name>.routes.${ext}\` file in \`src/modules/\` and it's mounted at \`/<name>\` automatically.
All async handlers are wrapped — thrown errors go to the error handler. No \`asyncHandler\` needed.

\`\`\`${ext}
// src/modules/product/product.controller.${ext} — just plain async functions
export const list = async (req, res) => res.json(await productService.list(req.query));

// src/modules/product/product.routes.${ext} — no wrapper imports
import * as ctrl from './product.controller.js';
const router = express.Router();
router.get('/', ctrl.list);
export default router;
// → auto-mounted at /product, async errors caught automatically
\`\`\`

## Module Pattern

\`\`\`
src/models/<name>.model.${ext}              ← Mongoose schema
src/modules/<name>/<name>.validation.${ext} ← Joi schemas
src/modules/<name>/<name>.service.${ext}    ← Business logic (no HTTP)
src/modules/<name>/<name>.controller.${ext} ← HTTP handlers (plain async)
src/modules/<name>/<name>.routes.${ext}     ← Router + middleware chain
\`\`\`

## Scripts

${scripts}

## Environment Variables

See \`.env.example\` for all available options.
`;
}
