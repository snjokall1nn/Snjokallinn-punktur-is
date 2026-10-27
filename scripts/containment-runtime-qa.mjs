// Production artifact in isolated workerd. No listener, live bindings or network.
import {createRequire} from 'node:module';import {readFileSync,readdirSync,statSync} from 'node:fs';import {pbkdf2Sync,createHash} from 'node:crypto';import assert from 'node:assert/strict';
import {defaultConfig} from '../app/clients-core.mjs';
const require=createRequire(import.meta.url);const {Miniflare}=require(require.resolve('miniflare',{paths:[require.resolve('wrangler')]}));
const checks=[];const outgoing=[];
function modules(dir){return readdirSync(dir).flatMap(name=>{const path=dir+'/'+name;return statSync(path).isDirectory()?modules(path):path.endsWith('.js')?[{type:'ESModule',path}]:[]})}
const moduleList=modules(process.cwd()+'/dist/server');moduleList.sort((a,b)=>Number(b.path.endsWith('/index.js'))-Number(a.path.endsWith('/index.js')));
const mf=new Miniflare({modules:moduleList,modulesRoot:process.cwd()+'/dist/server',compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:{DB:'containment-synthetic-only'},r2Buckets:['BUCKET'],bindings:{ADMIN_USERNAME:'synthetic-owner',ADMIN_PASSWORD_HASH:'test-salt:100000:'+pbkdf2Sync('synthetic-password','test-salt',100000,32,'sha256').toString('hex')},assets:{directory:'dist/client',routerConfig:{has_user_worker:true}},outboundService:async request=>{outgoing.push(new URL(request.url).hostname);return new Response('Network disabled in containment QA',{status:503})}});
try{
 const db=await mf.getD1Database('DB'),bucket=await mf.getR2Bucket('BUCKET');
 for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())await db.batch(readFileSync('drizzle/'+file,'utf8').split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
 for(const slug of ['synthetic-client','birta'])await db.prepare('INSERT INTO clients(id,slug,config,revision,published,created,updated) VALUES(?,?,?,0,1,?,?)').bind('test-'+slug,slug,JSON.stringify({...defaultConfig,name:'Synthetic client',email:'test@example.invalid'}),'2026-10-20','2026-10-20').run();
 await db.prepare('INSERT INTO client_state(role,data,revision,updated) VALUES(?,?,7,?)').bind('test-synthetic-client:erna',JSON.stringify({answers:{0:'synthetic private answer'}}),'2026-10-20').run();
 const imageId='00000000-0000-4000-8000-000000000001';
 await db.prepare('INSERT INTO client_assets(id,mime,size,created) VALUES(?,?,4,?)').bind(imageId,'image/jpeg','2026-10-20').run();await bucket.put('clients/images/'+imageId,new Uint8Array([255,216,255,1]));
 const get=(path,headers={},method='GET',body,host='snjokallinn.com')=>mf.dispatchFetch('https://'+host+path,{method,headers,redirect:'manual',...(body?{body}:{})});
 const check=(label)=>checks.push(label);
 let r=await get('/');assert.equal(r.status,200);const home=await r.text();assert.ok(home.includes('Okkar myndataka.'));assert.ok(home.includes('/sjut-og-verd#fyrirspurn'));assert.ok(home.includes('embla'));check('homepage headline, booking link and Embla markup');
 const linked=[...new Set([...home.matchAll(/(?:src|href)="(\/[^"#]*)/g)].map(m=>m[1].split('#')[0]))];for(const path of linked){const asset=await get(path);assert.ok([200,302].includes(asset.status),'homepage dependency '+path);await asset.arrayBuffer();}check('all '+linked.length+' local homepage src/href dependencies load');
 const cookieHero=r.headers.get('set-cookie').split(';')[0];r=await get('/',{Cookie:cookieHero});assert.equal(r.status,200);assert.notEqual(r.headers.get('set-cookie').split(';')[0],cookieHero);check('hero refresh changes selection');
 for(const path of ['/sogur','/sjut-og-verd','/portrett','/headshots','/fyrirtaeki','/umsagnir','/amma','/direction-c.css','/direction-c.js']){r=await get(path);assert.equal(r.status,200,path);check('public route '+path);}
 for(const path of ['/admin','/NewClient']){r=await get(path);assert.equal(r.status,302,path);assert.ok(r.headers.get('Location').includes('/admin/login'));check('anonymous redirect '+path);}
 for(const path of ['/Erna','/erna','/may','/synthetic-client']){r=await get(path);assert.equal(r.status,503,path);const text=await r.text();assert.ok(!text.includes('synthetic private answer'));check('private page closed '+path);}
 for(const method of ['GET','POST','PUT','DELETE','HEAD','PATCH','OPTIONS'])for(const path of ['/api/erna/login','/api/may/state','/api/clients/synthetic-client/portal/state']){r=await get(path,{Cookie:'__Host-may='+ 'a'.repeat(64),Origin:'https://snjokallinn.com'},method);if(['PATCH','OPTIONS'].includes(method))assert.ok([405,204].includes(r.status),method+' '+path);else assert.equal(r.status,503,method+' '+path);assert.equal(r.headers.get('set-cookie'),null);}check('legacy API all methods refuse old sessions');
 r=await get('/api/clients/images/'+imageId);assert.equal(r.status,401);check('R2 client image requires owner');
 r=await get('/admin/login',{'Content-Type':'application/x-www-form-urlencoded',Origin:'https://snjokallinn.com'},'POST',new URLSearchParams({username:'synthetic-owner',password:'synthetic-password'}).toString());assert.equal(r.status,303);const owner=r.headers.get('set-cookie').split(';')[0];
 for(const path of ['/admin','/NewClient','/api/clients/admin','/api/editor','/synthetic-client']){r=await get(path,{Cookie:owner});assert.equal(r.status,200,path);check('verified owner '+path);}
 r=await get('/api/clients/images/'+imageId,{Cookie:owner});assert.equal(r.status,200);assert.match(r.headers.get('Cache-Control'),/no-store/);assert.equal((await r.arrayBuffer()).byteLength,4);check('owner R2 image private headers and exact length');
 const manifest=JSON.parse(readFileSync('security/private-assets-manifest.json','utf8'));
 for(const item of manifest){
  for(const method of ['GET','HEAD']){r=await get(item.path,{Range:'bytes=0-1','If-None-Match':'*'},method);assert.equal(r.status,503,item.path);assert.match(r.headers.get('Cache-Control'),/no-store/);}
  r=await get(item.path,{Cookie:owner});assert.equal(r.status,503,item.path);assert.equal(r.headers.get('CDN-Cache-Control'),'no-store');
 }check('fallback: all 25 private image URLs closed to anonymous and owner');
 // Guessed public server-chunk URLs may not reveal embedded private image data.
 const embeddedModule=moduleList.find(m=>m.path.includes('/private-client-assets-runtime-'));const chunk='/_next/static/'+embeddedModule.path.split('/').pop();r=await get(chunk);assert.equal(r.status,404);check('server-only image module cannot be downloaded as a public chunk');
 for(const host of ['sjut.is','www.sjut.is']){assert.equal((await get('/',{},'GET',null,host)).status,200);assert.equal((await get('/api/clients/admin',{},'GET',null,host)).status,404);}check('Sjút host boundary preserved');
 const saved=await db.prepare('SELECT data,revision FROM client_state WHERE role=?').bind('test-synthetic-client:erna').first();assert.equal(saved.revision,7);assert.equal(JSON.parse(saved.data).answers[0],'synthetic private answer');check('client answers and revisions unchanged');
 assert.deepEqual(outgoing,[]);check('zero external requests or email sends');
 console.log(JSON.stringify({status:'passed',scope:'isolated workerd artifact; synthetic D1/R2; no listener or network',checks:checks.length,results:checks},null,2));
}finally{await mf.dispose();}
