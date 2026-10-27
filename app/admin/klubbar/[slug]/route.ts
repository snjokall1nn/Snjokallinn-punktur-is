import {renderClub} from '../../../klubbar/[slug]/route';
import {isOwner} from '../../../cms';
import {isSjut} from '../../../site-boundary.mjs';
export const dynamic='force-dynamic';
export async function GET(request:Request,context:{params:Promise<{slug:string}>}){
 const {slug}=await context.params;
 if(!isSjut(request))return Response.redirect(new URL('/admin/klubbar/'+encodeURIComponent(slug),'https://sjut.is'),302);
 if(!await isOwner(request))return Response.redirect(new URL('/admin/login?next='+encodeURIComponent('/admin/klubbar/'+slug),request.url),302);
 const response=await renderClub(request,context,true);response.headers.set('X-Robots-Tag','noindex, nofollow, noarchive');return response;
}
