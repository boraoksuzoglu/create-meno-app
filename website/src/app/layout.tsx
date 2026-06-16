import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

const SITE_URL = 'https://meno.borao.dev';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'create-meno-app — MongoDB · Express · Node.js backend generator',
    template: '%s | create-meno-app',
  },
  description:
    'Scaffold a production-ready MongoDB · Express · Node.js backend in seconds. AI-friendly architecture, an auto Markdown docs generator that never drifts, zero-boilerplate route loading, and a fully configurable feature matrix.',
  keywords: [
    'create-meno-app',
    'meno',
    'MongoDB Express Node boilerplate',
    'backend generator',
    'express scaffolder',
    'node.js api generator',
    'typescript backend boilerplate',
    'auto generated api docs',
    'AI friendly backend',
    'mern backend',
  ],
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'create-meno-app',
    description:
      'Production-ready MongoDB · Express · Node.js backend generator. AI-friendly, with auto-generated docs that never drift.',
    url: SITE_URL,
    siteName: 'create-meno-app',
    type: 'website',
    images: [{ url: '/og', width: 1200, height: 630, alt: 'create-meno-app' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'create-meno-app',
    description:
      'Scaffold a full MongoDB · Express · Node.js backend in seconds. AI-friendly, docs that never drift.',
    images: ['/og'],
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', type: 'image/png', sizes: '32x32', media: '(prefers-color-scheme: light)' },
      { url: '/favicon-16.png', type: 'image/png', sizes: '16x16', media: '(prefers-color-scheme: light)' },
      { url: '/favicon-32-dark.png', type: 'image/png', sizes: '32x32', media: '(prefers-color-scheme: dark)' },
      { url: '/favicon-16-dark.png', type: 'image/png', sizes: '16x16', media: '(prefers-color-scheme: dark)' },
    ],
    apple: [{ url: '/favicon-192.png', sizes: '192x192' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  if (typeof navigator === 'undefined' || !navigator.modelContext) return;
  var ac = new AbortController();
  navigator.modelContext.registerTool({
    name: 'navigate_docs',
    description: 'Navigate to a create-meno-app documentation page',
    inputSchema: {
      type: 'object',
      properties: { slug: { type: 'string', description: 'Doc page slug' } },
      required: ['slug']
    },
    execute: function(input) {
      window.location.href = '/docs/' + input.slug;
      return { success: true, url: '/docs/' + input.slug };
    },
    signal: ac.signal
  });
  navigator.modelContext.registerTool({
    name: 'get_llms_txt',
    description: 'Fetch the llms.txt index for create-meno-app documentation',
    inputSchema: { type: 'object', properties: {} },
    execute: async function() {
      var res = await fetch('/llms-full.txt');
      var text = await res.text();
      return { content: text };
    },
    signal: ac.signal
  });
})();
            `,
          }}
        />
      </body>
    </html>
  );
}
