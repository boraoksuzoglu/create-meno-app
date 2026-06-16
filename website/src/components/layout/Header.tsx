'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogoLockup, LogoMark } from './Logo';
import { GitHubIcon, NpmIcon } from './Icons';
import { cn } from '@/lib/utils';

const GITHUB = 'https://github.com/boraoksuzoglu/create-meno-app';
const NPM = 'https://www.npmjs.com/package/create-meno-app';

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-colors duration-300',
        scrolled
          ? 'border-line bg-base/80 backdrop-blur-xl'
          : 'border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" aria-label="create-meno-app home" className="flex items-center">
          <LogoLockup className="hidden h-7 sm:block" />
          <LogoMark className="h-8 w-8 sm:hidden" />
        </Link>

        <nav className="hidden items-center gap-1 font-mono text-[13px] text-ink-muted md:flex">
          <Link href="/docs/getting-started" className="rounded-lg px-3 py-2 transition-colors hover:bg-white/[0.04] hover:text-ink">
            Docs
          </Link>
          <Link href="/#config-builder" className="rounded-lg px-3 py-2 transition-colors hover:bg-white/[0.04] hover:text-ink">
            Builder
          </Link>
          <Link href="/docs/docs-generator" className="rounded-lg px-3 py-2 transition-colors hover:bg-white/[0.04] hover:text-ink">
            Docs&nbsp;gen
          </Link>
          <Link href="/docs/ai-context" className="rounded-lg px-3 py-2 transition-colors hover:bg-white/[0.04] hover:text-ink">
            AI-friendly
          </Link>
        </nav>

        <div className="flex items-center gap-1.5">
          <a
            href={NPM}
            target="_blank"
            rel="noreferrer"
            aria-label="create-meno-app on npm"
            className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-white/[0.04] hover:text-ink"
          >
            <NpmIcon className="h-5 w-5" />
          </a>
          <a
            href={GITHUB}
            target="_blank"
            rel="noreferrer"
            aria-label="create-meno-app on GitHub"
            className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-white/[0.04] hover:text-ink"
          >
            <GitHubIcon className="h-5 w-5" />
          </a>
          <Link href="/docs/getting-started" className="btn-primary ml-1 hidden text-[13px] sm:inline-flex">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
