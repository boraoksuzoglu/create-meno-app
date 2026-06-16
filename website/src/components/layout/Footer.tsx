import Link from 'next/link';
import { LogoLockup } from './Logo';
import { GitHubIcon, NpmIcon } from './Icons';
import { docsGroups } from '@/lib/nav';

const GITHUB = 'https://github.com/boraoksuzoglu/create-meno-app';
const NPM = 'https://www.npmjs.com/package/create-meno-app';

export function Footer() {
  return (
    <footer className="relative border-t border-line bg-void">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" aria-label="create-meno-app home" className="inline-flex">
            <LogoLockup className="h-8" />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-muted">
            Production-ready MongoDB · Express · Node.js boilerplate generator. Scaffold a full
            backend in seconds, not hours.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <a href={GITHUB} target="_blank" rel="noreferrer" aria-label="GitHub" className="rounded-lg border border-line p-2 text-ink-muted transition-colors hover:border-line-bright hover:text-ink">
              <GitHubIcon className="h-4 w-4" />
            </a>
            <a href={NPM} target="_blank" rel="noreferrer" aria-label="npm" className="rounded-lg border border-line p-2 text-ink-muted transition-colors hover:border-line-bright hover:text-ink">
              <NpmIcon className="h-4 w-4" />
            </a>
          </div>
        </div>

        <FooterCol title="Docs" links={docsGroups[0].items.map((i) => ({ label: i.title, href: `/docs/${i.slug}` }))} />
        <FooterCol
          title="Features"
          links={[
            { label: 'Docs generator', href: '/docs/docs-generator' },
            { label: 'AI-friendly', href: '/docs/ai-context' },
            { label: 'Auth & RBAC', href: '/docs/auth-rbac' },
            { label: 'Architecture', href: '/docs/architecture' },
          ]}
        />
        <FooterCol
          title="Resources"
          links={[
            { label: 'npm package', href: NPM, external: true },
            { label: 'GitHub', href: GITHUB, external: true },
            { label: 'llms.txt', href: '/llms.txt', external: true },
            { label: 'Docs', href: '/docs/getting-started', external: false },
          ]}
        />
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-6 font-mono text-xs text-ink-faint sm:flex-row sm:px-8">
          <span>© {new Date().getFullYear()} create-meno-app · MIT License</span>
          <a href={NPM} target="_blank" rel="noreferrer" className="transition-colors hover:text-emerald">
            npm i create-meno-app
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
}) {
  return (
    <div>
      <div className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
        {title}
      </div>
      <ul className="flex flex-col gap-2 text-sm">
        {links.map((link) => (
          <li key={link.label}>
            {link.external ? (
              <a href={link.href} target="_blank" rel="noreferrer" className="text-ink-muted transition-colors hover:text-emerald">
                {link.label}
              </a>
            ) : (
              <Link href={link.href} className="text-ink-muted transition-colors hover:text-emerald">
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
