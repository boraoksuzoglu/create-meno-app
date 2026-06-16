import Link from 'next/link';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';
import { CodeWindow, t } from './CodeWindow';
import { ArrowIcon } from '@/components/layout/Icons';

const points = [
  {
    title: 'Context files, generated',
    body: 'Opt into CLAUDE.md, .cursor/rules and .kiro/steering files that teach any agent your project’s non-negotiable conventions on day one.',
  },
  {
    title: 'One pattern, everywhere',
    body: 'Every module is validation → service → controller → routes. Predictable structure means an AI edits the right file the first time.',
  },
  {
    title: 'A single source of config',
    body: 'All env reads flow through one validated config module — no magic process.env scattered for an agent to miss.',
  },
  {
    title: 'llms.txt-ready docs',
    body: 'The Markdown docs generator emits clean, link-rich pages an LLM can ingest as flat context.',
  },
];

export function AiFriendly() {
  return (
    <section className="relative border-t border-line py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          align="left"
          eyebrow="Built for agents"
          title={
            <>
              An architecture your <span className="text-brand-gradient">AI pair</span> already understands
            </>
          }
          description="create-meno-app doesn’t just scaffold code — it scaffolds the conventions and context that let coding agents extend your backend without guessing."
        />

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {points.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.06}>
                <div className="surface surface-hover h-full p-5">
                  <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-md border border-emerald/40 bg-emerald/10 font-mono text-xs text-emerald">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 className="text-[15px] font-semibold text-ink">{p.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <CodeWindow title="CLAUDE.md" className="lg:sticky lg:top-24">
              <code>
                {t.c('# Project conventions (auto-generated)')}
                {'\n\n'}
                {t.d('## Non-negotiable rules')}
                {'\n'}
                {t.p('-')} {t.d('All Mongoose models live in')} {t.f('src/models/')}
                {'\n'}
                {t.p('-')} {t.d('Routes auto-mount from')} {t.f('src/modules/<name>/')}
                {'\n'}
                {t.p('-')} {t.d('Controllers are plain')} {t.k('async')} {t.d('functions')}
                {'\n'}
                {t.p('-')} {t.d('Read env only via')} {t.f('@/config/config')}
                {'\n\n'}
                {t.d('## Scaffold a module')}
                {'\n'}
                {t.s('npm run generate product')}
                {'\n\n'}
                {t.d('## Regenerate docs')}
                {'\n'}
                {t.s('npm run docs')}
              </code>
            </CodeWindow>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="mt-8">
            <Link href="/docs/ai-context" className="inline-flex items-center gap-1.5 font-mono text-sm text-emerald transition-colors hover:text-emerald-bright">
              Read the AI-friendly guide <ArrowIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
