import html from '../../../content/sjut/ball-admin.html?raw';
import {isOwner} from '../../cms';
import {isSjut} from '../../site-boundary.mjs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 if(!isSjut(request))return Response.redirect('https://sjut.is/admin/ball',302);
 if(!await isOwner(request))return Response.redirect(new URL('/admin/login?next=/admin/ball',request.url),302);
 return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow, noarchive'}});
}
