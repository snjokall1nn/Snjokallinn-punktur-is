import test from 'node:test';
import assert from 'node:assert/strict';
import { packageEstimate } from '../public/package-inquiry.mjs';
import { inquiryBody } from '../public/estimate-summary.mjs';
import { normalizeLayout } from '../app/cms-layout.mjs';
import seed from '../content/seed.json' with { type: 'json' };
import { createInquiryApi } from '../app/inquiry-api.mjs';

test('each direct package inquiry carries its chosen package and price into both delivery paths', async () => {
  for (const [id, name, price] of [['quick','Mini sjút','50.000'],['editorial','Snjókallinn sjút','85.000'],['iconic','Main Character sjút','130.000']]) {
    let sent;
    const payload={kind:'availability',answers:{email:'test@example.com',location:'Finna stað með Alex',when:'Í næstu viku'},estimate:{...packageEstimate(id),total:1}};
    const fallback=inquiryBody(payload);
    assert.ok(fallback.includes(name));assert.ok(fallback.includes(price));assert.ok(fallback.includes('3 prent'));
    const api=createInquiryApi({bucket:()=>({put:async()=>{}}),fetcher:async(url,options)=>{sent=JSON.parse(options.body);return Response.json({success:true});}});
    const result=await api(new Request('https://snjokallinn.com/api/inquiry',{method:'POST',headers:{Origin:'https://snjokallinn.com','Content-Type':'application/json','CF-Connecting-IP':crypto.randomUUID()},body:JSON.stringify(payload)}));
    assert.equal(result.status,200);assert.ok(sent.Verðmat.includes(name));assert.ok(sent.Verðmat.includes(price));
  }
  assert.equal(packageEstimate('custom'),null);assert.equal(packageEstimate('__proto__'),null);assert.equal(packageEstimate(''),null);
});

test('legacy CMS layout adopts the new order without losing edits, custom chapters or hidden state', () => {
  const legacy={schema:1,texts:{'home-2':'Persónulegur texti'},albums:[{id:'album'}],extraSections:[],sections:[{id:'home',hidden:false},{id:'work',hidden:false},{id:'journey',hidden:true},{id:'about',hidden:false},{id:'custom',hidden:false}]};
  const migrated=normalizeLayout(legacy,seed);
  // Normalization fills missing defaults while retaining the owner's overrides.
  assert.equal(migrated.texts['home-2'],legacy.texts['home-2']);
  for(const [key,value] of Object.entries(seed.texts))if(!(key in legacy.texts))assert.equal(migrated.texts[key],value);assert.deepEqual(migrated.albums,legacy.albums);
  assert.deepEqual(migrated.sections.slice(0,seed.sections.length).map(s=>s.id),seed.sections.map(s=>s.id));
  for(const id of ['pricing','prints','faq','contact'])assert.equal(migrated.sections.find(s=>s.id===id).hidden,true);
  assert.ok(migrated.sections.some(s=>s.id==='custom'));
  const rearranged={...migrated,sections:[...migrated.sections].reverse()};
  assert.equal(normalizeLayout(rearranged,seed),rearranged);
});
