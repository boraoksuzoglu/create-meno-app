export interface NavItem {
  title: string;
  slug: string;
  description: string;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

/** Documentation navigation — order here also drives the sidebar, sitemap and llms.txt. */
export const docsGroups: NavGroup[] = [
  {
    group: 'Getting started',
    items: [
      {
        title: 'Introduction',
        slug: 'introduction',
        description: 'What create-meno-app is and why it exists.',
      },
      {
        title: 'Quick start',
        slug: 'getting-started',
        description: 'Scaffold, install and boot your first backend in three commands.',
      },
      {
        title: 'CLI options',
        slug: 'cli-options',
        description: 'Every interactive prompt and what each one toggles.',
      },
      {
        title: 'Project structure',
        slug: 'project-structure',
        description: 'The generated folder layout and the models-vs-modules rule.',
      },
    ],
  },
  {
    group: 'Core architecture',
    items: [
      {
        title: 'Architecture',
        slug: 'architecture',
        description: 'Auto route loader, async wrapping, config validation and more.',
      },
      {
        title: 'Generate command',
        slug: 'generate-command',
        description: 'Scaffold a fully wired module with a single command.',
      },
      {
        title: 'Docs generator',
        slug: 'docs-generator',
        description: 'Markdown API docs derived from your code that never drift.',
      },
      {
        title: 'Swagger / OpenAPI',
        slug: 'swagger',
        description: 'Interactive API explorer at GET /docs, same engine.',
      },
      {
        title: 'AI-friendly',
        slug: 'ai-context',
        description: 'CLAUDE.md, Cursor and Kiro context files, llms.txt.',
      },
    ],
  },
  {
    group: 'Features',
    items: [
      {
        title: 'Auth & RBAC',
        slug: 'auth-rbac',
        description: 'Session auth, password flows and role-based access control.',
      },
      {
        title: 'Social sign-in',
        slug: 'social-sign-in',
        description: 'Google & Apple sign-in via ID-token verification — web and mobile.',
      },
      {
        title: 'Email',
        slug: 'email',
        description: 'Gmail API service with Handlebars templates and locales.',
      },
      {
        title: 'File upload',
        slug: 'file-upload',
        description: 'Local disk (Multer) or Google Cloud Storage with signed URLs.',
      },
      {
        title: 'Rate limiting',
        slug: 'rate-limiting',
        description: 'In-memory, MongoDB or Redis stores.',
      },
      {
        title: 'Logging',
        slug: 'logging',
        description: 'Winston with daily-rotating files.',
      },
      {
        title: 'Testing',
        slug: 'testing',
        description: 'Jest, supertest and an in-memory MongoDB.',
      },
      {
        title: 'Code quality',
        slug: 'code-quality',
        description: 'ESLint flat config, Prettier, Husky and lint-staged.',
      },
    ],
  },
  {
    group: 'Ship it',
    items: [
      {
        title: 'Docker & CI',
        slug: 'docker-ci',
        description: 'Dockerfile, compose, healthcheck and GitHub Actions.',
      },
      {
        title: 'Deployment',
        slug: 'deployment',
        description: 'Environment variables, builds and going to production.',
      },
    ],
  },
];

/** Flat, ordered list of all docs pages. */
export const docsNav: NavItem[] = docsGroups.flatMap((g) => g.items);

export function getDocIndex(slug: string): number {
  return docsNav.findIndex((d) => d.slug === slug);
}
