'use client';

import { useEffect, useRef, useState } from 'react';

const BANNER = String.raw`
 ███╗   ███╗███████╗███╗   ██╗ ██████╗
 ████╗ ████║██╔════╝████╗  ██║██╔═══██╗
 ██╔████╔██║█████╗  ██╔██╗ ██║██║   ██║
 ██║╚██╔╝██║██╔══╝  ██║╚██╗██║██║   ██║
 ██║ ╚═╝ ██║███████╗██║ ╚████║╚██████╔╝
 ╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝ ╚═════╝`;

const PROMPTS: [string, string][] = [
  ['Language', 'TypeScript'],
  ['Include Auth module?', 'Yes'],
  ['Include RBAC (roles & permissions)?', 'Yes'],
  ['Rate limit store', 'MongoDB'],
  ['Include Gmail API email service?', 'Yes'],
  ['Include Swagger / OpenAPI (GET /docs)?', 'Yes'],
  ['Include Markdown docs generator?', 'Yes'],
  ['Generate AI context files', 'Claude · Cursor · Kiro'],
];

type Phase = 'typing' | 'banner' | 'prompts' | 'done';

const CMD = 'npx create-meno-app my-api';

export function TerminalAnimation({ version }: { version: string }) {
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState<Phase>('typing');
  const [visiblePrompts, setVisiblePrompts] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  // Auto-scroll to the bottom as the session grows, like a real terminal.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [typed, phase, visiblePrompts]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started.current) {
          started.current = true;
          run();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function run() {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) => new Promise<void>((r) => timers.push(setTimeout(r, ms)));

    (async () => {
      while (!cancelled) {
        // reset
        setTyped('');
        setVisiblePrompts(0);
        setPhase('typing');
        await wait(500);

        // type the command
        for (let i = 1; i <= CMD.length; i++) {
          if (cancelled) return;
          setTyped(CMD.slice(0, i));
          await wait(42);
        }
        await wait(450);

        // banner
        setPhase('banner');
        await wait(700);

        // prompts
        setPhase('prompts');
        for (let i = 1; i <= PROMPTS.length; i++) {
          if (cancelled) return;
          setVisiblePrompts(i);
          await wait(260);
        }
        await wait(450);

        // done
        setPhase('done');
        await wait(6500);
      }
    })();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }

  return (
    <div ref={containerRef} className="terminal scanlines relative">
      <div className="terminal-bar">
        <span className="traffic bg-rose/80" />
        <span className="traffic bg-amber/80" />
        <span className="traffic bg-emerald/80" />
        <span className="ml-3 font-mono text-[11px] text-ink-faint">zsh — create-meno-app</span>
      </div>

      <div
        ref={scrollRef}
        className="h-[420px] overflow-y-auto p-5 font-mono text-[12.5px] leading-[1.55] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:text-[13px]"
      >
        {/* command line */}
        <div className="flex flex-wrap items-center gap-x-2">
          <span className="text-emerald">➜</span>
          <span className="text-cyan">~/projects</span>
          <span className="text-ink">
            {typed}
            {phase === 'typing' && (
              <span className="ml-px inline-block h-[1.05em] w-[7px] translate-y-[2px] bg-emerald animate-blink" />
            )}
          </span>
        </div>

        {phase !== 'typing' && (
          <>
            {/* banner */}
            <pre
              className="mt-3 text-[7px] leading-[1.1] sm:text-[8px]"
              style={{
                backgroundImage: 'linear-gradient(110deg, #38bdf8, #22d3ee, #34d399)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                width: 'fit-content',
              }}
            >
              {BANNER}
            </pre>
            <div className="mt-1 text-ink-faint">
              create-meno-app <span className="text-emerald">v{version}</span>
            </div>
            <div className="text-ink-faint">MongoDB · Express · Node.js</div>
            <div className="mb-2 text-ink-faint">Production-ready boilerplate generator</div>
          </>
        )}

        {(phase === 'prompts' || phase === 'done') && (
          <div className="space-y-[3px]">
            {PROMPTS.slice(0, phase === 'done' ? PROMPTS.length : visiblePrompts).map(([q, a]) => (
              <div key={q} className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-emerald">?</span>
                <span className="text-ink-muted">{q}</span>
                <span className="text-cyan">›</span>
                <span className="text-lime">{a}</span>
              </div>
            ))}
          </div>
        )}

        {phase === 'done' && (
          <div className="mt-3 space-y-[3px]">
            <div className="text-emerald">✓ Project created!</div>
            <div className="mt-2 text-ink-faint">Next steps:</div>
            <div className="text-ink-muted">
              <span className="text-cyan">cd</span> my-api
            </div>
            <div className="text-ink-muted">
              <span className="text-cyan">npm</span> install
            </div>
            <div className="text-ink-muted">
              <span className="text-cyan">npm</span> run dev
            </div>
            <div className="mt-1 flex items-center gap-2 text-ink">
              <span className="text-emerald">➜</span>
              <span className="inline-block h-[1.05em] w-[7px] translate-y-[2px] bg-emerald animate-blink" />
            </div>
          </div>
        )}
      </div>

      {/* bottom glow */}
      <div className="pointer-events-none absolute inset-x-0 -bottom-8 h-16 bg-emerald/20 blur-3xl" />
    </div>
  );
}
