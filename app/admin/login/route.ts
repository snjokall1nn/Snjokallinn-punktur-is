import sjutHtml from '../../../content/sjut/login.html?raw';
import {isSjut,adminNext} from '../../site-boundary.mjs';
import html from '../../../content/login.html?raw';
import { adminAuth,isOwner } from '../../cms';
export const dynamic='force-dynamic';
const nextPath=adminNext;
function page(request:Request,message='',status=200,next='/admin'){return new Response((isSjut(request)?sjutHtml:html).replace('<!--message-->',message).replace('action="/admin/login"','action="/admin/login?next='+encodeURIComponent(next)+'"'),{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'same-origin','X-Robots-Tag':'noindex, nofollow'}})}
export async function GET(request:Request){
  if(await isOwner(request))return Response.redirect(new URL(nextPath(request),request.url),302);
  return page(request,'',200,nextPath(request));
}
export async function POST(request:Request){
  const result=await adminAuth.login(request);
  if(result.status===303)return new Response(null,{status:303,headers:{Location:nextPath(request),'Set-Cookie':result.cookie,'Cache-Control':'no-store'}});
  const message=result.status===429?'Of margar tilraunir. Reyndu aftur eftir 15 mínútur.':result.status===503?'Inn­skráning er tímabundið óaðgengileg.':'Notandanafn eða lykilorð er rangt.';
  return page(request,`<p class="login-error" role="alert">${message}</p>`,result.status,nextPath(request));
}
