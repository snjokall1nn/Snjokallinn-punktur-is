import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync,readdirSync,statSync} from 'node:fs';import {createHash} from 'node:crypto';
import {legacyApiGate,maintenance} from '../app/legacy-containment.mjs';
import {servePrivateClientAsset} from '../app/private-client-assets.mjs';
import {createClientPortalApi} from '../app/client-portal-api.mjs';
const req=(path,method='GET',headers={})=>new Request('https://example.invalid'+path,{method,headers});
const assets={'/clients/test/photo.webp':'data:image/webp;base64,UklGRg=='};
test('all methods and old/fake role sessions are refused before legacy handlers',async()=>{
 for(const cookie of ['', '__Host-erna_session='+ 'a'.repeat(64),'__Host-may='+ 'a'.repeat(64),'__Host-client_fake='+ 'a'.repeat(64)])for(const method of ['GET','HEAD','POST','PUT','DELETE','PATCH','OPTIONS'])for(const path of [['may','login'],['erna','state'],['clients','test','portal','files','id']]){
  const r=await legacyApiGate(req('/api/'+path.join('/'),method,{Cookie:cookie}),path,async()=>true);assert.equal(r.status,503);assert.equal(r.headers.get('Set-Cookie'),null);assert.equal(r.headers.get('CDN-Cache-Control'),'no-store');
 }
});
test('direct legacy factory cannot bypass root guard',async()=>{const fail=()=>{throw Error('storage touched')};const api=createClientPortalApi({db:fail,bucket:fail});assert.equal((await api(req('/api/clients/x/portal/login','POST'),['login'])).status,503)});
test('anonymous media/admin refusal and unrelated API routing preservation',async()=>{
 for(const path of [['clients','images','id'],['clients','admin']])assert.equal((await legacyApiGate(req('/api/'+path.join('/')),path,async()=>false)).status,401);
 for(const path of [['clients','images','id'],['clients','admin'],['inquiry'],['content'],['sjut-game']])assert.equal(await legacyApiGate(req('/api/'+path.join('/')),path,async()=>true),null);
});
test('private static files require actual owner, even for range/conditional/HEAD',async()=>{
 for(const method of ['GET','HEAD'])for(const path of ['/clients/test/photo.webp','/clients/test/missing.webp','/clients/test/%70hoto.webp']){
 const r=await servePrivateClientAsset(req(path,method,{Cookie:'legacy=alex',Range:'bytes=0-1','If-None-Match':'*'}),assets,async()=>false);assert.equal(r.status,401);assert.match(r.headers.get('Cache-Control'),/no-store/);assert.equal(r.headers.get('ETag'),null);assert.notEqual(r.status,304);
 }
});
test('owner gets exact bytes with private headers; HEAD and missing/type/method behave safely',async()=>{
 const r=await servePrivateClientAsset(req('/clients/test/photo.webp'),assets,async()=>true);assert.equal(r.status,200);assert.equal(await r.text(),'RIFF');assert.equal(r.headers.get('Content-Type'),'image/webp');assert.equal(r.headers.get('Cloudflare-CDN-Cache-Control'),'no-store');assert.equal(r.headers.get('Vary'),'Cookie');
 assert.equal(await(await servePrivateClientAsset(req('/clients/test/photo.webp','HEAD'),assets,async()=>true)).text(),'');
 assert.equal((await servePrivateClientAsset(req('/clients/test/photo.webp','POST'),assets,async()=>true)).status,405);
 assert.equal((await servePrivateClientAsset(req('/clients/test/__proto__'),assets,async()=>true)).status,404);
});
test('all 25 original project images preserved byte-for-byte outside public',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../security/private-assets-manifest.json',import.meta.url),'utf8'));assert.equal(manifest.length,25);
 for(const row of manifest){assert.equal(existsSync(new URL('../public'+row.path,import.meta.url)),false,row.path);const bytes=readFileSync(new URL('../private/legacy-assets'+row.path,import.meta.url));assert.equal(bytes.length,row.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256);}
});
test('built client artifact contains no private-image bytes or emitted copies',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../security/private-assets-manifest.json',import.meta.url),'utf8'));const hashes=new Set(manifest.map(x=>x.sha256));
 function walk(dir){return readdirSync(dir).flatMap(f=>{const p=new URL(f,dir);return statSync(p).isDirectory()?walk(new URL(f+'/',dir)):[p]})}
 for(const row of manifest)assert.equal(existsSync(new URL('../dist/client'+row.path,import.meta.url)),false,row.path);
 for(const p of walk(new URL('../dist/client/',import.meta.url))){const bytes=readFileSync(p);assert.equal(hashes.has(createHash('sha256').update(bytes).digest('hex')),false,String(p));}
 const rawModule=readFileSync(new URL('../app/private-client-assets-runtime.ts',import.meta.url),'utf8');assert.ok(rawModule.includes("query:'?inline'") || (rawModule.includes("maintenance()") && !rawModule.includes("import.meta.glob")));
});
