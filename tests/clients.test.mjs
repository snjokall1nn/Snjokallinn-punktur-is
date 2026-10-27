import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFileSync,readdirSync} from 'node:fs';import {createClientsApi} from '../app/clients-api.mjs';import {defaultConfig,renderClient,slugify} from '../app/clients-core.mjs';
function setup(){const sql=new DatabaseSync(':memory:');for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())sql.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));const db={prepare(query){const s=sql.prepare(query);let p=[];return{bind(...v){p=v;return this;},async first(){return s.get(...p)||null;},async run(){return s.run(...p);},async all(){return{results:s.all(...p)};}};},async batch(items){return Promise.all(items.map(s=>s.run()));}};const files=new Map();const bucket={async put(k,b,meta){files.set(k,{body:b,httpMetadata:meta?.httpMetadata,json:async()=>JSON.parse(b)});},async get(k){return files.get(k)||null;},async delete(k){files.delete(k);},async list(){return{objects:[...files.keys()].filter(k=>k.startsWith('inquiries/')).map(key=>({key})),truncated:false};}};const runtime=createClientsApi({db:()=>db,bucket:()=>bucket,isOwner:async r=>r.headers.get('Cookie')==='owner',routeExists:slug=>slug==='existing-service'});return{...runtime,db,files,bucket,async req(path,method='GET',data=null,cookie='owner',origin='https://example.com'){return runtime.api(new Request('https://example.com/api/clients/'+path,{method,headers:{Cookie:cookie,Origin:origin},...(data?{body:data instanceof FormData?data:JSON.stringify(data)}:{})}),path.split('/'));},async create(slug,name,published=true){const r=await this.req('admin','POST',{slug,config:{...defaultConfig,name},published});assert.equal(r.status,201,await r.clone().text());return(await r.json()).client;},async login(slug,role){return this.req(slug+'/portal/login','POST',{role},'');}};}

test('owner workspace retains create/edit/list/conflict and publication controls',async()=>{
 const s=setup();const c=await s.create('test-one','Synthetic client',false);
 assert.equal((await s.req('admin')).status,200);
 assert.equal((await s.req('admin/test-one','PUT',{slug:c.slug,revision:0,published:true,config:{...c.config,message:'Updated'}})).status,200);
 assert.equal((await s.req('admin/test-one','PUT',{slug:c.slug,revision:0,published:true,config:c.config})).status,409);
 assert.equal((await s.get('test-one')).config.message,'Updated');
});
test('anonymous clients admin and media never touch storage',async()=>{
 const fail=()=>{throw Error('storage must not be touched')};const s=createClientsApi({db:fail,bucket:fail,isOwner:async()=>false});
 for(const path of [['admin'],['images','00000000-0000-4000-8000-000000000000']])assert.equal((await s.api(new Request('https://example.com/api/clients/'+path.join('/')),path)).status,401);
});
test('all portal actions are quarantined with old role cookies; no DB/R2 operations',async()=>{
 const fail=()=>{throw Error('storage must not be touched')};const s=createClientsApi({db:fail,bucket:fail,isOwner:fail});
 for(const method of ['GET','POST','PUT','DELETE','HEAD','PATCH','OPTIONS'])for(const action of ['login','session','state','upload','files/id','logout']){
 const path=['test-one','portal',...action.split('/')];const r=await s.api(new Request('https://example.com/api/clients/'+path.join('/'),{method,headers:{Cookie:'__Host-client_fake=old-alex'}}),path);assert.equal(r.status,503);assert.equal(r.headers.get('set-cookie'),null);
 }
});
test('owner image upload validates bytes and retrieval is private',async()=>{
 const s=setup();let form=new FormData();form.set('file',new File(['bad'],'bad.jpg'));assert.equal((await s.req('admin/upload','POST',form)).status,400);
 form=new FormData();form.set('file',new File([Uint8Array.from([255,216,255,1])],'ok.jpg'));const r=await s.req('admin/upload','POST',form);assert.equal(r.status,200);const {url}=await r.json();
 const path=url.replace('/api/clients/','');assert.equal((await s.req(path,'GET',null,'')).status,401);const image=await s.req(path);assert.equal(image.headers.get('Content-Type'),'image/jpeg');assert.match(image.headers.get('Cache-Control'),/no-store/);assert.equal(image.headers.get('Vary'),'Cookie');
});
test('inquiries and origin protection remain owner-only',async()=>{
 const s=setup();await s.bucket.put('inquiries/test.json',JSON.stringify({id:'synthetic',createdAt:'2026-10-20',payload:{name:'Test',email:'test@example.invalid'},status:'pending'}));
 assert.equal((await s.req('admin/inquiries','GET',null,'')).status,401);const data=await(await s.req('admin/inquiries')).json();assert.equal(data.inquiries[0].id,'synthetic');
 assert.equal((await s.req('admin','POST',{},'owner','https://evil.invalid')).status,403);
});
test('read-only lookups preserve all rows and revisions; no implicit seeding',async()=>{
 const s=setup();assert.equal(await s.get('birta'),null);const c=await s.create('test-one','Test');
 await s.db.prepare('INSERT INTO client_state (role,data,revision,updated) VALUES (?,?,?,?)').bind(c.id+':erna',JSON.stringify({answers:{0:'synthetic answer'}}),7,'2026-10-20').run();
 const before=JSON.stringify((await s.db.prepare('SELECT * FROM client_state').all()).results);await s.get('test-one');await s.req('test-one/portal/state','GET',null,'');await s.login('test-one','alex');
 assert.equal(JSON.stringify((await s.db.prepare('SELECT * FROM client_state').all()).results),before);
});
