'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { CopyButton } from '@/components/CopyButton';
import { ArrowIcon } from '@/components/layout/Icons';

export function Cta() {
  return (
    <section className="relative overflow-hidden border-t border-line py-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000,transparent)]" />
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald/10 blur-[150px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-3xl px-5 text-center sm:px-8"
      >
        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl sm:leading-[1.08]">
          Your next backend is one
          <br />
          <span className="text-emerald-gradient">command</span> away.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[17px] text-ink-muted">
          No setup ceremony. No boilerplate to copy. Run it and start building features.
        </p>

        <div className="mx-auto mt-9 flex max-w-md items-center justify-between gap-3 rounded-xl border border-line-bright bg-panel/80 px-4 py-3.5 font-mono text-sm backdrop-blur">
          <span className="flex items-center gap-2.5">
            <span className="text-emerald">$</span>
            <span className="text-ink">npx create-meno-app my-api</span>
          </span>
          <CopyButton value="npx create-meno-app my-api" />
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link href="/docs/getting-started" className="btn-primary">
            Read the docs <ArrowIcon />
          </Link>
          <a href="https://github.com/boraoksuzoglu/create-meno-app" target="_blank" rel="noreferrer" className="btn-ghost">
            Star on GitHub
          </a>
        </div>
      </motion.div>
    </section>
  );
}
