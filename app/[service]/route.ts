import {maintenancePage} from '../legacy-containment.mjs';
import {getClient} from '../clients-runtime';
import {renderClient} from '../clients-core.mjs';
import {isOwner} from '../cms';
import {GET as newClient} from '../NewClient/route';
export const dynamic='force-dynamic';
import { renderService } from '../service-pages.mjs';
import { GET as erna } from '../Erna/route';
export async function GET(_request:Request,context:{params:Promise<{service:string}>}) {
  const {service}=await context.params;
  if(service.toLowerCase()==='newclient')return newClient(_request);
  const client=await getClient(service);
  if(client&&!await isOwner(_request))return maintenancePage();
  if(client&&(client.published||await isOwner(_request)))return new Response(renderClient(client),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow, noarchive'}});
  if(service==='erna') return erna();
  const html=renderService(service);
  return new Response(html??'<!doctype html><html lang="is"><head><title>Síða fannst ekki | Snjókallinn</title><meta name="robots" content="noindex"></head><body><h1>Síða fannst ekki.</h1><a href="/">Aftur á Snjókallinn</a></body></html>',{status:html?200:404,headers:{'Content-Type':'text/html; charset=utf-8',...(html?{}:{'X-Robots-Tag':'noindex'})}});
}
