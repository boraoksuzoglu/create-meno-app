import { getDocBySlug } from './mdx';
import { docsNav } from './nav';

export const SITE_URL = 'https://meno.borao.dev';
export const GITHUB_URL = 'https://github.com/boraoksuzoglu/create-meno-app';
export const NPM_URL = 'https://www.npmjs.com/package/create-meno-app';

/**
 * Convert known content-bearing MDX components into plain Markdown before the
 * generic JSX stripper runs — so attribute data (e.g. an Endpoint's method and
 * path) survives into the AI/Markdown output instead of being dropped.
 */
export function inlineComponentsToMarkdown(content: string): string {
  return content.replace(
    /<Endpoint\s+method=["']([^"']+)["']\s+path=["']([^"']+)["']\s*\/>/g,
    (_m, method: string, path: string) => `- \`${method} ${path}\``,
  );
}

/**
 * Strip JSX component usages from MDX (but never code fences).
 * Removes import statements and PascalCase JSX tags, single- and multi-line.
 * Self-closing components are dropped; paired components keep their children.
 */
export function stripJsx(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let inFence = false;
  let inJsxBlock = false;

  for (const line of lines) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      result.push(line);
      continue;
    }
    if (inFence) {
      result.push(line);
      continue;
    }
    if (inJsxBlock) {
      if (/\/?>\s*$/.test(line)) inJsxBlock = false;
      continue;
    }
    if (/^import\s+.+from\s+['"]/.test(line)) continue;

    // closing tag of a paired component on its own line
    if (/^<\/[A-Z]/.test(line.trim())) continue;

    if (/^\s*<[A-Z]/.test(line)) {
      const trimmed = line.trimEnd();
      if (/\/>$/.test(trimmed) || /^<[A-Z][^>]*>.*<\/[A-Z][\w]*>$/.test(line.trim())) {
        // self-closing or full inline element — drop the wrapper line
        continue;
      }
      if (/>$/.test(trimmed)) {
        // opening tag of a paired block — drop the tag, keep children
        continue;
      }
      inJsxBlock = true;
      continue;
    }

    result.push(line);
  }

  return result.join('\n');
}

/** Render a single doc page as clean Markdown for AI ingestion / "Copy page". */
export function docToMarkdown(slug: string): string {
  const { meta, content } = getDocBySlug(slug);
  const body = stripJsx(inlineComponentsToMarkdown(content)).trim();
  return `# ${meta.title}\n\n> ${meta.description}\n\nSource: ${SITE_URL}/docs/${slug}\n\n${body}\n`;
}

/** Short llms.txt index: links to every page + the full dump. */
export function buildLlmsIndex(): string {
  const lines: string[] = [];
  lines.push('# create-meno-app');
  lines.push('');
  lines.push(
    '> Production-ready MongoDB · Express · Node.js backend generator. AI-friendly architecture, an auto Markdown docs generator that never drifts, zero-boilerplate route loading and a fully configurable feature matrix.',
  );
  lines.push('');
  lines.push(`- npm: ${NPM_URL}`);
  lines.push(`- GitHub: ${GITHUB_URL}`);
  lines.push(`- Full docs (single file): ${SITE_URL}/llms-full.txt`);
  lines.push('');
  lines.push('## Documentation');
  lines.push('');
  for (const item of docsNav) {
    lines.push(`- [${item.title}](${SITE_URL}/docs/${item.slug}): ${item.description}`);
  }
  lines.push('');
  return lines.join('\n');
}

/** Full concatenated docs in nav order. */
export function buildLlmsFull(): string {
  const sections: string[] = [];
  sections.push('# create-meno-app — Complete Documentation');
  sections.push(`Source: ${SITE_URL} | npm: create-meno-app | GitHub: ${GITHUB_URL}`);

  for (const item of docsNav) {
    const { content } = getDocBySlug(item.slug);
    const cleaned = stripJsx(inlineComponentsToMarkdown(content)).trim();
    sections.push(`\n---\n\n# ${item.title}\n\n${cleaned}`);
  }

  return sections.join('\n') + '\n';
}
