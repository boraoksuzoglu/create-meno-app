import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDir = path.join(process.cwd(), 'src/content/docs');

export interface DocMeta {
  title: string;
  description: string;
}

export function getDocSlugs(): string[] {
  return fs
    .readdirSync(contentDir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, ''));
}

export function getDocBySlug(slug: string): { meta: DocMeta; content: string } {
  const filePath = path.join(contentDir, `${slug}.mdx`);
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  return { meta: data as DocMeta, content };
}

export interface TocItem {
  depth: number;
  text: string;
  id: string;
}

/** Slugify the same way rehype-slug (github-slugger) does for stable anchors. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

/** Extract H2/H3 headings from raw MDX (skips code fences). */
export function getToc(content: string): TocItem[] {
  const items: TocItem[] = [];
  let inFence = false;
  for (const line of content.split('\n')) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = /^(#{2,3})\s+(.*)$/.exec(line);
    if (match) {
      const text = match[2].replace(/`/g, '').trim();
      items.push({ depth: match[1].length, text, id: slugify(text) });
    }
  }
  return items;
}
