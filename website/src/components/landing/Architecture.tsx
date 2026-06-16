import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';

const features = [
  {
    title: 'Auto route loader',
    body: 'Drop example.routes.ts in src/modules/ and it mounts at /example. No app.use(), no central registry.',
    glyph: '⇄',
  },
  {
    title: 'Auto async wrapping',
    body: 'Controllers are plain async functions. Thrown errors are forwarded to the error handler automatically.',
    glyph: '↯',
  },
  {
    title: 'Validated config',
    body: 'Every env var is read once, in one place, and the server refuses to boot if something required is missing.',
    glyph: '◆',
  },
  {
    title: 'Request IDs',
    body: 'An X-Request-ID is attached to every request for clean correlation across logs and traces.',
    glyph: '#',
  },
  {
    title: 'Graceful shutdown',
    body: 'SIGTERM/SIGINT drains in-flight requests and closes the database connection cleanly.',
    glyph: '⏻',
  },
  {
    title: 'Health checks',
    body: 'GET /health returns status, uptime and DB state — ready for Docker and load balancers.',
    glyph: '♥',
  },
  {
    title: 'Pagination utility',
    body: 'paginate() + paginatedResponse() give consistent page / limit / totalPages everywhere.',
    glyph: '⠿',
  },
  {
    title: 'Index sync at startup',
    body: 'ensureIndexes() runs on boot so a missing index never silently slips into production.',
    glyph: '⊞',
  },
];

export function Architecture() {
  return (
    <section className="relative border-t border-line py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Zero boilerplate"
          title="The plumbing is already done"
          description="The conventions that usually take a day of wiring — routing, error handling, config, observability — ship working out of the box."
        />

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={(i % 4) * 0.05}>
              <div className="group h-full bg-panel p-6 transition-colors hover:bg-panel-2">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-line-bright bg-base font-mono text-lg text-emerald transition-colors group-hover:border-emerald/40">
                  {f.glyph}
                </div>
                <h3 className="text-[15px] font-semibold text-ink">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
