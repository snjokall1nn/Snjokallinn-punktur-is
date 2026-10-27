import test from 'node:test';
import assert from 'node:assert/strict';
import {pbkdf2Sync} from 'node:crypto';
import {createAdminAuth,verifyPassword} from '../app/admin-auth.mjs';
const hash='testsalt:100000:'+pbkdf2Sync('test-only-password','testsalt',100000,32,'sha256').toString('hex');
function setup(){const objects=new Map();let clock=100000;const config={username:'owner',passwordHash:hash};const bucket={get:async k=>objects.has(k)?{json:async()=>JSON.parse(objects.get(k))}:null,put:async(k,v)=>objects.set(k,v),delete:async k=>objects.delete(k)};return {auth:createAdminAuth({bucket:()=>bucket,config:()=>config,now:()=>clock}),objects,config,advance:()=>clock+=13*60*60*1000}}
function request(username='owner',password='test-only-password',origin='https://example.com'){return new Request('https://example.com/admin/login',{method:'POST',headers:{Origin:origin,'CF-Connecting-IP':'192.0.2.1','Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({username,password})})}
test('password hash validates Unicode and rejects wrong or missing hashes',async()=>{assert.equal(await verifyPassword('test-only-password',hash),true);assert.equal(await verifyPassword('wrong',hash),false);assert.equal(await verifyPassword('wrong',undefined),false);const p='prófun-æ';const h='salt:100000:'+pbkdf2Sync(p,'salt',100000,32,'sha256').toString('hex');assert.equal(await verifyPassword(p,h),true)});
test('login creates secure session; fake, expired and logged-out sessions are rejected',async()=>{const s=setup();assert.equal(await s.auth.isOwner(new Request('https://example.com/admin')),false);const r=await s.auth.login(request());assert.equal(r.status,303);assert.match(r.cookie,/HttpOnly; Secure; SameSite=Strict/);const req=new Request('https://example.com/admin',{headers:{Cookie:r.cookie.split(';')[0]}});assert.equal(await s.auth.isOwner(req),true);const logout=await s.auth.logout(new Request('https://example.com/admin/logout',{method:'POST',headers:{Cookie:r.cookie.split(';')[0],Origin:'https://example.com'}}));assert.equal(logout.status,303);assert.equal(await s.auth.isOwner(req),false);const again=await s.auth.login(request());s.advance();assert.equal(await s.auth.isOwner(new Request('https://example.com/admin',{headers:{Cookie:again.cookie.split(';')[0]}})),false)});
test('password rotation revokes existing sessions',async()=>{const s=setup(),r=await s.auth.login(request());s.config.passwordHash+='changed';assert.equal(await s.auth.isOwner(new Request('https://example.com/admin',{headers:{Cookie:r.cookie.split(';')[0]}})),false)});
test('cross-origin requests are rejected and repeated failures throttle login',async()=>{const s=setup();assert.equal((await s.auth.login(request('owner','test-only-password','https://evil.example'))).status,403);assert.equal(s.objects.size,0);for(let i=0;i<10;i++)assert.equal((await s.auth.login(request('owner','wrong'))).status,401);assert.equal((await s.auth.login(request())).status,429);s.advance();assert.equal((await s.auth.login(request())).status,303)});

test('Sjút sessions cannot authorize Snjókallinn even when a token is replayed under the other cookie name',async()=>{
 const s=setup();
 const req=request();
 const login=new Request('https://sjut.is/admin/login',{method:'POST',headers:{Origin:'https://sjut.is'},body:await req.text()});
 const result=await s.auth.login(login);assert.equal(result.status,303);assert.match(result.cookie,/^__Host-sjut_admin=/);
 const cookie=result.cookie.split(';')[0];
 assert.equal(await s.auth.isOwner(new Request('https://sjut.is/admin',{headers:{Cookie:cookie}})),true);
 assert.equal(await s.auth.isOwner(new Request('https://snjokallinn.com/admin',{headers:{Cookie:cookie.replace('__Host-sjut_admin','__Host-snjokallinn_admin')}})),false);
 const photo=await s.auth.login(request());
 assert.equal(await s.auth.isOwner(new Request('https://sjut.is/admin',{headers:{Cookie:photo.cookie.split(';')[0].replace('__Host-snjokallinn_admin','__Host-sjut_admin')}})),false);
});
