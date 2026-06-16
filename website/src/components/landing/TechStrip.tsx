const stack = [
  'Express 5',
  'Mongoose 9',
  'Node 18+',
  'TypeScript 6',
  'Joi',
  'Helmet',
  'Winston',
  'Jest',
  'Swagger',
  'Docker',
  'bcrypt',
  'Redis',
];

export function TechStrip() {
  return (
    <section className="relative overflow-hidden border-y border-line bg-void/60 py-5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-base to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-base to-transparent" />
      <div className="flex w-max animate-marquee items-center gap-10">
        {[...stack, ...stack].map((item, i) => (
          <span key={i} className="flex items-center gap-10 font-mono text-sm text-ink-faint">
            <span className="whitespace-nowrap transition-colors hover:text-ink-muted">{item}</span>
            <span className="text-line-bright">·</span>
          </span>
        ))}
      </div>
    </section>
  );
}
