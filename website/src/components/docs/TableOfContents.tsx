'use client';

import { useEffect, useState } from 'react';
import type { TocItem } from '@/lib/mdx';
import { cn } from '@/lib/utils';

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string>('');

  useEffect(() => {
    const headings = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => Boolean(el));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="font-mono text-[12.5px]">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
        <span className="text-emerald">{'//'}</span> On this page
      </div>
      <ul className="flex flex-col gap-1.5 border-l border-line">
        {items.map((item) => (
          <li key={item.id} style={{ paddingLeft: item.depth === 3 ? '1.4rem' : '0.85rem' }}>
            <a
              href={`#${item.id}`}
              className={cn(
                '-ml-px block border-l-2 py-0.5 pl-3 transition-colors',
                active === item.id
                  ? 'border-emerald text-emerald'
                  : 'border-transparent text-ink-faint hover:text-ink-muted',
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
