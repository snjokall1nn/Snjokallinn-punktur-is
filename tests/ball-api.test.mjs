import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createBallApi} from '../app/ball-api.mjs';
const sqlite=new DatabaseSync(':memory:');for(const f of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())sqlite.exec(readFileSync(new URL('../drizzle/'+f,import.meta.url),'utf8'));
const db={prepare(sql){let args=[];return {bind(...v){args=v;return this;},async first(){return sqlite.prepare(sql).get(...args)||null;},async all(){return {results:sqlite.prepare(sql).all(...args)};},async run(){return sqlite.prepare(sql).run(...args);}};}};
const blobs=new Map();const bucket={async put(k,v){blobs.set(k,v);},async get(k){return blobs.has(k)?{body:blobs.get(k)}:null;},async delete(k){blobs.delete(k);}};
const api=createBallApi({db:()=>db,bucket:()=>bucket,isOwner:async req=>req.headers.get('X-Owner')==='yes'});
let cookie='';
async function call(path,body,owner=false,method='POST'){if(owner&&path==='state')path='admin-state';return api(new Request('https://example.com/api/6uball/'+path,{method,headers:{Origin:'https://example.com',Cookie:cookie,...(owner?{'X-Owner':'yes'}:{})},...(body?{body:body instanceof FormData?body:JSON.stringify(body)}:{})}),path.split('/'));}
assert.equal((await call('register',{name:'Ógild',center:'Óþekkt'})).status,400);
let r=await call('register',{name:'Prófun',center:'Þróttheimar'});assert.equal(r.status,200);cookie=r.headers.get('Set-Cookie').split(';')[0];
let s=await (await call('state',null,true,'GET')).json();const id=s.me.id;assert.equal(s.me.slot,null);
assert.equal((await call('assign',{id,slot:1})).status,403);
assert.equal((await call('assign',{id,slot:1},true)).status,200);
s=await (await call('state',null,false,'GET')).json();assert.equal(s.me.slot,1);assert.equal(JSON.parse(s.me.missions).length,2);assert.equal(s.people,undefined);
const oldCookie=cookie;cookie='';r=await call('register',{name:'Annar',center:'Laugó'});cookie=r.headers.get('Set-Cookie').split(';')[0];s=await (await call('state',null,false,'GET')).json();assert.equal((await call('assign',{id:s.me.id,slot:1},true)).status,409);cookie=oldCookie;
const form=new FormData();form.set('mission','0');form.set('file',new Blob([new Uint8Array([255,216,255,0])],{type:'image/jpeg'}),'test.jpg');assert.equal((await call('upload',form)).status,200);
s=await (await call('state',null,true,'GET')).json();const entry=s.pending[0].id;assert.equal(s.hall.length,0);
cookie='';assert.equal((await call('entry/'+entry,null,false,'GET')).status,403);assert.equal((await call('entry/'+entry,{},true)).status,200);
s=await (await call('state',null,false,'GET')).json();assert.equal(s.hall.length,1);assert.equal((await call('entry/'+entry,null,false,'GET')).status,200);
assert.equal((await call('entry/'+entry,null,true,'DELETE')).status,200);assert.equal(blobs.size,0);
const portraitForm=new FormData();portraitForm.set('name','Sjálfsmynd');portraitForm.set('center','Askja');portraitForm.set('portrait',new Blob([new Uint8Array([255,216,255,0])]),'portrait.jpg');r=await call('register',portraitForm);assert.equal(r.status,200);s=await (await call('state',null,true,'GET')).json();const p=s.people.find(p=>p.name==='Sjálfsmynd');assert.equal(p.portrait_mime,'image/jpeg');assert.equal((await call('portrait/'+p.id,null,false,'GET')).status,403);assert.equal((await call('portrait/'+p.id,null,true,'GET')).status,200);s=await (await call('state',null,false,'GET')).json();assert.equal(s.people,undefined);
console.log('Ball API passed: registration, owner permissions, unique slots, missions, upload moderation, deletion.');

assert.equal((await call('admin-state',null,false,'GET')).status,403);
const publicState=await (await api(new Request('https://example.com/api/6uball/state',{headers:{'X-Owner':'yes'}}),['state'])).json();assert.equal(publicState.owner,false);assert.equal(publicState.people,undefined);assert.equal(publicState.pending,undefined);
assert.ok(!readFileSync(new URL('../content/ball/index.html',import.meta.url),'utf8').includes('Alex · Stjórnborð'));
