import { NextResponse } from 'next/server';
import { tasks, logEvent } from '../../../../server/mockDb';

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const id = ctx.params.id;
  const body = await req.json().catch(() => ({}));
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  const before = tasks[idx];
  const updated = { ...before, ...body };
  tasks[idx] = updated;
  logEvent(updated.spaceId, 'task.updated', { id, changes: body });
  return NextResponse.json({ ok: true, data: updated });
}
