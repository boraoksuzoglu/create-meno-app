'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  align?: 'center' | 'left';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn('max-w-2xl', align === 'center' ? 'mx-auto text-center' : 'text-left')}
    >
      <div className={cn('mb-4', align === 'center' && 'flex justify-center')}>
        <span className="eyebrow">
          <span className="text-emerald">{'//'}</span> {eyebrow}
        </span>
      </div>
      <h2 className="text-3xl font-bold tracking-tight sm:text-[2.6rem] sm:leading-[1.1]">{title}</h2>
      {description && <p className="mt-4 text-[17px] leading-relaxed text-ink-muted">{description}</p>}
    </motion.div>
  );
}
