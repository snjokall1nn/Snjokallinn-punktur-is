import { env } from 'cloudflare:workers';
import { createAdminAuth } from './admin-auth.mjs';
import seed from '../content/seed.json';
import fields from '../content/fields.json';
import { createCmsApi } from './cms-api.mjs';
import { createInquiryApi } from './inquiry-api.mjs';
import { normalizeLayout } from './cms-layout.mjs';

export const bucket = () => (env as unknown as {BUCKET:R2Bucket}).BUCKET;
export const json = (data:unknown,status=200) => Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export const adminAuth=createAdminAuth({bucket,config:()=>{
  const values=env as unknown as {ADMIN_USERNAME:string;ADMIN_PASSWORD_HASH:string};
  return {username:values.ADMIN_USERNAME,passwordHash:values.ADMIN_PASSWORD_HASH};
}});
export const isOwner=(request:Request)=>adminAuth.isOwner(request);
export async function readContent(kind='published') {
  const obj=await bucket().get(`cms/${kind}.json`);
  return {content:normalizeLayout(obj?await obj.json():structuredClone(seed),seed),etag:obj?.etag || null};
}
const cmsApi = createCmsApi({bucket,isOwner,readContent,fields,seed,json});
const inquiryApi = createInquiryApi({bucket});
export const api = (request:Request,path:string[]) => path.join('/')==='inquiry' ? inquiryApi(request) : cmsApi(request,path);
