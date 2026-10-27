import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {heroDefaults,heroCollection,validateHeroImages,renderEditorialHero} from '../app/editorial-hero.mjs';
test('refresh excludes the same photo after reordering, using its stable identity',()=>{
 for(const previous of heroDefaults)for(const random of [0,.2,.5,.999999]){const r=renderEditorialHero({heroImages:[...heroDefaults].reverse()},previous.id,()=>random);assert.notEqual(r.id,previous.id)}
});
test('legacy content keeps the original 20-photo collection without storage migration',()=>{
 assert.equal(heroCollection({}).length,20);assert.equal(renderEditorialHero({},'invalid',()=>0).id,'hero-01');
});
test('single hero is supported; empty, duplicate, oversized and untrusted entries are rejected',()=>{
 const single=[heroDefaults[6]];assert.equal(renderEditorialHero({heroImages:single},single[0].id,()=>0).id,'hero-07');
 for(const input of [[],[single[0],single[0]],[{id:'https://evil.test/x',alt:''}],[{id:'12345678-1234-1234-1234-123456789abc',alt:'',width:9000,height:2}]])assert.throws(()=>validateHeroImages(input));
});
test('renderer emits the selected photo, responsive sources, intrinsic dimensions and escaped alt',()=>{
 const r=renderEditorialHero({heroImages:[{...heroDefaults[6],alt:'" <script> &'}]},null,()=>0);
 assert.match(r.html,/srcset=/);assert.match(r.html,/fetchpriority="high"/);assert.match(r.html,/width="1537" height="2048"/);assert.match(r.html,/&quot; &lt;script&gt; &amp;/);assert.doesNotMatch(r.html,/<script>/);
 const uploaded={id:'12345678-1234-1234-1234-123456789abc',alt:'Mín mynd',width:1600,height:900};
 assert.match(renderEditorialHero({heroImages:[uploaded]},null,()=>0).html,/\/api\/media\/12345678/);
});
test('all static responsive sources exist; hero CSS preserves full aspect ratio on mobile',()=>{
 for(const item of heroDefaults){const r=renderEditorialHero({heroImages:[item]},null,()=>0);for(const match of r.html.matchAll(/(\/assets\/hero\/[\w.-]+\.webp)/g))assert.ok(fs.existsSync(new URL('../public'+match[1],import.meta.url)));}
 const css=fs.readFileSync(new URL('../public/direction-c.css',import.meta.url),'utf8');assert.ok(css.includes('.direction-c .hero .intro{margin-top:0}}'));assert.match(css,/\.direction-c \.hero-photo img\{aspect-ratio:auto;height:auto;max-height:none;object-fit:contain\}/);
});
test('homepage GET uses the chosen collection, sets cookie and never changes other photos',async()=>{
 const source=fs.readFileSync(new URL('../app/route.ts',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export ','').replace('request:Request','request');
 const template=fs.readFileSync(new URL('../content/home-c.html',import.meta.url),'utf8');let owner=true;const reads=[];
 const GET=new Function('sjutHtml','html','isOwner','readContent','renderEditorialHero','seoHead',source+';return GET;')('sjút',template,async()=>owner,async kind=>{reads.push(kind);return {content:{heroImages:[heroDefaults[6],heroDefaults[12]]}}},renderEditorialHero,()=>'<title>Snjókallinn</title>');
 let r=await GET(new Request('https://snjokallinn.com/'));let cookie=r.headers.get('Set-Cookie').split(';')[0];const first=await r.text();
 assert.equal(r.headers.get('Cache-Control'),'no-store');assert.match(cookie,/snjokallinn_editorial_hero=hero-/);
 r=await GET(new Request('https://snjokallinn.com/',{headers:{Cookie:cookie}}));assert.notEqual(r.headers.get('Set-Cookie').split(';')[0],cookie);const second=await r.text();
 const stripHero=s=>s.replace(/<figure class="hero-photo">.*?<\/figure>/s,'');assert.equal(stripHero(first),stripHero(second));assert.match(first,/Okkar myndataka\./);
 await GET(new Request('https://snjokallinn.com/?preview=1'));assert.equal(reads.at(-1),'draft');
 owner=false;r=await GET(new Request('https://snjokallinn.com/?preview=1'));assert.equal(r.status,302);
 const count=reads.length;r=await GET(new Request('https://sjut.is/'));assert.equal(await r.text(),'sjút');assert.equal(reads.length,count);assert.equal(r.headers.get('Set-Cookie'),null);
});
