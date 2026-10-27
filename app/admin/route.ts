import sjutHtml from '../../content/sjut/dashboard.html?raw';
import {isSjut} from '../site-boundary.mjs';
import html from '../../content/admin.html?raw';
import { isOwner } from '../cms';
export const dynamic='force-dynamic';
export async function GET(request:Request) {
  if (!await isOwner(request)) return Response.redirect(new URL('/admin/login',request.url),302);
  return new Response(isSjut(request)?sjutHtml:html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});
}
