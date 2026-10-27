import test from 'node:test';
import assert from 'node:assert/strict';
import {createInquiryApi,RECIPIENT} from '../app/inquiry-api.mjs';
function request(body,origin='https://snjokallinn.com'){return new Request('https://snjokallinn.com/api/inquiry',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':crypto.randomUUID()},body:JSON.stringify(body)})}
test('both forms deliver only to Alex; recipient and totals cannot be injected',async()=>{
 for(const kind of ['booking','availability']){
 let sent;const records=[];const api=createInquiryApi({bucket:()=>({put:async(k,v)=>records.push(JSON.parse(v))}),fetcher:async(url,options)=>{sent={url,body:JSON.parse(options.body)};return Response.json({success:'true'})}});
 const r=await api(request({kind,recipient:'other@example.com',answers:{email:'test@example.com',name:'Prófun',people:'1',idea:'Pæling',location:'Stúdíó'},estimate:{total:1,answers:{goal:'confidence',energy:'full',timing:'evening'}}}));
 assert.equal(r.status,200);assert.equal((await r.json()).success,true);assert.equal(sent.url,`https://formsubmit.co/ajax/${RECIPIENT}`);assert.match(sent.body.Verðmat,/102\.000 kr\. með VSK/);assert.match(sent.body.Verðmat,/10 fullunnar myndir/);assert.equal(sent.body._replyto,'test@example.com');assert.equal(records.at(-1).status,'accepted');
 }
});
test('invalid fields and foreign origins never send email',async()=>{let calls=0;const api=createInquiryApi({bucket:()=>({put:async()=>{}}),fetcher:async()=>{calls++;return Response.json({success:true})}});assert.equal((await api(request({kind:'availability',answers:{email:'bad',location:'a'}}))).status,400);assert.equal((await api(request({},'https://other.example'))).status,403);assert.equal(calls,0)});
test('provider failure retains submission and does not claim success',async()=>{let record;const api=createInquiryApi({bucket:()=>({put:async(k,v)=>record=JSON.parse(v)}),fetcher:async()=>Response.json({success:false})});const r=await api(request({kind:'availability',answers:{email:'test@example.com',location:'Stúdíó'}}));assert.equal(r.status,502);assert.equal(record.status,'pending');assert.notEqual((await r.json()).success,true)});

test('a rate limit honors provider backoff without another outbound send',async()=>{let calls=0;const storage=new Map();const bucket=()=>({get:async k=>storage.has(k)?{json:async()=>JSON.parse(storage.get(k))}:null,put:async(k,v)=>storage.set(k,v)});const api=createInquiryApi({bucket,fetcher:async()=>{calls++;return Response.json({success:false},{status:429,headers:{'Retry-After':'120'}})}});const payload={kind:'availability',answers:{email:'test@example.com',location:'Stúdíó'}};const first=await api(request(payload));assert.equal(first.status,429);assert.equal((await first.json()).retrySeconds,120);assert.equal((await api(request(payload))).status,429);assert.equal(calls,1)});
test('non-text input is rejected safely',async()=>{const api=createInquiryApi({bucket:()=>({put:async()=>{}})});assert.equal((await api(request({kind:'availability',answers:{email:'test@example.com',location:12}}))).status,400)});
