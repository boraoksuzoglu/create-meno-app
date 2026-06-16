import Link from 'next/link';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';
import { CodeWindow, t } from './CodeWindow';
import { ArrowIcon } from '@/components/layout/Icons';

export function DocsGenerator() {
  return (
    <section className="relative border-t border-line py-24">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/4 h-[420px] w-[700px] -translate-x-1/2 rounded-full bg-cyan/[0.07] blur-[150px]" />
      </div>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="The flagship feature"
          title={
            <>
              Docs that are <span className="text-brand-gradient">derived</span>, never written twice
            </>
          }
          description="One introspection engine reads your routes, Joi schemas and Mongoose models — then powers both the Markdown docs and the Swagger UI. They can’t drift, because they share a brain."
        />

        <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-3">
          {/* input */}
          <Reveal>
            <CodeWindow title="example.routes.ts" className="h-full">
              <code>
                {t.c('// @doc Create example | 201')}
                {'\n'}
                {t.c('// @desc Creates and returns a new example.')}
                {'\n'}
                {t.f('router')}.{t.f('post')}(
                {t.s("'/'")}, {'\n  '}
                {t.f('validateBody')}({t.f('createExampleSchema')}),
                {'\n  '}
                {t.f('ctrl')}.{t.f('create')},
                {'\n'}
                );
              </code>
            </CodeWindow>
          </Reveal>

          {/* engine */}
          <Reveal delay={0.08}>
            <div className="surface flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-xl border border-cyan/40 bg-cyan/10">
                <div className="absolute inset-0 rounded-xl bg-cyan/20 blur-xl" />
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="1.6" className="relative">
                  <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div className="font-mono text-[13px] text-cyan">doc-introspect</div>
              <p className="text-sm leading-relaxed text-ink-muted">
                Reads route annotations, infers request bodies from <span className="text-ink">Joi</span>,
                and traces responses through the <span className="text-ink">controller → service → model</span> chain.
              </p>
              <div className="flex flex-wrap justify-center gap-1.5 font-mono text-[11px]">
                <span className="rounded border border-line bg-base px-2 py-0.5 text-ink-faint">@doc</span>
                <span className="rounded border border-line bg-base px-2 py-0.5 text-ink-faint">@desc</span>
                <span className="rounded border border-line bg-base px-2 py-0.5 text-ink-faint">@body</span>
                <span className="rounded border border-line bg-base px-2 py-0.5 text-ink-faint">@query</span>
                <span className="rounded border border-line bg-base px-2 py-0.5 text-ink-faint">@response</span>
              </div>
            </div>
          </Reveal>

          {/* outputs */}
          <Reveal delay={0.16}>
            <div className="grid h-full grid-rows-2 gap-6">
              <CodeWindow title="docs/modules/example.md" tab="file">
                <code>
                  {t.d('### POST /example')}
                  {'\n'}
                  {t.c('Creates and returns a new example.')}
                  {'\n\n'}
                  {t.p('**Body**')} {t.d('— derived from Joi')}
                  {'\n'}
                  {t.f('name')} {t.k('string')} {t.n('required')}
                </code>
              </CodeWindow>
              <CodeWindow title="GET /docs — Swagger" tab="shell">
                <code>
                  {t.s('✓')} {t.d('OpenAPI 3 spec served')}
                  {'\n'}
                  {t.s('✓')} {t.d('Same engine · always in sync')}
                  {'\n'}
                  {t.s('✓')} {t.f('npm run docs -- --check')}
                  {'\n  '}
                  {t.c('# fails CI if docs are stale')}
                </code>
              </CodeWindow>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="mt-8 flex justify-center">
            <Link href="/docs/docs-generator" className="btn-ghost">
              How the docs generator works
              <ArrowIcon />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
