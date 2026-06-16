import { cn } from '@/lib/utils';

/**
 * A static terminal/editor window for hand-tokenized code snippets on the
 * landing page (no runtime highlighter needed — kept deliberately lightweight).
 */
export function CodeWindow({
  title,
  children,
  className,
  tab = 'file',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  tab?: 'file' | 'shell';
}) {
  return (
    <div className={cn('terminal', className)}>
      <div className="terminal-bar">
        <span className="traffic bg-rose/80" />
        <span className="traffic bg-amber/80" />
        <span className="traffic bg-emerald/80" />
        <span className="ml-3 font-mono text-[11px] text-ink-faint">
          {tab === 'shell' ? '$' : '◈'} {title}
        </span>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-[1.7] text-ink-muted">
        {children}
      </pre>
    </div>
  );
}

/* token helpers */
export const t = {
  k: (s: string) => <span className="text-[#ff7b9c]">{s}</span>, // keyword
  f: (s: string) => <span className="text-[#82aaff]">{s}</span>, // function / type
  s: (s: string) => <span className="text-lime">{s}</span>, // string
  c: (s: string) => <span className="text-ink-faint italic">{s}</span>, // comment
  p: (s: string) => <span className="text-cyan">{s}</span>, // punctuation accent / path
  n: (s: string) => <span className="text-amber">{s}</span>, // number / constant
  d: (s: string) => <span className="text-ink">{s}</span>, // default bright
};
