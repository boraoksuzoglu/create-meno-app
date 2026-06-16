import { docsNav } from '@/lib/nav';
import { SITE_URL } from '@/lib/llms';

export const dynamic = 'force-static';

export function GET() {
  const pages = [
    { loc: SITE_URL, priority: '1.0', changefreq: 'weekly' },
    ...docsNav.map((item) => ({
      loc: `${SITE_URL}/docs/${item.slug}`,
      priority: '0.8',
      changefreq: 'weekly',
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (p) => `  <url>
    <loc>${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
