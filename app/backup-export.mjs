// Temporary, read-only maintenance transport. No cookie can authorize it.
// A random server secret plus a <=30 minute server-side expiry are mandatory.
const H={'Cache-Control':'private, no-store','CDN-Cache-Control':'no-store','Cloudflare-CDN-Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cross-Origin-Resource-Policy':'same-origin'};
const no=(s=404)=>new Response('Óaðgengilegt.',{status:s,headers:H});
function equal(a,b){if(a.length!==b.length)return false;let v=0;for(let i=0;i<a.length;i++)v|=a.charCodeAt(i)^b.charCodeAt(i);return v===0}
export async function backupExport(request,env){
 const url=new URL(request.url);if(!url.pathname.startsWith('/api/owner-backup/'))return null;
 const until=Number(env.HUB_EXPORT_UNTIL),left=until-Date.now(),secret=env.HUB_EXPORT_SECRET;
 if(!['snjokallinn.com','www.snjokallinn.com'].includes(url.hostname)||!secret||secret.length<64||!Number.isSafeInteger(until)||left<=0||left>30*60*1000||!equal(request.headers.get('Authorization')||'','Bearer '+secret)||!env.BUCKET)return no();
 if(url.pathname==='/api/owner-backup/manifest'&&request.method==='GET'){
  const cursor=url.searchParams.get('cursor');if(cursor&&cursor.length>4096)return no(400);
  const page=await env.BUCKET.list({limit:50,include:['httpMetadata','customMetadata'],...(cursor?{cursor}:{})});
  return Response.json({objects:page.objects.map(o=>({key:o.key,size:o.size,etag:o.etag,uploaded:o.uploaded,httpMetadata:o.httpMetadata||{},customMetadata:o.customMetadata||{}})),cursor:page.truncated?page.cursor:null},{headers:H});
 }
 if(url.pathname==='/api/owner-backup/object'&&request.method==='POST'){
  if(!request.headers.get('Content-Type')?.startsWith('application/json')||Number(request.headers.get('Content-Length')||0)>8192)return no(400);
  const reader=request.body?.getReader();let size=0,parts=[];if(reader)while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>8192){await reader.cancel();return no(413)}parts.push(value)}
  const bytes=new Uint8Array(size);let pos=0;for(const part of parts){bytes.set(part,pos);pos+=part.length}
  let b;try{b=JSON.parse(new TextDecoder().decode(bytes))}catch{return no(400)}
  if(typeof b.key!=='string'||b.key.length>1024||typeof b.etag!=='string'||b.etag.length>200)return no(400);
  const object=await env.BUCKET.get(b.key,{onlyIf:{etagMatches:b.etag}});if(!object)return no();if(!('body'in object))return no(412);
  return new Response(object.body,{headers:{...H,'Content-Type':'application/octet-stream','ETag':object.httpEtag,'Content-Length':String(object.size)}});
 }
 return no(405);
}
