import {digest} from './admin-auth.mjs';
const centers=['Laugó','Buskinn','Bústaður','Askja','Tónar','Þróttheimar'];
const COOKIE='__Host-ball_person';
const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff'};
const json=(data,status=200,extra={})=>Response.json(data,{status,headers:{...headers,...extra}});
export function createBallApi({db,bucket,isOwner}){
const q=(sql,...args)=>db().prepare(sql).bind(...args);
async function person(req){const t=req.headers.get('Cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);return /^[a-f0-9]{64}$/.test(t||'')?q('SELECT id,name,center,slot,missions,handed FROM ball_people WHERE token=?',await digest(t)).first():null;}
async function body(req){const s=await req.text();if(s.length>4096)throw Error('large');return JSON.parse(s);}
return async(req,path)=>{try{
const action=path.join('/'),method=req.method;
if(method!=='GET'&&req.headers.get('Origin')!==new URL(req.url).origin)return json({error:'Óleyfileg beiðni.'},403);
if((action==='state'||action==='admin-state')&&method==='GET'){
const owner=action==='admin-state'&&await isOwner(req);
if(action==='admin-state'&&!owner)return json({error:'Skráðu þig inn á stjórnborðið.'},403);
const me=await person(req);
const schedule=await q('SELECT id,name,center,slot,handed FROM ball_people WHERE slot IS NOT NULL ORDER BY slot').all();
const hall=await q('SELECT e.id,e.mission,p.name FROM ball_entries e JOIN ball_people p ON p.id=e.person WHERE e.approved=1 ORDER BY e.created DESC').all();
const own=me?await q('SELECT id,mission,approved FROM ball_entries WHERE person=? ORDER BY created',me.id).all():{results:[]};
return json({owner,me,schedule:schedule.results,hall:hall.results,entries:own.results,...(owner?{people:(await q('SELECT id,name,center,portrait_mime,slot,missions,handed FROM ball_people ORDER BY created').all()).results,pending:(await q('SELECT e.id,e.mission,p.name FROM ball_entries e JOIN ball_people p ON p.id=e.person WHERE e.approved=0 ORDER BY e.created').all()).results}:{})});
}
if(action==='register'&&method==='POST'){
if(Number(req.headers.get('Content-Length'))>9*1024*1024)return json({error:'Hámark er 8 MB á sjálfsmynd.'},413);
const form=req.headers.get('Content-Type')?.includes('multipart/form-data')?await req.formData():null;
const b=form?{name:form.get('name'),center:form.get('center')}:await body(req),name=typeof b.name==='string'?b.name.trim():'';
if(!centers.includes(b.center))return json({error:'Veldu félagsmiðstöðina þína.'},400);
const photo=form?.get('portrait');let portrait=null,mime=null;
if(photo&&typeof photo!=='string'&&photo.size){
if(photo.size>8*1024*1024)return json({error:'Sjálfsmyndin má vera mest 8 MB.'},413);
portrait=new Uint8Array(await photo.arrayBuffer());
if(portrait[0]===255&&portrait[1]===216&&portrait[2]===255)mime='image/jpeg';
if(portrait[0]===137&&portrait[1]===80&&portrait[2]===78&&portrait[3]===71)mime='image/png';
if(new TextDecoder().decode(portrait.slice(0,4))==='RIFF'&&new TextDecoder().decode(portrait.slice(8,12))==='WEBP')mime='image/webp';
if(!mime)return json({error:'Sjálfsmyndin þarf að vera JPG, PNG eða WebP. Þú getur líka skráð þig án myndar.'},400);
}
if(name.length<2||name.length>60)return json({error:'Skrifaðu nafnið þitt, 2-60 stafir.'},400);
if(await person(req))return json({error:'Þú ert þegar skráð/ur í þessum síma.'},409);
const count=await q('SELECT COUNT(*) n FROM ball_people').first();if(count.n>=200)return json({error:'Skráning er full. Talaðu við Alex.'},409);
const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
const id=crypto.randomUUID();if(portrait)await bucket().put('ball/portraits/'+id,portrait,{httpMetadata:{contentType:mime}});
try{await q('INSERT INTO ball_people (id,name,center,portrait_mime,token,missions,created) VALUES (?,?,?,?,?,?,?)',id,name,b.center,mime,await digest(token),'[]',new Date().toISOString()).run();}catch(e){if(portrait)await bucket().delete('ball/portraits/'+id);throw e;}
return json({ok:true},200,{'Set-Cookie':`${COOKIE}=${token}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Strict`});
}
if(path[0]==='portrait'&&path.length===2&&method==='GET'){
if(!await isOwner(req))return json({error:'Aðeins Alex sér sjálfsmyndir.'},403);
const p=await q('SELECT portrait_mime FROM ball_people WHERE id=?',path[1]).first();if(!p?.portrait_mime)return json({error:'Engin sjálfsmynd.'},404);
const obj=await bucket().get('ball/portraits/'+path[1]);if(!obj)return json({error:'Mynd fannst ekki.'},404);
return new Response(obj.body,{headers:{...headers,'Content-Type':p.portrait_mime}});
}
if(action==='assign'&&method==='POST'){
if(!await isOwner(req))return json({error:'Skráðu þig inn sem Alex.'},403);
const b=await body(req);if(b.slot!==null&&(!Number.isInteger(b.slot)||b.slot<0||b.slot>11))return json({error:'Ógildur tími.'},400);
const p=await q('SELECT id,missions FROM ball_people WHERE id=?',b.id).first();if(!p)return json({error:'Skráning fannst ekki.'},404);
const existing=JSON.parse(p.missions);const missions=existing.length?existing:[Math.floor(Math.random()*3),3+Math.floor(Math.random()*3)];
try{await q('UPDATE ball_people SET slot=?,missions=?,handed=0 WHERE id=?',b.slot,JSON.stringify(missions),b.id).run();}catch(e){if(String(e).includes('UNIQUE'))return json({error:'Tíminn er þegar úthlutaður. Veldu annan tíma.'},409);throw e;}return json({ok:true});
}
if(action==='handed'&&method==='POST'){
if(!await isOwner(req))return json({error:'Skráðu þig inn sem Alex.'},403);const b=await body(req);await q('UPDATE ball_people SET handed=? WHERE id=?',b.handed?1:0,b.id).run();return json({ok:true});
}
if(action==='upload'&&method==='POST'){
const me=await person(req);if(!me||me.slot===null)return json({error:'Alex þarf að staðfesta tímann þinn áður en þú sendir inn.'},403);
if(Number(req.headers.get('Content-Length'))>9*1024*1024)return json({error:'Hámark er 8 MB.'},413);
const count=await q('SELECT COUNT(*) n FROM ball_entries WHERE person=?',me.id).first();if(count.n>=20)return json({error:'Þú hefur sent inn 20 myndir. Talaðu við Alex.'},400);
const form=await req.formData(),file=form.get('file'),mission=Number(form.get('mission'));
if(!file||typeof file==='string'||file.size>8*1024*1024||!Number.isInteger(mission)||mission<0||mission>8)return json({error:'Veldu mynd, mest 8 MB.'},400);
const bytes=new Uint8Array(await file.arrayBuffer());let mime='';
if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)mime='image/jpeg';
if(bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71)mime='image/png';
if(new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP')mime='image/webp';
if(!mime)return json({error:'Veldu JPG, PNG eða WebP. Síminn getur sent JPG með myndavélartakkanum.'},400);
const id=crypto.randomUUID();await bucket().put('ball/'+id,bytes,{httpMetadata:{contentType:mime}});
try{await q('INSERT INTO ball_entries (id,person,mission,mime,created) VALUES (?,?,?,?,?)',id,me.id,mission,mime,new Date().toISOString()).run();}catch(e){await bucket().delete('ball/'+id);throw e;}return json({ok:true});
}
if(path[0]==='entry'&&path.length===2){
const e=await q('SELECT * FROM ball_entries WHERE id=?',path[1]).first();if(!e)return json({error:'Mynd fannst ekki.'},404);
const owner=await isOwner(req);
if(method==='POST'){if(!owner)return json({error:'Aðeins Alex staðfestir.'},403);await q('UPDATE ball_entries SET approved=1 WHERE id=?',e.id).run();return json({ok:true});}
if(method==='DELETE'){if(!owner)return json({error:'Aðeins Alex fjarlægir.'},403);await q('DELETE FROM ball_entries WHERE id=?',e.id).run();await bucket().delete('ball/'+e.id);return json({ok:true});}
if(method==='GET'){const me=await person(req);if(!e.approved&&!owner&&me?.id!==e.person)return json({error:'Mynd bíður staðfestingar.'},403);const obj=await bucket().get('ball/'+e.id);if(!obj)return json({error:'Mynd fannst ekki.'},404);return new Response(obj.body,{headers:{...headers,'Content-Type':e.mime}});}
}
return json({error:'Beiðni fannst ekki.'},404);
}catch(e){console.error('Ball API',e?.message);return json({error:'Ekki tókst að hlaða eða vista. Haltu síðunni opinni og reyndu aftur.'},503);}};
}
