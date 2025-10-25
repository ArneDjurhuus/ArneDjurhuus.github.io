import Link from 'next/link';
import { headers } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getNotes(slug: string) {
  const res = await fetch(`${API_URL}/spaces/${slug}/notes`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load notes');
  const json = await res.json();
  return json?.data ?? json;
}

export default async function NotesIndexPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
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

      {error ? (
        <div style={{ color: '#ef4444', marginTop: 16 }}>{error}</div>
      ) : (
        <ul style={{ marginTop: 16, listStyle: 'none', padding: 0, display: 'grid', gap: 12 }}>
          {notes.length === 0 && (
            <li style={{ color: '#93a2b8' }}>No notes yet.</li>
          )}
          {notes.map((n: any) => (
            <li key={n.id}>
              <Link href={toNoteHref(n.ydocId)} style={{
                display: 'block',
                padding: 12,
                border: '1px solid #1f2a44',
                background: '#121a2b',
                borderRadius: 10,
                textDecoration: 'none',
                color: '#e2e8f0',
              }}>
                <div style={{ fontWeight: 700 }}>{n.title}</div>
                <div style={{ fontSize: 12, color: '#93a2b8', marginTop: 4 }}>ydoc: {n.ydocId}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
