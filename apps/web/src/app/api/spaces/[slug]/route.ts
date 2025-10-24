import { NextResponse } from 'next/server';
import { spaces, tasks } from '../../../../server/mockDb';

export async function GET(_req: Request, ctx: { params: { slug: string } }) {
  const slug = ctx.params.slug;
  const space = spaces.find(s => s.slug === slug);
  if (!space) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  const spaceTasks = tasks.filter(t => t.spaceId === space.id);
  return NextResponse.json({ ...space, tasks: spaceTasks });
}
