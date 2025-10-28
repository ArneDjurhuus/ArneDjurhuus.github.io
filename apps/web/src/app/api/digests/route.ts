import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { spaceId } = body || {};
  if (!spaceId) return NextResponse.json({ ok: false, error: 'spaceId required' }, { status: 400 });

  // Proxy to API service (runs server-side)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const res = await fetch(`${apiUrl}/digests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ spaceId }),
    cache: 'no-store',
  }).catch((e) => ({ ok: false, status: 500, json: async () => ({ ok: false, error: e?.message || 'Network error' }) } as any));

  // Normalize to JSON regardless of upstream behavior
  try {
    const ct = (res as any).headers?.get?.('content-type') || '';
    const status = (res as any).status || 500;
    const text = await (res as any).text?.();
    if (typeof text === 'string') {
      try {
        const json = JSON.parse(text);
        return NextResponse.json(json, { status });
      } catch {
        return NextResponse.json({ ok: false, error: `Upstream non-JSON (${status})` }, { status });
      }
    }
  } catch {
    // fallthrough
  }
  return NextResponse.json({ ok: false, error: 'Upstream error' }, { status: 502 });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const spaceId = url.searchParams.get('spaceId') || '';
  if (!spaceId) return NextResponse.json({ ok: false, error: 'spaceId required' }, { status: 400 });
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const res = await fetch(`${apiUrl}/digests/latest?spaceId=${encodeURIComponent(spaceId)}`, {
    method: 'GET',
    cache: 'no-store',
  }).catch((e) => ({ ok: false, status: 500, json: async () => ({ ok: false, error: e?.message || 'Network error' }) } as any));
  try {
    const ct = (res as any).headers?.get?.('content-type') || '';
    const status = (res as any).status || 500;
    const text = await (res as any).text?.();
    if (typeof text === 'string') {
      try {
        const json = JSON.parse(text);
        return NextResponse.json(json, { status });
      } catch {
        return NextResponse.json({ ok: false, error: `Upstream non-JSON (${status})` }, { status });
      }
    }
  } catch {
    // fallthrough
  }
  return NextResponse.json({ ok: false, error: 'Upstream error' }, { status: 502 });
}
