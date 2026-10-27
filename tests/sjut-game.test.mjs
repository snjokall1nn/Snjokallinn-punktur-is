import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createSjutGameApi} from '../app/sjut-game-api.mjs';
function fixture(){const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('../drizzle/0005_secret_blindfold.sql',import.meta.url),'utf8'));const images=new Map();const db=()=>({prepare(text){let args=[];return {bind(...a){args=a;return this;},async first(){return sql.prepare(text).get(...args)||null;},async all(){return {results:sql.prepare(text).all(...args)};},async run(){return sql.prepare(text).run(...args);}};}});const bucket=()=>({async head(key){return ['sjut/clubs/hellirinn.json','sjut/clubs/throttheimar.json'].includes(key)?{}:null;},async put(k,v){images.set(k,v);},async delete(k){images.delete(k);},async get(k){return images.has(k)?{body:images.get(k)}:null;}});const api=createSjutGameApi({db,bucket,isOwner:async req=>req.headers.get('X-Test-Owner')==='yes'});return {api,sql,images};}
function req(club,action,method='GET',body,owner=false,cookie){const headers={Origin:'https://sjut.is',...(owner?{'X-Test-Owner':'yes'}:{}),...(cookie?{Cookie:cookie}:{})};if(body&&!(body instanceof FormData))headers['Content-Type']='application/json';return new Request('https://sjut.is/api/sjut-game/'+club+'/'+action,{method,headers,body:body instanceof FormData?body:body?JSON.stringify(body):undefined});}
async function call(f,c,a,m='GET',b,o=false,k){if(o&&a==='state')a='admin-state';return f.api(req(c,a,m,b,o,k),[c,...a.split('/')]);}
const mission={title:'Allt nema hendur',instructions:'Búið til form án þess að nota hendur.',points:3,published:true};
async function create(f,club='hellirinn'){const r=await call(f,club,'missions','POST',mission,true);assert.equal(r.status,201);return (await r.json()).id;}
async function join(f,club='hellirinn',name='Hópur Alex'){const r=await call(f,club,'join','POST',{name});assert.equal(r.status,201);return r.headers.get('Set-Cookie').split(';')[0];}
async function upload(f,id,cookie,club='hellirinn'){const data=new FormData();data.set('mission',id);data.set('file',new File([new Uint8Array([255,216,255,1,2,3])],'test.jpg',{type:'image/jpeg'}));return call(f,club,'upload','POST',data,false,cookie);}
test('missions are owner-only, validated and isolated per club',async()=>{const f=fixture();assert.equal((await call(f,'hellirinn','missions','POST',mission)).status,403);assert.equal((await call(f,'hellirinn','missions','POST',{...mission,points:100},true)).status,400);const id=await create(f);const hidden=await call(f,'hellirinn','missions/'+id,'PUT',{...mission,published:false},true);assert.equal(hidden.status,200);assert.equal((await (await call(f,'hellirinn','state')).json()).missions.length,0);assert.equal((await (await call(f,'hellirinn','state','GET',null,true)).json()).missions.length,1);assert.equal((await (await call(f,'throttheimar','state')).json()).missions.length,0);assert.equal((await call(f,'throttheimar','missions/'+id,'PUT',mission,true)).status,404);});
test('uploads stay private until reviewed and cannot cross clubs or members',async()=>{const f=fixture(),id=await create(f),cookie=await join(f);const uploaded=await upload(f,id,cookie);assert.equal(uploaded.status,201);const entry=(await uploaded.json()).id;assert.equal((await call(f,'hellirinn','entry/'+entry)).status,403);assert.equal((await call(f,'hellirinn','entry/'+entry,'GET',null,false,cookie)).status,200);assert.equal((await call(f,'throttheimar','entry/'+entry,'GET',null,true)).status,404);const other=await join(f,'hellirinn','Annar hópur');assert.equal((await call(f,'hellirinn','entry/'+entry,'GET',null,false,other)).status,403);assert.equal((await call(f,'hellirinn','entry/'+entry,'PUT',{approved:true})).status,403);assert.equal((await call(f,'hellirinn','entry/'+entry,'PUT',{approved:true},true)).status,200);assert.equal((await call(f,'hellirinn','entry/'+entry)).status,200);const state=await (await call(f,'hellirinn','state','GET',null,false,cookie)).json();assert.equal(state.gallery.length,1);assert.equal(state.entries.length,1);assert.equal(state.me.name,'Hópur Alex');assert.equal((await call(f,'hellirinn','entry/'+entry,'DELETE',null,true)).status,200);assert.equal(f.images.size,0);});
test('club cookie cannot be used in another club and invalid images are rejected',async()=>{const f=fixture(),id=await create(f,'throttheimar'),cookie=await join(f);assert.equal((await upload(f,id,cookie,'throttheimar')).status,403);const id2=await create(f);const data=new FormData();data.set('mission',id2);data.set('file',new File(['<svg></svg>'],'pretend.jpg',{type:'image/jpeg'}));assert.equal((await call(f,'hellirinn','upload','POST',data,false,cookie)).status,400);assert.equal(f.images.size,0);});
test('cross-origin mutations, closed missions and expired sessions are blocked',async()=>{const f=fixture(),id=await create(f),cookie=await join(f);const foreign=req('hellirinn','missions','POST',mission,true);foreign.headers.set('Origin','https://other.example');assert.equal((await f.api(foreign,['hellirinn','missions'])).status,403);await call(f,'hellirinn','missions/'+id,'PUT',{...mission,published:false},true);assert.equal((await upload(f,id,cookie)).status,404);f.sql.exec('UPDATE sjut_members SET expires=0');assert.equal((await upload(f,id,cookie)).status,403);});
test('removing a mission requires its club owner, keeps photos, and closes further uploads',async()=>{
 const f=fixture(),id=await create(f),cookie=await join(f);
 const uploaded=await upload(f,id,cookie);const entry=(await uploaded.json()).id;
 assert.equal((await call(f,'hellirinn','missions/'+id,'DELETE')).status,403);
 assert.equal((await call(f,'throttheimar','missions/'+id,'DELETE',null,true)).status,404);
 const foreign=req('hellirinn','missions/'+id,'DELETE',null,true);foreign.headers.set('Origin','https://other.example');
 assert.equal((await f.api(foreign,['hellirinn','missions',id])).status,403);
 assert.equal((await call(f,'hellirinn','missions/'+id,'DELETE',null,true)).status,200);
 for(const owner of [false,true]){const state=await (await call(f,'hellirinn','state','GET',null,owner,cookie)).json();assert.equal(state.missions.length,0);assert.equal(state.archivedMissions[0].title,mission.title);assert.equal(state.entries.length,1);}
 assert.equal(f.images.size,1);
 assert.equal((await call(f,'hellirinn','entry/'+entry,'GET',null,false,cookie)).status,200);
 assert.equal((await upload(f,id,cookie)).status,404);
 assert.equal((await call(f,'hellirinn','missions/'+id,'PUT',mission,true)).status,404);
});
test('public club state never returns administrative data even with an owner session',async()=>{
 const f=fixture();await create(f);await join(f);
 const publicState=await (await f.api(req('hellirinn','state','GET',null,true),['hellirinn','state'])).json();
 assert.equal(publicState.owner,false);assert.equal(publicState.people,undefined);
 assert.equal((await call(f,'hellirinn','admin-state')).status,403);
});
