/**
 * AI Context Generator
 * ─────────────────────
 * Single source of truth for project conventions.
 * Generates context files for Kiro, Cursor, and Claude simultaneously.
 */

export function generateAiContextFiles(config) {
  const content = buildContextContent(config);
  return {
    kiroSteering: buildKiroSteering(content, config),
    cursorRules: buildCursorRules(content, config),
    claudeMd: buildClaudeMd(content, config),
  };
}

function buildContextContent(config) {
  const { language, includeEmail, includeUpload, uploadProvider, includeLogger, includeSwagger } =
    config;
  const isTs = language === 'ts';
  const ext = isTs ? 'ts' : 'js';

  const optionalStack = [
    includeLogger ? '- **Logging:** Winston → `logs/YYYY-MM-DD/combined.log` + `error.log`' : null,
    includeEmail ? '- **Email:** Gmail API + Handlebars templates (`src/templates/emails/`)' : null,
    includeUpload
      ? `- **Upload:** ${uploadProvider === 'gcs' ? 'Google Cloud Storage (signed URL cache)' : 'Local disk (Multer)'}`
      : null,
    includeSwagger
      ? '- **API Docs:** Swagger UI at `GET /docs` — auto-generated from `@doc` comments'
      : null,
  ]
    .filter(Boolean)
    .join('\n');

  return `## Project: ${config.projectName}

### Stack
- **Runtime:** Node.js (ESM, ${isTs ? 'TypeScript' : 'JavaScript'})
- **Framework:** Express 5
- **Database:** MongoDB via Mongoose 8
- **Auth:** Session-based (express-session + connect-mongo)
- **Validation:** Joi
- **Error handling:** http-errors + central error middleware
${optionalStack}

---

### Directory Structure

\`\`\`
src/
├── config/
│   └── config.${ext}              # ALL process.env reads — never use process.env directly
├── constants/
│   ├── error-codes.${ext}         # Centralised error code strings
│   └── roles.${ext}               # User role constants
├── middlewares/                   # auth, cors, error, ratelimit, request-id, validation
├── models/                        # ← ALL Mongoose models live here (never inside modules)
├── modules/                       # Feature modules — auto-mounted by route-loader
│   ├── auth/                      # → /auth
│   ├── example/                   # → /example
│   └── health/                    # → /health
├── utils/
│   ├── database.${ext}            # MongoDB singleton
│   ├── db-indexes.${ext}          # ensureIndexes() — syncs Mongoose indexes at startup
│   ├── graceful-shutdown.${ext}   # SIGTERM/SIGINT handler
│   ├── paginate.${ext}            # paginate() + paginatedResponse()
│   ├── path-loader.${ext}         # Registers @/ alias
│   └── route-loader.${ext}        # Auto-mounts routes + auto-wraps async handlers
└── server.${ext}
\`\`\`

---

### Non-Negotiable Rules

#### 1. Models → \`src/models/\` only
\`\`\`${ext}
// ✅
import User from '@/models/user.model.js';

// ❌ Never put models inside module folders
import User from './auth.model.js';
\`\`\`

#### 2. Auto Route Loader — never write \`app.use()\` for modules
Every \`src/modules/<name>/<name>.routes.${ext}\` is auto-mounted at \`/<name>\` on startup.
Adding \`app.use('/auth', authRoutes)\` in \`server.${ext}\` is **wrong** — the loader handles it.

To opt out: add \`// @no-auto-load\` as the first line of the routes file.

#### 3. Async error handling is fully automatic
Controllers are plain async functions. The route loader wraps all async handlers
at mount time — thrown errors and rejected promises go to the error handler.
**Never import asyncHandler. Never wrap controllers manually. Just write async functions.**
\`\`\`${ext}
// controller — just a plain async function:
export const list = async (req, res) => {
  const items = await MyService.list(req.query);
  res.json(items);
};
// If MyService.list() throws, the error handler catches it automatically.
\`\`\`

#### 4. Config module — never read process.env directly
\`\`\`${ext}
// ✅
import { config } from '@/config/config.js';
const port = config.app.port;

// ❌
const port = process.env.PORT;
\`\`\`

#### 5. Module pattern — 4 files per module
| File | Responsibility |
|------|---------------|
| \`<name>.validation.${ext}\` | Joi schemas only |
| \`<name>.service.${ext}\` | Business logic + DB queries — no HTTP |
| \`<name>.controller.${ext}\` | HTTP in/out only — plain async functions |
| \`<name>.routes.${ext}\` | Router + middleware chain |

#### 6. Error handling — throw from services, catch centrally
\`\`\`${ext}
import createError from 'http-errors';
import { ErrorCodes } from '@/constants/error-codes.js';
throw createError(404, ErrorCodes.USER_NOT_FOUND);
\`\`\`

#### 7. Path alias — always use \`@/\`
\`\`\`${ext}
import { config }  from '@/config/config.js';
import User        from '@/models/user.model.js';
import { paginate, paginatedResponse } from '@/utils/paginate.js';
\`\`\`

#### 8. Pagination — always use the shared utility
\`\`\`${ext}
import { paginate, paginatedResponse } from '@/utils/paginate.js';

export const listItems = async (query) => {
  const { page, limit, skip } = paginate(query);
  const [items, total] = await Promise.all([
    Model.find().skip(skip).limit(limit),
    Model.countDocuments(),
  ]);
  return paginatedResponse(items, total, page, limit);
  // → { items, total, page, limit, totalPages, hasNext, hasPrev }
};
\`\`\`

#### 9. Request ID — include in all log calls
\`\`\`${ext}
logger.info('ORDER_CREATED', { requestId: res.locals.requestId, orderId });
\`\`\`

---

### Scaffolding a New Module

\`\`\`bash
npm run generate product           # creates 5 files, auto-mounted at /product
npm run generate product --dry-run # preview without writing
npm run generate -- --list         # list existing modules
\`\`\`

---

### Built-in Endpoints

| Endpoint | Description |
|----------|-------------|
| \`GET /health\` | \`{ status, uptime, db, timestamp }\` — Docker HEALTHCHECK |
${includeSwagger ? `| \`GET /docs\` | Swagger UI — auto-generated from \`@doc\` comments (dev only) |` : ''}
`;
}

function buildKiroSteering(content, config) {
  return `---
inclusion: auto
---

# ${config.projectName} — Project Conventions

${content}`;
}

function buildCursorRules(content, config) {
  return `---
description: ${config.projectName} project conventions and architecture rules
globs: ["src/**/*"]
alwaysApply: true
---

# ${config.projectName} — Project Conventions

${content}`;
}

function buildClaudeMd(content, config) {
  return `# ${config.projectName}

This file provides Claude with context about the project's architecture and conventions.

${content}`;
}
