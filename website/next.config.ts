import path from 'path';
import type { NextConfig } from 'next';

// NOTE: docs are rendered at request/render time via `next-mdx-remote/rsc`
// (see src/app/docs/[slug]/page.tsx), so we do NOT use @next/mdx's build-time
// loader — which avoids Turbopack's non-serializable-options error for the
// rehype/remark plugin functions.
const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../'),
  async headers() {
    return [
      {
        source: '/',
        headers: [
          {
            key: 'Link',
            value: [
              '</llms.txt>; rel="describedby"; type="text/plain"',
              '</sitemap.xml>; rel="sitemap"; type="application/xml"',
            ].join(', '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
