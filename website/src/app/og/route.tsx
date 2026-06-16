import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0a0e14',
          backgroundImage:
            'radial-gradient(circle at 18% 12%, rgba(52,211,153,0.18), transparent 42%), radial-gradient(circle at 85% 80%, rgba(34,211,238,0.16), transparent 45%)',
          padding: 72,
          fontFamily: 'monospace',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 14,
              border: '1px solid #283546',
              background: '#0e131b',
              color: '#34d399',
              fontSize: 30,
            }}
          >
            {'>_'}
          </div>
          <div style={{ color: '#8b97a7', fontSize: 26 }}>create-meno-app</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ color: '#e6edf3', fontSize: 72, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
            Scaffold a full backend
          </div>
          <div style={{ display: 'flex', fontSize: 72, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
            <span style={{ color: '#34d399' }}>in seconds,</span>
            <span style={{ color: '#5b6675', marginLeft: 16 }}>not hours.</span>
          </div>
          <div style={{ color: '#8b97a7', fontSize: 30, marginTop: 26 }}>
            MongoDB · Express · Node.js · AI-friendly · docs that never drift
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              display: 'flex',
              color: '#34d399',
              fontSize: 26,
              border: '1px solid #1c2431',
              borderRadius: 12,
              padding: '14px 22px',
              background: '#0e131b',
            }}
          >
            $ npx create-meno-app my-api
          </div>
          <div style={{ color: '#5b6675', fontSize: 22, marginLeft: 'auto' }}>meno.borao.dev</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
