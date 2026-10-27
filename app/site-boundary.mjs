export function isSjut(request) {
  return ['sjut.is', 'www.sjut.is'].includes(new URL(request.url).hostname);
}
// The youth site may never dispatch photography pages or APIs.
export function siteBoundary(request) {
  if (!isSjut(request)) {
    const url = new URL(request.url);
    if (['snjokallinn.com','www.snjokallinn.com','snjokallinn.is'].includes(url.hostname) && /^\/sjut\/klubbar\/?$/.test(url.pathname)) return Response.redirect('https://sjut.is/admin', 302);
    return null;
  }
  let path;
  try { path = decodeURIComponent(new URL(request.url).pathname).replace(/\/+$/, '') || '/'; }
  catch { return new Response('Slóð fannst ekki.', {status: 404}); }
  const page = ['/', '/admin', '/admin/login', '/admin/logout', '/admin/ball', '/sjut', '/sjut/klubbar', '/ball', '/ball/6u-2026', '/6uball', '/Myndamissjon', '/throttheimar', '/hjalp'].includes(path);
  const assetOrClub = /^\/(sjut|6uball|klubbar)\//.test(path);
  const api = /^\/api\/(6uball|sjut-clubs|sjut-game)(\/|$)/.test(path);
  if (page || /^\/admin\/klubbar\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path) || assetOrClub || api) return null;
  return new Response('Síða fannst ekki á Sjút.', {status: 404, headers: {'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex'}});
}
export function adminNext(request) {
  const next = new URL(request.url).searchParams.get('next');
  const allowed = isSjut(request) ? ['/admin', '/admin/ball', '/sjut/klubbar'] : ['/admin', '/NewClient', '/admin/myndakeppnir', '/client', '/admin/hub'];
  return allowed.includes(next) || (isSjut(request)&&/^\/admin\/klubbar\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(next||'')) ? next : '/admin';
}
