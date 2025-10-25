import Link from 'next/link';

import { logEvent } from '../../../server/mockDb';
import { events } from '../../../server/mockDb';
import 'server-only';
import { revalidatePath } from 'next/cache';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getSpace(slug: string) {
  // Try new endpoint first
  try {
    const res = await fetch(`${API_URL}/spaces/${slug}`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      const space = json?.data ?? json; // accept wrapped or raw
      if (space?.id) {
        const trs = await fetch(`${API_URL}/tasks?spaceId=${space.id}`, { cache: 'no-store' });
        const tjson = await trs.json();
        const list = Array.isArray(tjson?.data) ? tjson.data : Array.isArray(tjson) ? tjson : [];
        return { ...space, tasks: list };
      }
    }
  } catch {}
  // Fallback: list all spaces and find by slug
  const listRes = await fetch(`${API_URL}/spaces`, { cache: 'no-store' });
  if (!listRes.ok) throw new Error(`API ${listRes.status}`);
  const listJson = await listRes.json();
  const spaces = Array.isArray(listJson) ? listJson : Array.isArray(listJson?.data) ? listJson.data : [];
  const space = spaces.find((s: any) => s.slug === slug);
  if (!space) throw new Error('Not found');
  const trs = await fetch(`${API_URL}/tasks?spaceId=${space.id}`, { cache: 'no-store' });
  const tjson = await trs.json();
  const tasks = Array.isArray(tjson?.data) ? tjson.data : Array.isArray(tjson) ? tjson : [];
  return { ...space, tasks };
}

function composeDigest(spaceId: string) {
  const last24h = Date.now() - 24 * 60 * 60 * 1000;
  const recent = events.filter(e => e.spaceId === spaceId && new Date(e.createdAt).getTime() >= last24h);
  if (!recent.length) return 'No notable activity in the last 24 hours.';
  const created = recent.filter(e => e.type === 'task.created').length;
  const updated = recent.filter(e => e.type === 'task.updated').length;
  return `In the last 24h: ${created} tasks created, ${updated} tasks updated.`;
}

export default async function SpacePage({ params }: { params: { slug: string } }) {
  let space: any = null;
  let error: string | null = null;
  try {
    space = await getSpace(params.slug);
  } catch (e: any) {
    error = e.message;
  }

  if (error) {
    return (
      <main style={{ minHeight: '100vh', padding: 32, background: '#0b1220', color: 'white' }}>
        <Link href="/" style={{ color: '#4fd1c5' }}>&larr; Back</Link>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 16 }}>Failed to load space</h1>
        <p style={{ color: '#ef4444' }}>{error}</p>
      </main>
    );
  }

  const todo = space.tasks.filter((t: any) => t.status === 'todo');
  const inProgress = space.tasks.filter((t: any) => t.status === 'in_progress');
  const done = space.tasks.filter((t: any) => t.status === 'done');

  return (
    <main style={{ minHeight: '100vh', padding: 32, background: '#0b1220', color: 'white' }}>
      <Link href="/" style={{ color: '#4fd1c5' }}>&larr; Spaces</Link>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginTop: 16 }}>{space.name}</h1>

      <form action={async (formData: FormData) => {
        'use server';
        const title = String(formData.get('title') || '').trim();
        const description = String(formData.get('description') || '').trim();
        const dueAt = String(formData.get('dueAt') || '').trim();
        if (!title) return;
        const res = await fetch(`${API_URL}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, spaceId: space.id, description: description || undefined, dueAt: dueAt || undefined }),
        });
        const created = await res.json();
        const id = created?.data?.id || 't?';
        logEvent(space.id, 'task.created', { id, title });
        revalidatePath(`/spaces/${space.slug}`);
      }} style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <input name="title" placeholder="Title" style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #1f2a44', background: '#0f172a', color: 'white' }} />
        <input name="dueAt" type="date" placeholder="Due date" style={{ padding: 10, borderRadius: 8, border: '1px solid #1f2a44', background: '#0f172a', color: 'white' }} />
        <button type="submit" style={{ padding: '10px 14px', borderRadius: 8, background: '#4fd1c5', color: '#0b1220', fontWeight: 700, border: 'none' }}>Add</button>
        <div style={{ flexBasis: '100%' }} />
        <textarea name="description" placeholder="What is this task about?" rows={2} style={{ width: '100%', marginTop: 8, padding: 10, borderRadius: 8, border: '1px solid #1f2a44', background: '#0f172a', color: 'white' }} />
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24 }}>
        {[{title:'Todo',data:todo,status:'todo'},{title:'In Progress',data:inProgress,status:'in_progress'},{title:'Done',data:done,status:'done'}].map((col:any) => (
          <section key={col.title} style={{ background: '#121a2b', border: '1px solid #1f2a44', borderRadius: 12, padding: 16 }}>
            <h2 style={{ marginTop: 0 }}>{col.title}</h2>
            <div style={{ display: 'grid', gap: 8 }}>
              {col.data.map((t:any) => (
                <form key={t.id} action={async (formData: FormData) => {
                  'use server';
                  const target = String(formData.get('target') || '');
                  const validTargets = ['todo','in_progress','done'];
                  if (!validTargets.includes(target)) return;
                  await fetch(`${API_URL}/tasks/${t.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: target }),
                  });
                  logEvent(space.id, 'task.updated', { id: t.id, status: target });
                  revalidatePath(`/spaces/${space.slug}`);
                }}>
                  <div style={{ background: '#0f172a', border: '1px solid #1f2a44', borderRadius: 10, padding: 12 }}>
                    <div style={{ fontWeight: 700 }}>{t.title}</div>
                    <div style={{ opacity: 0.7, fontSize: 12, marginTop: 6 }}>#{t.id}</div>
                    {t.description ? (
                      <div style={{ marginTop: 8, fontSize: 14, color: '#cbd5e1' }}>{t.description}</div>
                    ) : null}
                    {t.dueAt ? (
                      <div style={{ marginTop: 6, fontSize: 12, color: '#fde68a' }}>Due: {new Date(t.dueAt).toLocaleDateString()}</div>
                    ) : null}
                    <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, opacity: 0.8 }}>Move to:</span>
                      {[
                        { key: 'todo', label: 'Todo' },
                        { key: 'in_progress', label: 'In Progress' },
                        { key: 'done', label: 'Done' },
                      ]
                        .filter(opt => opt.key !== t.status)
                        .map(opt => (
                          <button
                            key={opt.key}
                            name="target"
                            value={opt.key}
                            type="submit"
                            style={{ padding: '6px 10px', borderRadius: 6, background: '#334155', color: 'white', border: 'none' }}
                          >
                            {opt.label}
                          </button>
                        ))}
                    </div>
                  </div>
                </form>
              ))}
            </div>
          </section>
        ))}
      </div>

      <form action={async () => {
        'use server';
        // Log a digest request event and refresh the page
        logEvent(space.id, 'digest.requested', {});
        revalidatePath(`/spaces/${space.slug}`);
      }} style={{ marginTop: 24 }}>
        <button type="submit" style={{ padding: '10px 14px', borderRadius: 8, background: '#22c55e', color: '#0b1220', fontWeight: 700, border: 'none' }}>Run Digest</button>
      </form>

      <div style={{ marginTop: 12, fontSize: 14, color: '#cbd5e1' }}>
        <strong style={{ color: 'white' }}>Latest Digest:</strong>
        <p style={{ marginTop: 6 }}>{composeDigest(space.id)}</p>
      </div>
    </main>
  );
}
