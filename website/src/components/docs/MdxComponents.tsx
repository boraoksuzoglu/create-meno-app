import type { ComponentPropsWithoutRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type CalloutType = 'note' | 'tip' | 'warning';

const calloutStyles: Record<CalloutType, { border: string; bg: string; icon: string; label: string }> = {
  note: { border: 'border-sky/40', bg: 'bg-sky/[0.06]', icon: '◆', label: 'text-sky' },
  tip: { border: 'border-emerald/40', bg: 'bg-emerald/[0.06]', icon: '✦', label: 'text-emerald' },
  warning: { border: 'border-amber/40', bg: 'bg-amber/[0.06]', icon: '▲', label: 'text-amber' },
};

function Callout({
  type = 'note',
  title,
  children,
}: {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}) {
  const s = calloutStyles[type];
  return (
    <div className={cn('my-5 rounded-xl border px-4 py-3.5', s.border, s.bg)}>
      <div className={cn('mb-1 flex items-center gap-2 font-mono text-xs uppercase tracking-wider', s.label)}>
        <span aria-hidden>{s.icon}</span>
        {title ?? type}
      </div>
      <div className="text-[14.5px] leading-relaxed text-ink-muted [&>p]:m-0">{children}</div>
    </div>
  );
}

/** A compact endpoint badge for API docs, e.g. <Endpoint method="POST" path="/auth/login" /> */
function Endpoint({ method, path }: { method: string; path: string }) {
  const colors: Record<string, string> = {
    GET: 'text-emerald border-emerald/40 bg-emerald/[0.08]',
    POST: 'text-cyan border-cyan/40 bg-cyan/[0.08]',
    PUT: 'text-amber border-amber/40 bg-amber/[0.08]',
    PATCH: 'text-amber border-amber/40 bg-amber/[0.08]',
    DELETE: 'text-rose border-rose/40 bg-rose/[0.08]',
  };
  return (
    <span className="my-1 inline-flex items-center gap-2.5 rounded-lg border border-line bg-panel px-3 py-1.5 font-mono text-[13px]">
      <span className={cn('rounded border px-1.5 py-0.5 text-[11px] font-semibold', colors[method] ?? colors.GET)}>
        {method}
      </span>
      <span className="text-ink">{path}</span>
    </span>
  );
}

function anchor(id?: string) {
  if (!id) return null;
  return (
    <a href={`#${id}`} className="ml-2 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100" aria-hidden>
      #
    </a>
  );
}

export const mdxComponents = {
  Callout,
  Endpoint,
  h2: ({ children, id, ...props }: ComponentPropsWithoutRef<'h2'>) => (
    <h2 id={id} className="group" {...props}>
      {children}
      {anchor(id)}
    </h2>
  ),
  h3: ({ children, id, ...props }: ComponentPropsWithoutRef<'h3'>) => (
    <h3 id={id} className="group" {...props}>
      {children}
      {anchor(id)}
    </h3>
  ),
  a: ({ href = '#', children, ...props }: ComponentPropsWithoutRef<'a'>) => {
    const isInternal = href.startsWith('/') || href.startsWith('#');
    if (isInternal) {
      return (
        <Link href={href} {...props}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} target="_blank" rel="noreferrer" {...props}>
        {children}
      </a>
    );
  },
};
