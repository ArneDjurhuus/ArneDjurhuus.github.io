import RealtimeEditor from '../../../../../components/RealtimeEditor';
import Link from 'next/link';
import { headers } from 'next/headers';

export default function NotePage({ params }: { params: { slug: string; ydocId: string } }) {
  const { slug, ydocId } = params;

  // Determine if we're on a subdomain (demo.localhost or *.domain)
  const hdrs = headers();
  const hostHeader = hdrs.get('host') || '';
  const host = hostHeader.split(':')[0];
  const parts = host.split('.');
  const isPlainLocal = host === 'localhost' || host === '127.0.0.1';
  let hasSubdomain = false;
  if (parts.length === 2 && parts[1] === 'localhost') hasSubdomain = true; // demo.localhost
  else if (parts.length >= 3) hasSubdomain = true; // foo.squadspace.me
  if (parts[0] === 'www' || isPlainLocal) hasSubdomain = false;
  const backHref = hasSubdomain ? '/notes' : `/spaces/${slug}/notes`;

  return (
    <main style={{ minHeight: '100vh', padding: 32, background: '#0b1220', color: 'white' }}>
  <Link href={backHref} style={{ color: '#4fd1c5' }}>&larr; Back to Notes</Link>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 16 }}>Realtime Note</h1>
      <p style={{ color: '#93a2b8' }}>Your edits sync live between browsers.</p>

      <div style={{ marginTop: 16 }}>
        <RealtimeEditor ydocId={ydocId} />
      </div>
    </main>
  );
}
