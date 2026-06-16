import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeSlug from 'rehype-slug';
import { getDocBySlug, getDocSlugs, getToc } from '@/lib/mdx';
import { docToMarkdown } from '@/lib/llms';
import { docsNav, getDocIndex } from '@/lib/nav';
import { mdxComponents } from '@/components/docs/MdxComponents';
import { TableOfContents } from '@/components/docs/TableOfContents';
import { CopyPageMenu } from '@/components/docs/CopyPageMenu';
import { ArrowIcon } from '@/components/layout/Icons';

export const dynamicParams = false;

const prettyCodeOptions = {
  theme: 'github-dark-default',
  keepBackground: false,
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getDocSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { meta } = getDocBySlug(slug);
    return {
      title: meta.title,
      description: meta.description,
      alternates: { canonical: `https://meno.borao.dev/docs/${slug}` },
      openGraph: { title: meta.title, description: meta.description, type: 'article' },
    };
  } catch {
    return {};
  }
}

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params;

  let doc;
  try {
    doc = getDocBySlug(slug);
  } catch {
    notFound();
  }

  const toc = getToc(doc.content);
  const markdown = docToMarkdown(slug);
  const index = getDocIndex(slug);
  const prev = index > 0 ? docsNav[index - 1] : null;
  const next = index >= 0 && index < docsNav.length - 1 ? docsNav[index + 1] : null;

  return (
    <div className="flex gap-10">
      <article className="min-w-0 max-w-3xl flex-1">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="font-mono text-xs uppercase tracking-[0.14em] text-emerald">
            {'//'} {doc.meta.title}
          </div>
          <CopyPageMenu slug={slug} markdown={markdown} />
        </div>
        <div className="mdx-prose">
          <h1>{doc.meta.title}</h1>
          <p className="!mt-3 text-lg !text-ink-muted">{doc.meta.description}</p>
          <hr className="!mt-6" />
          <MDXRemote
            source={doc.content}
            components={mdxComponents}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
                rehypePlugins: [rehypeSlug, [rehypePrettyCode, prettyCodeOptions]],
              },
            }}
          />
        </div>

        <nav className="mt-14 grid gap-3 border-t border-line pt-8 sm:grid-cols-2">
          {prev ? (
            <Link
              href={`/docs/${prev.slug}`}
              className="surface surface-hover group flex flex-col gap-1 p-4"
            >
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">← Previous</span>
              <span className="font-medium text-ink group-hover:text-emerald">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              href={`/docs/${next.slug}`}
              className="surface surface-hover group flex flex-col items-end gap-1 p-4 text-right sm:col-start-2"
            >
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">Next →</span>
              <span className="flex items-center gap-1.5 font-medium text-ink group-hover:text-emerald">
                {next.title}
                <ArrowIcon className="h-3.5 w-3.5" />
              </span>
            </Link>
          )}
        </nav>
      </article>

      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-52 shrink-0 overflow-y-auto py-2 xl:block">
        <TableOfContents items={toc} />
      </aside>
    </div>
  );
}
