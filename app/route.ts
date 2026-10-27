import sjutHtml from '../content/sjut/index.html?raw';
import html from '../content/home-c.html?raw';
import {isOwner,readContent} from './cms';
import {renderEditorialHero} from './editorial-hero.mjs';
import {seoHead} from './seo.mjs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
  const url=new URL(request.url);
  if(['sjut.is','www.sjut.is'].includes(url.hostname))return new Response(sjutHtml.replaceAll('href="/sjut"','href="/"'),{headers:{'Content-Type':'text/html; charset=utf-8'}});
  const preview=url.searchParams.get('preview')==='1';
  if(preview&&!await isOwner(request))return Response.redirect(new URL('/admin/login',request.url),302);
  const content=(await readContent(preview?'draft':'published')).content;
  const last=request.headers.get('Cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith('snjokallinn_editorial_hero='))?.split('=')[1];
  const hero=renderEditorialHero(content,last);
  return new Response(html.replace('<!--editorial-hero-->',hero.html).replace('<!--seo-head-->',seoHead()),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Set-Cookie':`snjokallinn_editorial_hero=${hero.id}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`,...(preview?{'X-Robots-Tag':'noindex, nofollow'}:{})}});
}
