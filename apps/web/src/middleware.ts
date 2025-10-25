import { NextResponse, NextRequest } from 'next/server';

// Subdomain routing:
// - demo.localhost:3000 -> /spaces/demo
// - demo.localhost:3000/todo -> /spaces/demo/todo
// - foo.squadspace.me/* -> /spaces/foo/*
export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostHeader = req.headers.get('host') || '';
  const hostNoPort = hostHeader.split(':')[0];
  const parts = hostNoPort.split('.');

  const isLocalRoot = hostNoPort === 'localhost' || hostNoPort === '127.0.0.1';

  // Identify subdomain in two dev forms (*.localhost) or any 3+ part domain (e.g., *.squadspace.me)
  let spaceSlug: string | null = null;
  if (parts.length === 2 && parts[1] === 'localhost') {
    // demo.localhost
    spaceSlug = parts[0];
  } else if (parts.length >= 3) {
    // foo.squadspace.me, bar.dev.internal, etc.
    spaceSlug = parts[0];
  }

  // Redirect www to apex for non-local hosts
  if (parts[0] === 'www' && parts.length >= 3 && !isLocalRoot) {
    const apex = parts.slice(1).join('.');
    const redirectUrl = new URL(url.toString());
    redirectUrl.hostname = apex;
    return NextResponse.redirect(redirectUrl);
  }

  if (!spaceSlug || spaceSlug === 'www' || isLocalRoot) {
    return NextResponse.next();
  }

  // Preserve subpaths and avoid double-prefixing when path already includes /spaces/:slug
  const path = url.pathname;
  if (path === '/') {
    url.pathname = `/spaces/${spaceSlug}`;
    return NextResponse.rewrite(url);
  }
  // If user navigates to path-based URL on subdomain, redirect to clean path
  if (path.startsWith(`/spaces/${spaceSlug}`)) {
    const remainder = path.slice(`/spaces/${spaceSlug}`.length) || '/';
    url.pathname = remainder === '' ? '/' : remainder;
    return NextResponse.redirect(url);
  }
  // Otherwise, prefix with the slug namespace
  url.pathname = `/spaces/${spaceSlug}${path}`;
  return NextResponse.rewrite(url);
}

// Match all paths except Next internals, assets, and files with extensions
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets|.*\\..*).*)'],
};
