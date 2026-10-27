import html from '../../../content/ball/index.html?raw';
export function GET(){return new Response(html.replace('<header>', '<a href="/sjut" style="display:block;padding:12px 18px;color:inherit;font-weight:700">Heim á SJÚT</a><header>'),{headers:{'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex, nofollow, noarchive','Cache-Control':'no-store'}})}
