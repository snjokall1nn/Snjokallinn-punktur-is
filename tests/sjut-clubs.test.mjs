import test from 'node:test';
import assert from 'node:assert/strict';
import {createClubsApi,validateClub,escapeHtml} from '../app/sjut-clubs.mjs';
const valid={name:'Myndavélaklúbbur Hellisins',description:'Við hittumst og myndum saman.',color:'#355CFF'};
function fixture(owner=true){const objects=new Map();const bucket=()=>({async put(k,v,opts){if(objects.has(k))return null;objects.set(k,{value:JSON.parse(v),customMetadata:opts.customMetadata});return {etag:'saved'};},async list(){return {objects:[...objects.values()],truncated:false};}});return {objects,api:createClubsApi({bucket,isOwner:async()=>owner})};}
const req=(data=valid,origin='https://sjut.is')=>new Request('https://sjut.is/api/sjut-clubs',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(data)});
test('Icelandic names produce stable slugs and untrusted markup is escaped',()=>{assert.equal(validateClub({...valid,name:'Þróttheimar og Æði'}).slug,'throttheimar-og-aedi');assert.equal(escapeHtml('<script>"&'), '&lt;script&gt;&quot;&amp;');assert.throws(()=>validateClub({...valid,color:'red;'}));});
test('creation saves club durably and lists public metadata',async()=>{const {api,objects}=fixture();const response=await api(req());assert.equal(response.status,201);const data=await response.json();assert.equal(data.url,'/klubbar/myndavelaklubbur-hellisins');assert.equal(objects.size,1);const listing=await api(new Request('https://sjut.is/api/sjut-clubs'));assert.equal((await listing.json()).clubs[0].name,valid.name);});
test('duplicate slug does not overwrite an existing club',async()=>{const {api,objects}=fixture();await api(req());assert.equal((await api(req({...valid,description:'Önnur lýsing.'}))).status,409);assert.equal([...objects.values()][0].value.description,valid.description);});
test('non-owner and cross-origin creation are blocked',async()=>{assert.equal((await fixture(false).api(req())).status,403);assert.equal((await fixture().api(req(valid,'https://elsewhere.example'))).status,403);});
test('storage failure gives a recoverable error and oversized inputs are rejected',async()=>{const api=createClubsApi({bucket:()=>({list:async()=>{throw new Error('offline');}}),isOwner:async()=>true});assert.equal((await api(new Request('https://sjut.is/api/sjut-clubs'))).status,503);assert.equal((await fixture().api(req({...valid,name:'a'.repeat(101)}))).status,400);});
test('editing persists information at the same club URL and rejects visitors and foreign origins',async()=>{
 const objects=new Map();
 const bucket=()=>({get:async k=>objects.has(k)?{etag:'version-1',json:async()=>objects.get(k)}:null,put:async(k,v,o)=>{assert.equal(o.onlyIf.etagMatches,'version-1');objects.set(k,JSON.parse(v));return {etag:'version-2'};}});
 const key='sjut/clubs/test.json';objects.set(key,{...valid,slug:'test',created:'original'});
 const api=createClubsApi({bucket,isOwner:async r=>r.headers.get('X-Owner')==='yes'});
 const request=(owner=true,origin='https://sjut.is')=>new Request('https://sjut.is/api/sjut-clubs/test',{method:'PUT',headers:{Origin:origin,...(owner?{'X-Owner':'yes'}:{})},body:JSON.stringify({...valid,name:'Nýtt nafn',slug:'changed'})});
 assert.equal((await api(request(false),['test'])).status,403);
 assert.equal((await api(request(true,'https://foreign.example'),['test'])).status,403);
 assert.equal((await api(request(),['test'])).status,200);
 assert.equal(objects.get(key).name,'Nýtt nafn');assert.equal(objects.get(key).slug,'test');assert.equal(objects.get(key).created,'original');
});
