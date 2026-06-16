# create-meno-app — website

Marketing site + documentation for [create-meno-app](https://www.npmjs.com/package/create-meno-app),
deployed at **[meno.borao.dev](https://meno.borao.dev)**.

Built with Next.js 16 (App Router), React 19, Tailwind CSS v4, MDX (`next-mdx-remote` +
`rehype-pretty-code`) and Motion. Dark theme only.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Structure

- `src/app` — routes (landing `/`, docs `/docs/[slug]`, `og`, `llms.txt`, `llms-full.txt`, `sitemap.xml`, `robots.txt`)
- `src/content/docs` — documentation source (`.mdx` with `{ title, description }` frontmatter)
- `src/lib/nav.ts` — docs navigation (drives sidebar, sitemap and llms.txt)
- `src/lib/llms.ts` — llms.txt + per-page Markdown generation
- `src/components/landing` — landing sections (Hero terminal animation, interactive Config Builder, …)
- `src/components/docs` — docs UI (sidebar, TOC, MDX components, Copy-page menu)

## Add a docs page

1. Create `src/content/docs/<slug>.mdx` with `title` + `description` frontmatter.
2. Add it to the appropriate group in `src/lib/nav.ts`.

It's then automatically routed, added to the sidebar, sitemap, `llms.txt` and the per-page
Markdown / "Copy page" menu.

## Deploy

Vercel project with **root directory = `website/`**. Domain: `meno.borao.dev`.
