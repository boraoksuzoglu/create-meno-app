import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';

const groups = [
  {
    label: 'Auth & access',
    items: ['Session auth', 'Register / login / logout', 'Password reset flow', 'RBAC middleware', 'create:admin script', 'bcrypt hashing'],
  },
  {
    label: 'Data & delivery',
    items: ['Mongoose 9 models', 'Joi validation', 'Pagination helper', 'Index sync', 'Email via Gmail API', 'en + tr templates'],
  },
  {
    label: 'Infrastructure',
    items: ['Rate limit · memory', 'Rate limit · MongoDB', 'Rate limit · Redis', 'Upload · local disk', 'Upload · GCS', 'Winston logging'],
  },
  {
    label: 'Quality & ship',
    items: ['Jest + supertest', 'In-memory MongoDB', 'ESLint flat config', 'Prettier + Husky', 'Dockerfile + compose', 'GitHub Actions CI'],
  },
];

export function FeatureMatrix() {
  return (
    <section className="relative border-t border-line py-24">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-dots opacity-25" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Pick what you need"
          title="Choice, not constraints"
          description="Every capability is an opt-in toggle. Start minimal or generate the whole platform — the matrix is yours."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((g, gi) => (
            <Reveal key={g.label} delay={gi * 0.06}>
              <div className="surface h-full p-5">
                <div className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-emerald">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
                  {g.label}
                </div>
                <ul className="space-y-2.5">
                  {g.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-ink-muted">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.6" className="mt-0.5 shrink-0">
                        <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
