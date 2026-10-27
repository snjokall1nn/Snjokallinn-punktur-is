import test from 'node:test';
import assert from 'node:assert/strict';
import {createInquiryApi} from '../app/inquiry-api.mjs';
const body={kind:'popup',answers:{name:'Prófun',email:'test@example.test',when:'21. nóvember 2026 kl. 11:20',notes:'Greiða á staðnum'}};
const req=()=>new Request('https://example.test/api/inquiry',{method:'POST',headers:{Origin:'https://example.test','CF-Connecting-IP':crypto.randomUUID()},body:JSON.stringify(body)});
for(const mode of ['rate-limit','timeout','cooldown'])test('popup remains received after '+mode,async()=>{
 const records=[];let calls=0;
 const api=createInquiryApi({bucket:()=>({put:async(k,v)=>records.push({k,v:JSON.parse(v)}),get:async()=>mode==='cooldown'?{json:async()=>({until:Date.now()+60000})}:null}),fetcher:async()=>{calls++;if(mode==='timeout')throw new DOMException('timeout','TimeoutError');return Response.json({success:false},{status:429})}});
 const r=await api(req()),data=await r.json();assert.equal(r.status,201);assert.equal(data.stored,true);assert.equal(data.delivery,'pending');assert.ok(records.some(x=>x.k.startsWith('inquiries/')));assert.equal(calls,mode==='cooldown'?0:1);
});
test('failed durable save is never acknowledged',async()=>{let calls=0;const api=createInquiryApi({bucket:()=>({put:async()=>{throw Error('storage unavailable')}}),fetcher:async()=>{calls++}});const r=await api(req());assert.equal(r.status,502);assert.notEqual((await r.json()).success,true);assert.equal(calls,0)});
