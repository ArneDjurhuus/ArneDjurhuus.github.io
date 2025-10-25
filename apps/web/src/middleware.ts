import { NextResponse, NextRequest } from 'next/server';

// Basic subdomain routing: demo.localhost:3000 -> /spaces/demo
export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostHeader = req.headers.get('host') || '';
  const host = hostHeader.split(':')[0]; // strip port
  const [sub, domain, ...rest] = host.split('.');

  const isLocalhost = host === 'localhost' || host === '127.0.0.1';

  // Only rewrite the root path for subdomains, leave other paths untouched
  if (url.pathname === '/' && !isLocalhost) {
    // Handle *.squadspace.me and other multi-part hosts
    const parts = host.split('.');
    if (parts.length >= 3) {
      const spaceSlug = parts[0];
      if (spaceSlug && spaceSlug !== 'www') {
        url.pathname = `/spaces/${spaceSlug}`;
        return NextResponse.rewrite(url);
      }
    }
    // Handle demo.localhost as well (two parts only)
    if (parts.length === 2 && parts[1] === 'localhost') {
      const spaceSlug = parts[0];
      if (spaceSlug && spaceSlug !== 'www') {
        url.pathname = `/spaces/${spaceSlug}`;
        return NextResponse.rewrite(url);
      }
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
