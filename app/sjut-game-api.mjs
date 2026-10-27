import {digest} from './admin-auth.mjs';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json=(data,status=200,extra={})=>Response.json(data,{status,headers:{...headers,...extra}});
export function validateMission(b){const title=typeof b?.title==='string'?b.title.trim():'',instructions=typeof b?.instructions==='string'?b.instructions.trim():'';if(title.length<2||title.length>120||instructions.length<5||instructions.length>2000||!Number.isInteger(b.points)||b.points<1||b.points>10)throw Error('Settu inn titil (2-120 stafir), leiðbeiningar (5-2000 stafir) og 1-10 stig.');return {title,instructions,points:b.points,published:b.published===false?0:1};}
function imageMime(bytes){if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';if(bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71&&bytes[4]===13&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10)return 'image/png';if(new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP')return 'image/webp';return null;}
export function createSjutGameApi({db,bucket,isOwner,now=()=>Date.now()}){
 const q=(sql,...args)=>db().prepare(sql).bind(...args);
 const cookieName=club=>'__Host-sjut_'+club;
 async function member(req,club){const name=cookieName(club)+'=',token=req.headers.get('Cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(name))?.slice(name.length);if(!/^[a-f0-9]{64}$/.test(token||''))return null;return q('SELECT id,name FROM sjut_members WHERE club=? AND token=? AND expires>?',club,await digest(token),now()).first();}
 async function body(req){const raw=await req.text();if(raw.length>6000)throw Error('Upplýsingarnar eru of langar.');try{return JSON.parse(raw);}catch{throw Error('Ógildar upplýsingar.');}}
 return async(req,path)=>{try{
 const [club,action,...rest]=path,method=req.method;
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(club||'')||club.length>60||rest.length>1)return json({error:'Klúbbur fannst ekki.'},404);
 if(method!=='GET'&&req.headers.get('Origin')!==new URL(req.url).origin)return json({error:'Ógild beiðni.'},403);
 if(!await bucket().head('sjut/clubs/'+club+'.json'))return json({error:'Klúbbur fannst ekki.'},404);
 const owner=await isOwner(req),me=await member(req,club);
 if((action==='state'||action==='admin-state')&&method==='GET'){
 const stateOwner=action==='admin-state'&&owner;
 if(action==='admin-state'&&!stateOwner)return json({error:'Skráðu þig inn sem stjórnandi.'},403);
 const archivedMissions=(await q('SELECT id,title FROM sjut_missions WHERE club=? AND published=-1',club).all()).results;
 const missions=(await q('SELECT id,title,instructions,points,published FROM sjut_missions WHERE club=?'+(stateOwner?' AND published>=0':' AND published=1')+' ORDER BY created,id',club).all()).results;
 const gallery=(await q('SELECT e.id,e.mission,e.approved,e.created,p.name FROM sjut_entries e JOIN sjut_members p ON e.member=p.id WHERE e.club=? AND e.approved=1 ORDER BY e.created DESC',club).all()).results;
 const entries=stateOwner?(await q('SELECT e.id,e.mission,e.approved,e.created,p.name FROM sjut_entries e JOIN sjut_members p ON e.member=p.id WHERE e.club=? ORDER BY e.created DESC',club).all()).results:me?(await q('SELECT id,mission,approved,created FROM sjut_entries WHERE club=? AND member=? ORDER BY created DESC',club,me.id).all()).results:[];
 const people=stateOwner?(await q('SELECT id,name,created FROM sjut_members WHERE club=? ORDER BY created',club).all()).results:undefined;
 return json({owner:stateOwner,me,missions,archivedMissions,gallery,entries,...(stateOwner?{people}:{})});
 }
 if(action==='join'&&method==='POST'){
 if(me)return json({me});
 const b=await body(req),name=typeof b.name==='string'?b.name.trim():'';if(name.length<2||name.length>80)return json({error:'Nafnið þarf að vera 2-80 stafir.'},400);
 const count=await q('SELECT COUNT(*) n FROM sjut_members WHERE club=?',club).first();if(count.n>=500)return json({error:'Klúbburinn er fullur. Talaðu við Alex.'},409);
 const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join(''),id=crypto.randomUUID();
 await q('INSERT INTO sjut_members (id,club,name,token,expires,created) VALUES (?,?,?,?,?,?)',id,club,name,await digest(token),now()+30*86400000,new Date(now()).toISOString()).run();
 return json({me:{id,name}},201,{'Set-Cookie':`${cookieName(club)}=${token}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Strict`});
 }
 if(action==='missions'&&(method==='POST'||method==='PUT')){
 if(!owner)return json({error:'Aðeins stjórnandi getur breytt Sjút Missjóns.'},403);
 let b,m;try{b=await body(req);m=validateMission(b);}catch(e){return json({error:e.message},400);}
 if(method==='PUT'){
 const old=await q('SELECT id FROM sjut_missions WHERE club=? AND id=? AND published>=0',club,rest[0]||'').first();if(!old)return json({error:'Missjón fannst ekki.'},404);
 await q('UPDATE sjut_missions SET title=?,instructions=?,points=?,published=? WHERE club=? AND id=?',m.title,m.instructions,m.points,m.published,club,old.id).run();return json({id:old.id});
 }
 const count=await q('SELECT COUNT(*) n FROM sjut_missions WHERE club=? AND published>=0',club).first();if(count.n>=100)return json({error:'Hámark er 100 missjónir í klúbbi.'},409);
 const id=crypto.randomUUID();await q('INSERT INTO sjut_missions (id,club,title,instructions,points,published,created) VALUES (?,?,?,?,?,?,?)',id,club,m.title,m.instructions,m.points,m.published,new Date(now()).toISOString()).run();return json({id},201);
 }
 // Removed missions are archived so their photographs and captions survive.
 if(action==='missions'&&method==='DELETE'&&rest[0]){
 if(!owner)return json({error:'Aðeins stjórnandi getur tekið út missjónir.'},403);
 const old=await q('SELECT id FROM sjut_missions WHERE club=? AND id=? AND published>=0',club,rest[0]).first();
 if(!old)return json({error:'Missjón fannst ekki.'},404);
 await q('UPDATE sjut_missions SET published=-1 WHERE club=? AND id=?',club,old.id).run();
 return json({ok:true});
 }
 if(action==='upload'&&method==='POST'){
 if(!me)return json({error:'Skráðu nafn þitt eða hópsins fyrst.'},403);
 if(Number(req.headers.get('Content-Length'))>9*1024*1024)return json({error:'Myndin má vera mest 8 MB.'},413);
 const form=await req.formData(),file=form.get('file'),mission=form.get('mission');
 if(!file||typeof file==='string'||!file.size||file.size>8*1024*1024)return json({error:'Veldu mynd, mest 8 MB.'},400);
 const m=await q('SELECT id FROM sjut_missions WHERE club=? AND id=? AND published=1',club,typeof mission==='string'?mission:'').first();if(!m)return json({error:'Þessi missjón er ekki opin í klúbbnum.'},404);
 const count=await q('SELECT COUNT(*) n FROM sjut_entries WHERE club=? AND member=? AND mission=?',club,me.id,m.id).first();if(count.n>=5)return json({error:'Þú hefur sent inn fimm myndir fyrir þessa missjón.'},409);
 const bytes=new Uint8Array(await file.arrayBuffer()),mime=imageMime(bytes);if(!mime)return json({error:'Veldu JPG, PNG eða WebP. Þú getur tekið mynd beint með símanum.'},400);
 const id=crypto.randomUUID(),key='sjut/photos/'+club+'/'+id;await bucket().put(key,bytes,{httpMetadata:{contentType:mime}});
 try{await q('INSERT INTO sjut_entries (id,club,member,mission,mime,created) VALUES (?,?,?,?,?,?)',id,club,me.id,m.id,mime,new Date(now()).toISOString()).run();}catch(e){await bucket().delete(key);throw e;}
 return json({id},201);
 }
 if(action==='entry'&&rest[0]){
 const e=await q('SELECT * FROM sjut_entries WHERE club=? AND id=?',club,rest[0]).first();if(!e)return json({error:'Mynd fannst ekki.'},404);
 if(method==='GET'){
 if(!e.approved&&!owner&&e.member!==me?.id)return json({error:'Myndin bíður samþykkis.'},403);
 const obj=await bucket().get('sjut/photos/'+club+'/'+e.id);if(!obj)return json({error:'Mynd fannst ekki.'},404);
 const extension=e.mime==='image/png'?'png':e.mime==='image/webp'?'webp':'jpg';
 return new Response(obj.body,{headers:{...headers,'Content-Type':e.mime,...(new URL(req.url).searchParams.has('download')?{'Content-Disposition':`attachment; filename="sjut-${e.id}.${extension}"`}:{})}});
 }
 if(!owner)return json({error:'Aðeins stjórnandi getur yfirfarið myndir.'},403);
 if(method==='PUT'){const b=await body(req);await q('UPDATE sjut_entries SET approved=? WHERE club=? AND id=?',b.approved?1:0,club,e.id).run();return json({ok:true});}
 if(method==='DELETE'){await q('DELETE FROM sjut_entries WHERE club=? AND id=?',club,e.id).run();await bucket().delete('sjut/photos/'+club+'/'+e.id);return json({ok:true});}
 }
 return json({error:'Aðgerð fannst ekki.'},404);
 }catch(e){console.error('Sjút game API',e);return json({error:'Ekki tókst að hlaða eða vista. Haltu síðunni opinni og reyndu aftur.'},503);}};
}
