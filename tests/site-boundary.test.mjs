import test from 'node:test';
import assert from 'node:assert/strict';
import {siteBoundary,adminNext} from '../app/site-boundary.mjs';
test('both Sjút hosts serve the ball and clubs but reject photography endpoints for all methods',()=>{
 for(const host of ['sjut.is','www.sjut.is']) {
  for(const path of ['/','/hjalp','/hjalp/','/admin','/admin/login','/ball/6u-2026','/6uball','/api/6uball/state','/api/sjut-clubs','/api/sjut-game/test','/sjut/style.css','/6uball/ball.js','/klubbar/test']) assert.equal(siteBoundary(new Request(`https://${host}${path}`)),null,path);
  for(const path of ['/NewClient','/Erna','/api/clients','/api/cms','/api/content','/api/erna','/api/inquiry','/portrait','/api/%63lients']) for(const method of ['GET','POST','PUT','DELETE']) assert.equal(siteBoundary(new Request(`https://${host}${path}`,{method})).status,404,path);
 }
 assert.equal(siteBoundary(new Request('https://snjokallinn.com/admin')),null);
 assert.equal(siteBoundary(new Request('https://snjokallinn.com/sjut/klubbar')).headers.get('Location'),'https://sjut.is/admin');
});
test('login returns only to pages belonging to that admin',()=>{
 assert.equal(adminNext(new Request('https://sjut.is/admin/login?next=/NewClient')),'/admin');
 assert.equal(adminNext(new Request('https://sjut.is/admin/login?next=/admin/ball')),'/admin/ball');
 assert.equal(adminNext(new Request('https://snjokallinn.com/admin/login?next=/sjut/klubbar')),'/admin');
 assert.equal(adminNext(new Request('https://sjut.is/admin/login?next=https://evil.example')),'/admin');
});

test('owner trial returns only to exact same-site entry points',()=>{
 for(const p of ['/client','/admin/hub'])assert.equal(adminNext(new Request('https://snjokallinn.com/admin/login?next='+encodeURIComponent(p))),p);
 for(const p of ['https://evil.invalid','//evil.invalid','/client/other','/admin/hub?next=https://evil.invalid'])assert.equal(adminNext(new Request('https://snjokallinn.com/admin/login?next='+encodeURIComponent(p))),'/admin');
 assert.equal(adminNext(new Request('https://sjut.is/admin/login?next=/client')),'/admin');
});
