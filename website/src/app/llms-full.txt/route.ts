import { buildLlmsFull } from '@/lib/llms';

export const dynamic = 'force-static';

export function GET() {
  return new Response(buildLlmsFull(), {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
