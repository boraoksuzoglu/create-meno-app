'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SectionHeading } from './SectionHeading';
import { t } from './CodeWindow';
import { cn } from '@/lib/utils';

type TabKey = 'routes' | 'controller' | 'service' | 'generate';

const tabs: { key: TabKey; label: string; title: string }[] = [
  { key: 'routes', label: 'routes.ts', title: 'src/modules/product/product.routes.ts' },
  { key: 'controller', label: 'controller.ts', title: 'src/modules/product/product.controller.ts' },
  { key: 'service', label: 'service.ts', title: 'src/modules/product/product.service.ts' },
  { key: 'generate', label: 'generate', title: '$ npm run generate product' },
];

const snippets: Record<TabKey, React.ReactNode> = {
  routes: (
    <code>
      {t.k('import')} {t.d('express')} {t.k('from')} {t.s("'express'")};{'\n'}
      {t.k('import')} {t.d('* as ctrl')} {t.k('from')} {t.s("'./product.controller.js'")};{'\n\n'}
      {t.k('const')} {t.f('router')} = {t.d('express')}.{t.f('Router')}();{'\n\n'}
      {t.c('// no asyncHandler — wrapping is automatic')}
      {'\n'}
      {t.f('router')}.{t.f('get')}({t.s("'/'")}, {t.f('ctrl')}.{t.f('list')});{'\n'}
      {t.f('router')}.{t.f('post')}({t.s("'/'")}, {t.f('ctrl')}.{t.f('create')});{'\n\n'}
      {t.k('export')} {t.k('default')} {t.f('router')};{'  '}
      {t.c('// auto-mounts at /product')}
    </code>
  ),
  controller: (
    <code>
      {t.k('import')} {t.d('* as service')} {t.k('from')} {t.s("'./product.service.js'")};{'\n\n'}
      {t.c('// plain async functions — that’s the whole contract')}
      {'\n'}
      {t.k('export')} {t.k('const')} {t.f('list')} = {t.k('async')} ({t.d('req')}, {t.d('res')}) {t.k('=>')}
      {'\n  '}
      {t.d('res')}.{t.f('json')}({t.k('await')} {t.f('service')}.{t.f('listProducts')}({t.d('req')}.{t.d('query')}));{'\n\n'}
      {t.k('export')} {t.k('const')} {t.f('create')} = {t.k('async')} ({t.d('req')}, {t.d('res')}) {t.k('=>')}
      {'\n  '}
      {t.d('res')}.{t.f('status')}({t.n('201')}).{t.f('json')}({t.k('await')} {t.f('service')}.{t.f('createProduct')}({t.d('req')}.{t.d('body')}));
    </code>
  ),
  service: (
    <code>
      {t.k('import')} {'{ '}{t.f('paginate')}, {t.f('paginatedResponse')}{' }'} {t.k('from')} {t.s("'@/utils/paginate.js'")};{'\n'}
      {t.k('import')} {'{ '}{t.f('Product')}{' }'} {t.k('from')} {t.s("'@/models/product.model.js'")};{'\n\n'}
      {t.k('export')} {t.k('const')} {t.f('listProducts')} = {t.k('async')} ({t.d('query')}) {t.k('=>')} {'{'}
      {'\n  '}
      {t.k('const')} {'{ '}{t.d('page')}, {t.d('limit')}, {t.d('skip')}{' }'} = {t.f('paginate')}({t.d('query')});
      {'\n  '}
      {t.k('const')} [{t.d('items')}, {t.d('total')}] = {t.k('await')} {t.d('Promise')}.{t.f('all')}([
      {'\n    '}
      {t.f('Product')}.{t.f('find')}().{t.f('skip')}({t.d('skip')}).{t.f('limit')}({t.d('limit')}),
      {'\n    '}
      {t.f('Product')}.{t.f('countDocuments')}(),
      {'\n  '}
      ]);
      {'\n  '}
      {t.k('return')} {t.f('paginatedResponse')}({t.d('items')}, {t.d('total')}, {t.d('page')}, {t.d('limit')});
      {'\n'}
      {'}'};
    </code>
  ),
  generate: (
    <code>
      {t.s('✓')} {t.d('src/models/product.model.ts')}
      {'\n'}
      {t.s('✓')} {t.d('src/modules/product/product.validation.ts')}
      {'\n'}
      {t.s('✓')} {t.d('src/modules/product/product.service.ts')}
      {'\n'}
      {t.s('✓')} {t.d('src/modules/product/product.controller.ts')}
      {'\n'}
      {t.s('✓')} {t.d('src/modules/product/product.routes.ts')}
      {'\n\n'}
      {t.p('→')} {t.d('mounted at')} {t.f('/product')}
      {'\n'}
      {t.c('# also: --dry-run to preview, --list to inspect')}
    </code>
  ),
};

export function CodeShowcase() {
  const [tab, setTab] = useState<TabKey>('routes');
  const active = tabs.find((t) => t.key === tab)!;

  return (
    <section className="relative border-t border-line py-24">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="What you ship"
          title="Real code, the way you'd write it"
          description="No framework lock-in or clever magic to fight — just clean Express modules, generated and ready to extend."
        />

        <div className="mt-12 terminal">
          <div className="flex items-center gap-1 border-b border-line bg-white/[0.015] px-3 py-2">
            {tabs.map((tb) => (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                className={cn(
                  'relative rounded-md px-3 py-1.5 font-mono text-[12.5px] transition-colors',
                  tab === tb.key ? 'text-emerald' : 'text-ink-faint hover:text-ink-muted',
                )}
              >
                {tab === tb.key && (
                  <motion.span
                    layoutId="showcase-tab"
                    className="absolute inset-0 rounded-md border border-emerald/30 bg-emerald/[0.08]"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">{tb.label}</span>
              </button>
            ))}
          </div>
          <div className="px-4 pt-2 font-mono text-[11px] text-ink-faint">{active.title}</div>
          <div className="relative min-h-[260px]">
            <AnimatePresence mode="wait">
              <motion.pre
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="overflow-x-auto p-5 font-mono text-[12.5px] leading-[1.7] text-ink-muted"
              >
                {snippets[tab]}
              </motion.pre>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
