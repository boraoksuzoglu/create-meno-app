import Link from 'next/link';
import { Header } from '@/components/layout/Header';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-5 text-center">
        <div className="font-mono text-sm text-emerald">404 — not found</div>
        <h1 className="mt-4 font-mono text-4xl font-bold text-ink">
          <span className="text-ink-faint">$</span> cd /this/page
        </h1>
        <p className="mt-4 text-ink-muted">
          <span className="font-mono text-rose">zsh:</span> no such file or directory. The page you
          were looking for doesn&apos;t exist.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/" className="btn-primary">
            Back home
          </Link>
          <Link href="/docs/getting-started" className="btn-ghost">
            Read the docs
          </Link>
        </div>
      </main>
    </>
  );
}
