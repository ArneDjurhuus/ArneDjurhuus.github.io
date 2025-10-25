import Image from 'next/image';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getSpaces() {
  const res = await fetch(`${API_URL}/spaces`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const json = await res.json();
  // Accept either raw array or { ok, data } wrapper for backward compatibility
  if (Array.isArray(json)) return json;
  if (json?.ok && Array.isArray(json.data)) return json.data;
  throw new Error(json?.error || 'Failed to load');
}

export default async function Home() {
  let spaces: any[] = [];
  let error = null;
  try {
    spaces = await getSpaces();
  } catch (e: any) {
    error = e.message;
  }

  return (
    <main style={{ minHeight: '100vh', padding: 32, background: '#0b1220', color: 'white' }}>
      <Image
        src="/SquadSpace logo-transparent.png"
        alt="SquadSpace Logo"
        width={200}
        height={50}
        priority
      />
      <h1 style={{ fontSize: 36, fontWeight: 800, marginTop: 24 }}>Spaces</h1>
      {error ? (
        <div style={{ marginTop: 16, color: '#ef4444' }}>
          <p>Could not load spaces: {error}</p>
          <p>Is the API container up? Try refreshing in a few seconds.</p>
        </div>
      ) : (
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {spaces.map((space: any) => {
            return (
              <Link key={space.id} href={`/spaces/${space.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{ padding: 16, border: '1px solid #1f2a44', background: '#121a2b', borderRadius: 12, boxShadow: '0 6px 20px rgba(0,0,0,0.35)' }}>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: '#4fd1c5', margin: 0 }}>{space.name}</h2>
                  <p style={{ color: '#93a2b8', marginTop: 6, marginBottom: 0 }}>/{space.slug}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
