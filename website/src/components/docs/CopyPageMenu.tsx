'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';

const SITE_URL = 'https://meno.borao.dev';

function aiPrompt(mdUrl: string) {
  return encodeURIComponent(
    `Read this documentation page, so I can ask questions about it:\n\n${mdUrl}`,
  );
}

export function CopyPageMenu({ slug, markdown }: { slug: string; markdown: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const mdUrl = `${SITE_URL}/docs/${slug}/md`;
  const prompt = aiPrompt(mdUrl);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
    setOpen(false);
  }

  const links = [
    { label: 'View Markdown', href: `/docs/${slug}/md`, external: true, icon: <MdIcon /> },
    { label: 'Open in ChatGPT', href: `https://chatgpt.com/?q=${prompt}`, external: true, icon: <ChatGptIcon /> },
    { label: 'Open in Claude', href: `https://claude.ai/new?q=${prompt}`, external: true, icon: <ClaudeIcon /> },
    { label: 'Open in Claude Code', href: `claude-cli://open?q=${prompt}`, external: false, icon: <ClaudeCodeIcon /> },
    { label: 'Open in Cursor', href: `https://cursor.com/link/prompt?text=${prompt}`, external: true, icon: <CursorIcon /> },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg border border-line-bright bg-panel/70 px-3 py-1.5 font-mono text-[12.5px] text-ink-muted backdrop-blur transition-colors hover:border-emerald/40 hover:text-emerald',
          open && 'border-emerald/40 text-emerald',
        )}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? 'Copied' : 'Copy page'}
        <ChevronIcon className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="absolute right-0 z-50 mt-2 w-60 origin-top-right rounded-xl border border-line-bright bg-panel/95 p-1.5 shadow-[0_24px_70px_-28px_rgba(0,0,0,0.9)] backdrop-blur-xl"
          >
            <button
              type="button"
              role="menuitem"
              onClick={copyMarkdown}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-ink-muted transition-colors hover:bg-white/[0.04] hover:text-ink"
            >
              <span className="text-ink-faint"><CopyIcon /></span>
              Copy Markdown
            </button>

            <div className="my-1 h-px bg-line" />

            {links.map((link) => (
              <a
                key={link.label}
                role="menuitem"
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-muted transition-colors hover:bg-white/[0.04] hover:text-ink"
              >
                <span className="text-ink-faint">{link.icon}</span>
                {link.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---- icons ---- */
function CopyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
function MdIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.27 19.385H1.73A1.73 1.73 0 0 1 0 17.655V6.345a1.73 1.73 0 0 1 1.73-1.73h20.54A1.73 1.73 0 0 1 24 6.345v11.308a1.73 1.73 0 0 1-1.73 1.732ZM5.77 15.923v-4.5l2.307 2.884 2.308-2.884v4.5h2.308V8.077h-2.308l-2.308 2.885L5.77 8.077H3.46v7.846Zm15.462-3.923h-2.308V8.077h-2.308V12h-2.307l3.461 4.039Z" />
    </svg>
  );
}
function ChatGptIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.998-2.9 6.056 6.056 0 0 0-.747-7.073ZM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.07.07 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494ZM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646ZM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872Zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667Zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66Zm-12.64 4.135-2.02-1.169a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681Zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5Z" />
    </svg>
  );
}
function ClaudeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.71 15.96l4.72-2.65.08-.23-.08-.13h-.23l-.79-.05-2.69-.07-2.34-.1-2.26-.12-.57-.12L0 11.62l.05-.35.48-.32.69.06 1.52.1 2.27.16 1.65.1 2.45.25h.39l.05-.16-.13-.1-.1-.09-2.34-1.59-2.55-1.69-1.33-.97-.72-.49-.37-.46-.16-1.01.66-.72.88.06.22.06.9.69 1.9 1.47 2.49 1.83.36.31.15-.11.02-.07-.17-.27L7.6 6.97 6.15 4.48l-.64-1.03-.17-.62c-.06-.25-.1-.47-.1-.73L6 1.13 6.7 1l1 .13.42.36.62 1.42 1 2.22 1.55 3.03.46.9.24.83.09.25h.16v-.14l.13-1.71.24-2.1.23-2.69.08-.76.38-.91.74-.49.58.28.48.69-.07.44-.28 1.85-.56 2.9-.36 1.94h.21l.24-.24.98-1.3 1.65-2.07.73-.82.85-.9.55-.44h1.03l.76 1.13-.34 1.16-1.07 1.35-.88 1.14-1.26 1.7-.79 1.36.07.11.19-.02 2.85-.6 1.54-.28 1.84-.32.83.39.09.4-.33.8-1.97.49-2.3.46-3.44.82-.04.03.05.06 1.55.15.66.04h1.62l3.02.23.79.52.47.64-.08.48-1.21.62-1.64-.39-3.83-.91-1.31-.33h-.18v.11l1.09 1.07 2 1.81 2.51 2.33.13.58-.32.45-.34-.05-2.2-1.66-.85-.74-1.92-1.62h-.13v.17l.44.65 2.34 3.52.12 1.08-.17.35-.61.21-.67-.12-1.37-1.92-1.42-2.17-1.14-1.95-.14.08-.67 7.25-.32.37-.73.28-.6-.46-.32-.75.32-1.47.39-1.93.31-1.53.29-1.9.17-.63-.01-.04-.14.02-1.43 1.96-2.18 2.95-1.72 1.84-.41.16-.72-.37.07-.66.4-.59 2.39-3.03 1.44-1.88.93-1.09-.01-.16h-.05l-6.34 4.12-1.13.14-.48-.45.06-.75.23-.24 1.9-1.31z" />
    </svg>
  );
}
function ClaudeCodeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 10.95H24v3.1h-3v3.03h-1.49V20H18v-2.92h-1.49V20H15v-2.92H9V20H7.49v-2.92H6V20H4.49v-2.92H3V14.05H0v-3.1h3V5h18v5.95ZM6 10.95h1.49V8.1H6v2.85Zm10.51 0H18V8.1h-1.49v2.85Z" />
    </svg>
  );
}
function CursorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.5.13 1.89 5.68a.84.84 0 0 0-.42.73v11.18c0 .3.16.58.42.73l9.61 5.55a1 1 0 0 0 1 0l9.61-5.55a.84.84 0 0 0 .42-.73V6.4a.84.84 0 0 0-.42-.72L12.5.13a1.01 1.01 0 0 0-1 0Zm-8.84 6.2h18.55c.26 0 .43.29.3.52L12.23 22.9c-.06.1-.23.06-.23-.06V12.34a.59.59 0 0 0-.3-.51L2.6 6.57c-.11-.06-.06-.23.06-.23Z" />
    </svg>
  );
}
