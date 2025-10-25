import Link from 'next/link';
import { headers } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getSpace(slug: string) {
  const res = await fetch(`${API_URL}/spaces/${slug}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Not found');
  const json = await res.json();
  return json?.data ?? json;
}

export default async function SpaceDashboardPage({ params }: { params: { slug: string } }) {
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
        <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 16, textAlign: 'center' }}>Failed to load space</h1>
        <p style={{ color: '#ef4444' }}>{error}</p>
      </main>
    );
  }

  // Decide link style based on host: use clean '/todo' on subdomains, fallback to path-based in localhost
  const hdrs = headers();
  const hostHeader = hdrs.get('host') || '';
  const host = hostHeader.split(':')[0];
  const parts = host.split('.');
  const isPlainLocal = host === 'localhost' || host === '127.0.0.1';
  let hasSubdomain = false;
  if (parts.length === 2 && parts[1] === 'localhost') {
    // demo.localhost
    hasSubdomain = true;
  } else if (parts.length >= 3) {
    // e.g., foo.squadspace.me
    hasSubdomain = true;
  }
  if (parts[0] === 'www') {
    hasSubdomain = false;
  }
  if (isPlainLocal) {
    hasSubdomain = false;
  }
  const todoHref = hasSubdomain ? '/todo' : `/spaces/${space.slug}/todo`;
  const notesHref = hasSubdomain ? `/notes` : `/spaces/${space.slug}/notes`;

  return (
    <main style={{ minHeight: '100vh', padding: 32, background: '#0b1220', color: 'white' }}>
  {/* Headliner */}
  <h1 style={{ fontSize: 40, fontWeight: 800, marginTop: 8, textAlign: 'center', letterSpacing: 0.2 }}>{space.name}</h1>
      <div style={{ marginTop: 6, textAlign: 'center', color: '#93a2b8', fontSize: 16 }}>Dashboard</div>

      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        <Link href={todoHref} style={{ textDecoration: 'none' }}>
          <div style={{ padding: 16, border: '1px solid #1f2a44', background: '#121a2b', borderRadius: 12, boxShadow: '0 6px 20px rgba(0,0,0,0.35)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#4fd1c5', margin: 0 }}>To‑Do</h2>
            <p style={{ color: '#93a2b8', marginTop: 6, marginBottom: 0 }}>Capture tasks and track progress</p>
          </div>
        </Link>
        <Link href={notesHref} style={{ textDecoration: 'none' }}>
          <div style={{ padding: 16, border: '1px solid #1f2a44', background: '#121a2b', borderRadius: 12, boxShadow: '0 6px 20px rgba(0,0,0,0.35)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#4fd1c5', margin: 0 }}>Notes</h2>
            <p style={{ color: '#93a2b8', marginTop: 6, marginBottom: 0 }}>Realtime collaborative editor</p>
          </div>
        </Link>
      </div>
    </main>
  );
}
