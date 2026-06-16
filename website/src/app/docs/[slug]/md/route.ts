import { getDocSlugs } from '@/lib/mdx';
import { docToMarkdown } from '@/lib/llms';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return getDocSlugs().map((slug) => ({ slug }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const md = docToMarkdown(slug);
    return new Response(md, {
      status: 200,
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
