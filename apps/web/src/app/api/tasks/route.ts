import { NextResponse } from 'next/server';
import { nextId, tasks, logEvent } from '../../../server/mockDb';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { title, spaceId, assigneeId = null, dueAt = null } = body || {};
  if (!title || !spaceId) {
    return NextResponse.json({ ok: false, error: 'title and spaceId are required' }, { status: 400 });
  }
  const task = { id: nextId('t'), title, spaceId, status: 'todo' as const, assigneeId, dueAt };
  tasks.push(task);
  logEvent(spaceId, 'task.created', { id: task.id, title: task.title });
  return NextResponse.json({ ok: true, data: task });
}
