import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getNotes(slug: string) {
  const res = await fetch(`${API_URL}/spaces/${slug}/notes`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load notes');
  const json = await res.json();
  return json?.data ?? json;
}

export default async function NotesIndexPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  async function createNoteAction(formData: FormData) {
    'use server';
    const title = String(formData.get('title') || '').trim();
    const res = await fetch(`${API_URL}/spaces/${slug}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to create note');
    const json = await res.json();
    const note = json?.data ?? json;
    // Build redirect href subdomain-aware
    const hdrs = headers();
    const hostHeader = hdrs.get('host') || '';
    const host = hostHeader.split(':')[0];
    const parts = host.split('.');
    const isPlainLocal = host === 'localhost' || host === '127.0.0.1';
    let hasSubdomain = false;
    if (parts.length === 2 && parts[1] === 'localhost') hasSubdomain = true;
    else if (parts.length >= 3) hasSubdomain = true;
    if (parts[0] === 'www' || isPlainLocal) hasSubdomain = false;
    const toHref = hasSubdomain ? `/notes/${note.ydocId}` : `/spaces/${slug}/notes/${note.ydocId}`;
    redirect(toHref);
  }

  async function renameNoteAction(formData: FormData) {
    'use server';
    const id = String(formData.get('id') || '');
    const title = String(formData.get('title') || '').trim();
    if (!id || !title) return;
    const res = await fetch(`${API_URL}/spaces/${slug}/notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to rename note');
  }

  async function deleteNoteAction(formData: FormData) {
    'use server';
    const id = String(formData.get('id') || '');
    if (!id) return;
    const res = await fetch(`${API_URL}/spaces/${slug}/notes/${id}`, {
      method: 'DELETE',
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to delete note');
  }
  let notes: any[] = [];
  let error: string | null = null;
  try {
    notes = await getNotes(slug);
  } catch (e: any) {
    error = e.message;
  }

  const hdrs = headers();
  const hostHeader = hdrs.get('host') || '';
  const host = hostHeader.split(':')[0];
  const parts = host.split('.');
  const isPlainLocal = host === 'localhost' || host === '127.0.0.1';
  let hasSubdomain = false;
  if (parts.length === 2 && parts[1] === 'localhost') hasSubdomain = true; // demo.localhost
  else if (parts.length >= 3) hasSubdomain = true; // foo.squadspace.me
  if (parts[0] === 'www' || isPlainLocal) hasSubdomain = false;

  const toNoteHref = (ydocId: string) => (hasSubdomain ? `/notes/${ydocId}` : `/spaces/${slug}/notes/${ydocId}`);
  const backHref = hasSubdomain ? '/' : `/spaces/${slug}`;

  return (
    <main style={{ minHeight: '100vh', padding: 32, background: '#0b1220', color: 'white' }}>
      <Link href={backHref} style={{ color: '#4fd1c5' }}>&larr; Dashboard</Link>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 16 }}>Notes</h1>
      <p style={{ color: '#93a2b8' }}>Choose a note to open the realtime editor.</p>

      <form action={createNoteAction} style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <input name="title" placeholder="New note title (optional)" style={{
          flex: 1,
          padding: '8px 10px',
          borderRadius: 8,
          border: '1px solid #1f2a44',
          background: '#0f172a',
          color: '#e2e8f0',
          outline: 'none',
        }} />
        <button type="submit" style={{
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid #1f2a44',
          background: '#121a2b',
          color: '#4fd1c5',
          fontWeight: 700,
          cursor: 'pointer',
        }}>New note</button>
      </form>

      {error ? (
        <div style={{ color: '#ef4444', marginTop: 16 }}>{error}</div>
      ) : (
        <ul style={{ marginTop: 16, listStyle: 'none', padding: 0, display: 'grid', gap: 12 }}>
          {notes.length === 0 && (
            <li style={{ color: '#93a2b8' }}>No notes yet.</li>
          )}
          {notes.map((n: any) => (
            <li key={n.id} style={{
              padding: 12,
              border: '1px solid #1f2a44',
              background: '#121a2b',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link href={toNoteHref(n.ydocId)} style={{
                  textDecoration: 'none',
                  color: '#e2e8f0',
                  display: 'block',
                }}>
                  <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: '#93a2b8', marginTop: 4 }}>ydoc: {n.ydocId}</div>
                </Link>
              </div>
              <form action={renameNoteAction} style={{ display: 'flex', gap: 8 }}>
                <input type="hidden" name="id" value={n.id} />
                <input
                  name="title"
                  defaultValue={n.title}
                  placeholder="Rename note"
                  style={{
                    padding: '6px 8px',
                    borderRadius: 8,
                    border: '1px solid #1f2a44',
                    background: '#0f172a',
                    color: '#e2e8f0',
                    outline: 'none',
                    width: 200,
                  }}
                />
                <button type="submit" style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: '1px solid #1f2a44',
                  background: '#0b172b',
                  color: '#a3e635',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}>Rename</button>
              </form>
              <form action={deleteNoteAction}>
                <input type="hidden" name="id" value={n.id} />
                <button type="submit" style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: '1px solid #1f2a44',
                  background: '#2a0f16',
                  color: '#ef4444',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}>Delete</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
