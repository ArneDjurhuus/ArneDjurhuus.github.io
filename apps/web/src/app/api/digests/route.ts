import { NextResponse } from 'next/server';
import { events } from '../../../server/mockDb';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { spaceId } = body || {};
  if (!spaceId) return NextResponse.json({ ok: false, error: 'spaceId required' }, { status: 400 });
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const recent = events.filter((e) => e.spaceId === spaceId && new Date(e.createdAt).getTime() >= since);
  const lines = recent.map((e) => `- ${e.type}: ${JSON.stringify(e.payload)}`);
  const summary = lines.length ? `Last 24h changes:\n${lines.join('\n')}` : 'No recent changes.';
  return NextResponse.json({ ok: true, data: { id: `d-${Date.now()}`, summary } });
}
