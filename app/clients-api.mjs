import {maintenance} from './legacy-containment.mjs';
import birtaConfig from '../content/birta.json' with {type:'json'};
import {defaultConfig,ernaTemplate,cleanConfig,validSlug} from './clients-core.mjs';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex','X-Content-Type-Options':'nosniff'}});
const rowClient=row=>row?{...row,config:JSON.parse(row.config),published:!!row.published}:null;
export function createClientsApi({db,bucket,isOwner,routeExists=()=>false}){
 // Seed this invitation once; subsequent owner edits and portal answers stay in D1.
 const ensureBirta=async()=>{
  const existing=await db().prepare('SELECT id FROM clients WHERE slug=?').bind('birta').first();if(existing)return;
  const time=new Date().toISOString();
  await db().prepare('INSERT INTO clients (id,slug,config,revision,published,created,updated) VALUES (?,?,?,0,1,?,?) ON CONFLICT(slug) DO NOTHING').bind('birta-family-2026','birta',JSON.stringify({...defaultConfig,...birtaConfig}),time,time).run();
 };
 const get=async slug=>{return rowClient(await db().prepare('SELECT * FROM clients WHERE slug=?').bind(slug.toLowerCase()).first());};
 async function api(req,path){try{
  if(path[1]==='portal')return maintenance();
  if(!await isOwner(req))return json({error:'Innskráning eiganda þarf til.'},401);
  if(req.method!=='GET'&&req.headers.get('Origin')!==new URL(req.url).origin)return json({error:'Óleyfileg beiðni.'},403);
  if(path[0]==='images'&&path.length===2&&req.method==='GET'){
   if(!/^[a-f0-9-]{36}$/.test(path[1]))return json({error:'Mynd fannst ekki.'},404);
   const asset=await db().prepare('SELECT mime FROM client_assets WHERE id=?').bind(path[1]).first();if(!asset)return json({error:'Mynd fannst ekki.'},404);
   const obj=await bucket().get('clients/images/'+path[1]);if(!obj)return json({error:'Mynd fannst ekki.'},404);
   return new Response(obj.body,{headers:{'Content-Type':asset.mime,'X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex','Cache-Control':'private, no-store, max-age=0','CDN-Cache-Control':'no-store','Cloudflare-CDN-Cache-Control':'no-store','Vary':'Cookie'}});
  }
  if(!await isOwner(req))return json({error:'Innskráning eiganda þarf til.'},401);
  if(path.join('/')==='admin'&&req.method==='GET'){
   await ensureBirta();
   const rows=await db().prepare('SELECT * FROM clients ORDER BY updated DESC').all();
   return json({clients:rows.results.map(rowClient),defaults:defaultConfig,ernaTemplate});
  }
  if(path.join('/')==='admin/inquiries'&&req.method==='GET'){
   const items=[];let cursor;let pages=0;do{const list=await bucket().list({prefix:'inquiries/',limit:100,cursor});for(const object of list.objects){const record=await bucket().get(object.key);if(record){const data=await record.json();items.push({id:data.id,createdAt:data.createdAt,status:data.status,name:data.payload?.name||'',email:data.payload?.email||'',message:data.payload?.message||''});}}cursor=list.truncated?list.cursor:undefined;}while(cursor&&++pages<10);
   items.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));return json({inquiries:items.slice(0,50)});
  }
  if(path.join('/')==='admin/upload'&&req.method==='POST'){
   if(Number(req.headers.get('Content-Length'))>11*1024*1024)return json({error:'Hámark er 10 MB.'},413);
   const form=await req.formData(),file=form.get('file');if(!file||typeof file==='string'||file.size>10*1024*1024)return json({error:'Veldu mynd, mest 10 MB.'},400);
   const b=new Uint8Array(await file.arrayBuffer());let mime='';if(b[0]===255&&b[1]===216&&b[2]===255)mime='image/jpeg';if(b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71)mime='image/png';if(new TextDecoder().decode(b.slice(0,4))==='RIFF'&&new TextDecoder().decode(b.slice(8,12))==='WEBP')mime='image/webp';if(!mime)return json({error:'Notaðu JPG, PNG eða WebP.'},400);
   const id=crypto.randomUUID();await bucket().put('clients/images/'+id,b,{httpMetadata:{contentType:mime}});try{await db().prepare('INSERT INTO client_assets (id,mime,size,created) VALUES (?,?,?,?)').bind(id,mime,file.size,new Date().toISOString()).run();}catch(e){await bucket().delete('clients/images/'+id);throw e;}return json({url:'/api/clients/images/'+id});
  }
  if(path[0]==='admin'&&(req.method==='POST'||req.method==='PUT')){
   if(path.length>2)return json({error:'Beiðni fannst ekki.'},404);
   const text=await req.text();if(text.length>100000)return json({error:'Gögnin eru of stór.'},413);
   let data,c;try{data=JSON.parse(text);c=cleanConfig(data.config);}catch(e){return json({error:e.message||'Ógild gögn.'},400);}
   const slug=data.slug;if(!validSlug(slug)||routeExists(slug))return json({error:'Veldu annan síðu-slóða (t.d. anna-jons). Þessi slóði er frátekinn.'},400);
   const updated=new Date().toISOString(),published=data.published===true?1:0;
   if(req.method==='POST'){
    if(path.length!==1)return json({error:'Ógild aðgerð.'},400);
    if(await get(slug))return json({error:'Kúnnasíða með þessum slóða er þegar til.'},409);
    const id=crypto.randomUUID();await db().prepare('INSERT INTO clients (id,slug,config,revision,published,created,updated) VALUES (?,?,?,0,?,?,?)').bind(id,slug,JSON.stringify(c),published,updated,updated).run();return json({client:await get(slug)},201);
   }
   const existing=await get(path[1]||'');if(!existing)return json({error:'Kúnni fannst ekki.'},404);
   if(slug!==existing.slug)return json({error:'Slóðin helst óbreytt svo sendir hlekkir virki áfram.'},400);
   if(!Number.isInteger(data.revision))return json({error:'Ógild útgáfa.'},400);
   const result=await db().prepare('UPDATE clients SET config=?,published=?,revision=revision+1,updated=? WHERE id=? AND revision=? RETURNING revision').bind(JSON.stringify(c),published,updated,existing.id,data.revision).first();if(!result)return json({error:'Nýrri breytingar eru til. Endurhlaða áður en þú vistar.'},409);
   // Owner edits the shared day data too, preserving the collaboratively written vision and booking state.
   const shared=await db().prepare('SELECT data FROM client_state WHERE role=?').bind(existing.id+':shared').first();if(shared){const value=JSON.parse(shared.data);Object.assign(value,{date:c.date,time:c.time,message:c.message});await db().prepare('UPDATE client_state SET data=?,revision=revision+1,updated=? WHERE role=?').bind(JSON.stringify(value),updated,existing.id+':shared').run();}
   const alex=await db().prepare('SELECT data FROM client_state WHERE role=?').bind(existing.id+':alex').first();if(alex){const value=JSON.parse(alex.data);let changed=false;for(const key of ['schedule','lighting','solo'])if(c[key]!==existing.config[key]){value[key]=c[key];changed=true;}if(changed)await db().prepare('UPDATE client_state SET data=?,revision=revision+1,updated=? WHERE role=?').bind(JSON.stringify(value),updated,existing.id+':alex').run();}
   return json({client:await get(slug)});
  }
  return json({error:'Beiðni fannst ekki.'},404);
 }catch(e){console.error('Clients API',e.message);return json({error:'Ekki tókst að vista eða sækja gögn. Reyndu aftur.'},503);}}
 return {api,get};
}
