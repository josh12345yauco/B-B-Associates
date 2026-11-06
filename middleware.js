/* Vercel Routing Middleware — strips the leftover ?id= from old JS-era URLs.
   GSC (Nov 6 2026) still had 30 /portfolio/project/?id=… and 24 /blog/article/?id=… URLs indexed.
   The vercel.json redirects send them to the clean page but keep the query string
   (/portfolio/kohl-kitchen/?id=kohl-kitchen), so Google keeps seeing a parameter URL.
   This sends any such request straight to the clean, canonical URL with a 308. */
export const config = {
  matcher: ['/blog/:path*', '/portfolio/:path*', '/service-areas/:path*'],
};

export default function middleware(request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id || !/^[a-z0-9-]+$/.test(id)) return;

  const p = url.pathname;
  let dest = null;
  if (/^\/blog\/article(\.html|\/|\/index\.html)?$/.test(p) || /^\/service-areas\/article\/?$/.test(p)) {
    dest = `/blog/${id}/`;
  } else if (/^\/portfolio\/project(\.html|\/|\/index\.html)?$/.test(p)) {
    dest = `/portfolio/${id}/`;
  } else if (/^\/(blog|portfolio)\/[a-z0-9-]+\/$/.test(p)) {
    dest = p; // already on the clean page, just drop the parameter
  }
  if (!dest) return;

  url.pathname = dest;
  url.searchParams.delete('id');
  return Response.redirect(url.toString(), 308);
}
