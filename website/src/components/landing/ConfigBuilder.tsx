'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CopyButton } from '@/components/CopyButton';
import { SectionHeading } from './SectionHeading';
import { cn } from '@/lib/utils';

interface Config {
  language: 'ts' | 'js';
  auth: boolean;
  rbac: boolean;
  rateLimit: boolean;
  rateStore: 'memory' | 'mongo' | 'redis';
  logger: boolean;
  upload: boolean;
  uploadProvider: 'local' | 'gcs';
  email: boolean;
  emailMultiLang: boolean;
  jest: boolean;
  eslint: boolean;
  swagger: boolean;
  mdDocs: boolean;
  docker: boolean;
  ci: boolean;
  claude: boolean;
  cursor: boolean;
  kiro: boolean;
}

const DEFAULTS: Config = {
  language: 'ts',
  auth: true,
  rbac: true,
  rateLimit: true,
  rateStore: 'mongo',
  logger: true,
  upload: false,
  uploadProvider: 'gcs',
  email: true,
  emailMultiLang: true,
  jest: true,
  eslint: true,
  swagger: true,
  mdDocs: true,
  docker: true,
  ci: true,
  claude: true,
  cursor: false,
  kiro: false,
};

interface Line {
  key: string;
  label: string;
  depth: number;
  kind: 'dir' | 'file';
  accent?: 'emerald' | 'cyan';
}

function buildTree(c: Config): Line[] {
  const ext = c.language === 'ts' ? 'ts' : 'js';
  const lines: Line[] = [];
  const add = (label: string, depth: number, kind: 'dir' | 'file', accent?: Line['accent']) =>
    lines.push({ key: `${depth}:${label}`, label, depth, kind, accent });

  add('my-api/', 0, 'dir');
  add('src/', 1, 'dir');

  add('config/', 2, 'dir');
  add(`config.${ext}`, 3, 'file', 'emerald');

  add('constants/', 2, 'dir');
  add(`error-codes.${ext}`, 3, 'file');
  if (c.auth) add(`roles.${ext}`, 3, 'file');

  add('middlewares/', 2, 'dir');
  if (c.auth) add(`auth.middleware.${ext}`, 3, 'file', 'emerald');
  add(`error.middleware.${ext}`, 3, 'file');
  if (c.rateLimit) add(`ratelimit.middleware.${ext}`, 3, 'file', 'emerald');
  add(`request-id.middleware.${ext}`, 3, 'file');
  add(`validation.middleware.${ext}`, 3, 'file');

  add('models/', 2, 'dir');
  add(`example.model.${ext}`, 3, 'file');
  if (c.auth) add(`user.model.${ext}`, 3, 'file', 'emerald');

  add('modules/', 2, 'dir');
  if (c.auth) {
    add('auth/ → /auth', 3, 'dir', 'emerald');
  }
  add('example/ → /example', 3, 'dir');
  add('health/ → /health', 3, 'dir');

  if (c.email) {
    add('services/email/', 2, 'dir', 'cyan');
    add(`email.service.${ext}`, 3, 'file');
    add('templates/emails/', 2, 'dir', 'cyan');
    add('welcome.hbs', 3, 'file');
    add('locales/email/', 2, 'dir', 'cyan');
    add(`en.${ext}`, 3, 'file');
    if (c.emailMultiLang) add(`tr.${ext}`, 3, 'file', 'cyan');
  }

  if (c.auth || c.mdDocs) {
    add('scripts/', 2, 'dir');
    if (c.auth) add(`create-admin.${ext}`, 3, 'file');
    if (c.mdDocs) add(`generate-docs.${ext}`, 3, 'file', 'cyan');
  }

  add('utils/', 2, 'dir');
  add(`route-loader.${ext}`, 3, 'file', 'emerald');
  add(`paginate.${ext}`, 3, 'file');
  add(`graceful-shutdown.${ext}`, 3, 'file');
  if (c.logger) add(`logger.${ext}`, 3, 'file', 'cyan');
  if (c.swagger || c.mdDocs) add(`doc-introspect.${ext}`, 3, 'file', 'cyan');
  if (c.swagger) add(`swagger.${ext}`, 3, 'file', 'cyan');
  if (c.upload) add(`upload.${ext}`, 3, 'file', 'cyan');

  add(`server.${ext}`, 2, 'file', 'emerald');

  // root files
  add('package.json', 1, 'file');
  add('.env.example', 1, 'file');
  if (c.language === 'ts') add('tsconfig.json', 1, 'file');
  if (c.jest) add('jest.config.js', 1, 'file', 'cyan');
  if (c.eslint) add('eslint.config.mjs', 1, 'file', 'cyan');
  if (c.docker) add('Dockerfile', 1, 'file', 'cyan');
  if (c.docker) add('docker-compose.yml', 1, 'file', 'cyan');
  if (c.ci) add('.github/workflows/ci.yml', 1, 'file', 'cyan');
  if (c.claude) add('CLAUDE.md', 1, 'file', 'emerald');
  if (c.cursor) add('.cursor/rules/project.mdc', 1, 'file', 'emerald');
  if (c.kiro) add('.kiro/steering/project.md', 1, 'file', 'emerald');
  add('README.md', 1, 'file');

  return lines;
}

function answers(c: Config): [string, string][] {
  const a: [string, string][] = [['Language', c.language === 'ts' ? 'TypeScript' : 'JavaScript (ESM)']];
  a.push(['Auth module', c.auth ? 'Yes' : 'No']);
  if (c.auth) a.push(['RBAC', c.rbac ? 'Yes' : 'No']);
  a.push(['Rate limiting', c.rateLimit ? (c.rateStore === 'mongo' ? 'MongoDB' : c.rateStore === 'redis' ? 'Redis' : 'In-memory') : 'No']);
  a.push(['Winston logger', c.logger ? 'Yes' : 'No']);
  a.push(['File upload', c.upload ? (c.uploadProvider === 'gcs' ? 'Google Cloud Storage' : 'Local disk') : 'No']);
  a.push(['Email service', c.email ? (c.emailMultiLang ? 'Gmail · en + tr' : 'Gmail') : 'No']);
  a.push(['Jest tests', c.jest ? 'Yes' : 'No']);
  a.push(['ESLint + Prettier', c.eslint ? 'Yes' : 'No']);
  a.push(['Swagger / OpenAPI', c.swagger ? 'Yes' : 'No']);
  a.push(['Markdown docs', c.mdDocs ? 'Yes' : 'No']);
  a.push(['Docker', c.docker ? 'Yes' : 'No']);
  a.push(['GitHub Actions', c.ci ? 'Yes' : 'No']);
  const ai = [c.claude && 'Claude', c.cursor && 'Cursor', c.kiro && 'Kiro'].filter(Boolean).join(' · ');
  a.push(['AI context', ai || 'None']);
  return a;
}

export function ConfigBuilder() {
  const [c, setC] = useState<Config>(DEFAULTS);
  const tree = useMemo(() => buildTree(c), [c]);
  const ans = useMemo(() => answers(c), [c]);
  const fileCount = tree.filter((l) => l.kind === 'file').length;

  const set = <K extends keyof Config>(key: K, value: Config[K]) => setC((p) => ({ ...p, [key]: value }));

  return (
    <section id="config-builder" className="relative scroll-mt-20 border-t border-line py-24">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-dots opacity-30" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Interactive"
          title="Build your config, watch it compile"
          description="Toggle the same prompts the CLI asks and see exactly what gets generated — the project tree updates live as conditional files appear and disappear."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.05fr]">
          {/* controls */}
          <div className="surface p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Language">
                <Segmented
                  value={c.language}
                  onChange={(v) => set('language', v as Config['language'])}
                  options={[
                    { value: 'ts', label: 'TypeScript' },
                    { value: 'js', label: 'JavaScript' },
                  ]}
                />
              </Field>

              <Field label="Rate limit store" disabled={!c.rateLimit}>
                <Segmented
                  value={c.rateStore}
                  disabled={!c.rateLimit}
                  onChange={(v) => set('rateStore', v as Config['rateStore'])}
                  options={[
                    { value: 'memory', label: 'Memory' },
                    { value: 'mongo', label: 'Mongo' },
                    { value: 'redis', label: 'Redis' },
                  ]}
                />
              </Field>

              <Field label="Upload provider" disabled={!c.upload}>
                <Segmented
                  value={c.uploadProvider}
                  disabled={!c.upload}
                  onChange={(v) => set('uploadProvider', v as Config['uploadProvider'])}
                  options={[
                    { value: 'local', label: 'Local disk' },
                    { value: 'gcs', label: 'GCS' },
                  ]}
                />
              </Field>

              <Field label="AI context files">
                <div className="flex flex-wrap gap-1.5">
                  <Chip active={c.claude} onClick={() => set('claude', !c.claude)}>Claude</Chip>
                  <Chip active={c.cursor} onClick={() => set('cursor', !c.cursor)}>Cursor</Chip>
                  <Chip active={c.kiro} onClick={() => set('kiro', !c.kiro)}>Kiro</Chip>
                </div>
              </Field>
            </div>

            <div className="my-5 h-px bg-line" />

            <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
              <Toggle label="Auth" checked={c.auth} onChange={(v) => set('auth', v)} />
              <Toggle label="RBAC" checked={c.rbac} disabled={!c.auth} onChange={(v) => set('rbac', v)} />
              <Toggle label="Rate limit" checked={c.rateLimit} onChange={(v) => set('rateLimit', v)} />
              <Toggle label="Logger" checked={c.logger} onChange={(v) => set('logger', v)} />
              <Toggle label="Upload" checked={c.upload} onChange={(v) => set('upload', v)} />
              <Toggle label="Email" checked={c.email} onChange={(v) => set('email', v)} />
              <Toggle label="Email i18n" checked={c.emailMultiLang} disabled={!c.email} onChange={(v) => set('emailMultiLang', v)} />
              <Toggle label="Jest" checked={c.jest} onChange={(v) => set('jest', v)} />
              <Toggle label="ESLint" checked={c.eslint} onChange={(v) => set('eslint', v)} />
              <Toggle label="Swagger" checked={c.swagger} onChange={(v) => set('swagger', v)} />
              <Toggle label="MD docs" checked={c.mdDocs} onChange={(v) => set('mdDocs', v)} />
              <Toggle label="Docker" checked={c.docker} onChange={(v) => set('docker', v)} />
              <Toggle label="GH Actions" checked={c.ci} onChange={(v) => set('ci', v)} />
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-line-bright bg-base px-4 py-3 font-mono text-sm">
              <span className="flex min-w-0 items-center gap-2 truncate">
                <span className="text-emerald">$</span>
                <span className="truncate text-ink">npx create-meno-app my-api</span>
              </span>
              <CopyButton value="npx create-meno-app my-api" />
            </div>
          </div>

          {/* preview */}
          <div className="grid gap-6">
            {/* answers */}
            <div className="terminal">
              <div className="terminal-bar">
                <span className="traffic bg-rose/80" />
                <span className="traffic bg-amber/80" />
                <span className="traffic bg-emerald/80" />
                <span className="ml-3 font-mono text-[11px] text-ink-faint">your answers</span>
              </div>
              <div className="grid max-h-[210px] grid-cols-1 gap-x-6 gap-y-1 overflow-y-auto p-4 font-mono text-[12px] sm:grid-cols-2">
                {ans.map(([q, a]) => (
                  <div key={q} className="flex items-baseline justify-between gap-2 border-b border-line/60 py-0.5">
                    <span className="text-ink-faint">{q}</span>
                    <span className={cn(a === 'No' || a === 'None' ? 'text-ink-faint' : 'text-lime')}>{a}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* file tree */}
            <div className="terminal">
              <div className="terminal-bar">
                <span className="traffic bg-rose/80" />
                <span className="traffic bg-amber/80" />
                <span className="traffic bg-emerald/80" />
                <span className="ml-3 font-mono text-[11px] text-ink-faint">my-api — {fileCount} files</span>
              </div>
              <div className="max-h-[420px] overflow-y-auto p-4 font-mono text-[12px] leading-[1.7]">
                <AnimatePresence initial={false}>
                  {tree.map((line) => (
                    <motion.div
                      key={line.key}
                      layout
                      initial={{ opacity: 0, x: -6, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, x: -6, height: 0 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      style={{ paddingLeft: `${line.depth * 1.15}rem` }}
                      className="flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <span className="text-line-bright">{line.depth > 0 ? '·' : ''}</span>
                      {line.kind === 'dir' ? (
                        <span className={cn('font-medium', line.accent === 'cyan' ? 'text-cyan' : line.accent === 'emerald' ? 'text-emerald' : 'text-ink')}>
                          {line.label}
                        </span>
                      ) : (
                        <span className={cn(line.accent === 'cyan' ? 'text-cyan/90' : line.accent === 'emerald' ? 'text-emerald/90' : 'text-ink-muted')}>
                          {line.label}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children, disabled }: { label: string; children: React.ReactNode; disabled?: boolean }) {
  return (
    <div className={cn(disabled && 'opacity-40')}>
      <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-ink-faint">{label}</div>
      {children}
    </div>
  );
}

function Segmented({
  value,
  options,
  onChange,
  disabled,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-base p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={cn(
            'relative rounded-md px-3 py-1.5 font-mono text-[12px] transition-colors',
            value === o.value ? 'text-emerald' : 'text-ink-faint hover:text-ink-muted',
            disabled && 'cursor-not-allowed',
          )}
        >
          {value === o.value && (
            <motion.span
              layoutId={`seg-${options.map((x) => x.value).join('')}`}
              className="absolute inset-0 rounded-md border border-emerald/40 bg-emerald/[0.1]"
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
          )}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md border px-2.5 py-1 font-mono text-[12px] transition-colors',
        active ? 'border-emerald/40 bg-emerald/[0.1] text-emerald' : 'border-line bg-base text-ink-faint hover:text-ink-muted',
      )}
    >
      {children}
    </button>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-left transition-colors',
        disabled ? 'cursor-not-allowed opacity-35' : 'hover:bg-white/[0.03]',
      )}
    >
      <span className={cn('font-mono text-[12.5px]', checked && !disabled ? 'text-ink' : 'text-ink-muted')}>{label}</span>
      <span
        className={cn(
          'relative h-[18px] w-[32px] shrink-0 rounded-full border transition-colors',
          checked && !disabled ? 'border-emerald/50 bg-emerald/25' : 'border-line bg-base',
        )}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 600, damping: 34 }}
          className={cn(
            'absolute top-1/2 h-[12px] w-[12px] -translate-y-1/2 rounded-full',
            checked && !disabled ? 'right-[2px] bg-emerald shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'left-[2px] bg-ink-faint',
          )}
        />
      </span>
    </button>
  );
}
