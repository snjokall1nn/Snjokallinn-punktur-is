import html from '../../content/ball/index.html?raw';
export function GET(request:Request){if(['sjut.is','www.sjut.is'].includes(new URL(request.url).hostname))return Response.redirect(new URL('/ball/6u-2026',request.url),308);return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex, nofollow, noarchive','Cache-Control':'no-store'}})}
