'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { docsGroups } from '@/lib/nav';
import { cn } from '@/lib/utils';

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-7 font-mono text-[13px]">
      {docsGroups.map((group) => (
        <div key={group.group}>
          <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            {group.group}
          </div>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const href = `/docs/${item.slug}`;
              const active = pathname === href;
              return (
                <Link
                  key={item.slug}
                  href={href}
                  onClick={onNavigate}
                  className={cn(
                    'group relative rounded-lg px-3 py-1.5 transition-colors',
                    active
                      ? 'bg-emerald/[0.08] text-emerald'
                      : 'text-ink-muted hover:bg-white/[0.03] hover:text-ink',
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-emerald shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  )}
                  {item.title}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
