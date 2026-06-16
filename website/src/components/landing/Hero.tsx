'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { TerminalAnimation } from './TerminalAnimation';
import { CopyButton } from '@/components/CopyButton';
import { ArrowIcon } from '@/components/layout/Icons';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function Hero({ version }: { version: string }) {
  return (
    <section className="relative overflow-hidden pt-16 pb-24 sm:pt-24">
      {/* background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid bg-grid-fade opacity-60" />
        <div className="absolute left-1/2 top-[-10%] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-emerald/10 blur-[140px]" />
        <div className="absolute right-[5%] top-[20%] h-[360px] w-[360px] rounded-full bg-cyan/10 blur-[130px]" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.05fr_1fr]">
        {/* left */}
        <div>
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
            <span className="eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald animate-pulse-dot" />
              MongoDB · Express · Node.js
            </span>
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-6 text-[2.6rem] font-bold leading-[1.04] tracking-tight sm:text-6xl"
          >
            Scaffold a full
            <br />
            backend in <span className="text-emerald-gradient">seconds</span>,
            <br />
            <span className="text-ink-muted">not hours.</span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-muted"
          >
            <span className="font-mono text-emerald">create-meno-app</span> generates a
            production-ready API with an{' '}
            <span className="text-ink">AI-friendly</span> architecture and an{' '}
            <span className="text-ink">auto docs generator that never drifts</span> — zero
            boilerplate, fully configurable, JavaScript or TypeScript.
          </motion.p>

          {/* command pill */}
          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-8 flex items-center justify-between gap-3 rounded-xl border border-line-bright bg-panel/80 px-4 py-3 font-mono text-sm backdrop-blur"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="text-emerald">$</span>
              <span className="truncate text-ink">npx create-meno-app my-api</span>
            </span>
            <CopyButton value="npx create-meno-app my-api" label="copy" />
          </motion.div>

          <motion.div
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-6 flex flex-wrap items-center gap-3"
          >
            <Link href="/docs/getting-started" className="btn-primary">
              Get started
              <ArrowIcon />
            </Link>
            <Link href="/#config-builder" className="btn-ghost">
              Build your config
            </Link>
          </motion.div>

          <motion.div
            custom={5}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs text-ink-faint"
          >
            <span className="flex items-center gap-1.5"><Check /> Express 5</span>
            <span className="flex items-center gap-1.5"><Check /> Mongoose 9</span>
            <span className="flex items-center gap-1.5"><Check /> Node 18+</span>
            <span className="flex items-center gap-1.5"><Check /> MIT licensed</span>
          </motion.div>
        </div>

        {/* right — terminal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <TerminalAnimation version={version} />
        </motion.div>
      </div>
    </section>
  );
}

function Check() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" aria-hidden>
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
