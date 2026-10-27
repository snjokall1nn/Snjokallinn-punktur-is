import html from '../../../content/sjut/admin.html?raw';
import {isOwner} from '../../cms';
export const dynamic='force-dynamic';
export async function GET(request:Request){if(!await isOwner(request))return Response.redirect(new URL('/admin/login?next=/sjut/klubbar',request.url),302);return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});}
