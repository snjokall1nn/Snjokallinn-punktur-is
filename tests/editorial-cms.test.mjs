import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const script=fs.readFileSync(new URL('../public/cms-public.js',import.meta.url),'utf8');
const seed=JSON.parse(fs.readFileSync(new URL('../content/seed.json',import.meta.url)));
const fields=JSON.parse(fs.readFileSync(new URL('../content/fields.json',import.meta.url)));
function node(tag='DIV',dataset={}){return {tagName:tag,dataset,hidden:false,children:[],textContent:'',classList:{contains:()=>false},append(...n){this.children.push(...n)},prepend(...n){this.children.unshift(...n)},replaceChildren(...n){this.children=n},hasAttribute:()=>false};}
async function run({preview=false,texts={},hidden=false,reorder=false,custom=[]}={}){
 const title=node('H1',{cmsText:'editorial-home-2',cmsLegacy:'home-1',cmsLegacyDefault:'Sjáðu þig í nýju ljósi.'});
 const about=node(),album=node(),container=node(),main=node(),body=node();about.parentElement=main;
 body.classList.contains=c=>['direction-c','editorial-home'].includes(c);body.dataset.cmsBaseOrder=seed.sections.map(s=>s.id).join(',');
 const moves=[];main.firstChild=null;main.insertBefore=n=>{if(n===about)moves.push(n)};
 const sections=structuredClone(seed.sections);sections.find(s=>s.id==='about').hidden=hidden;sections.push(...custom.map(s=>({id:s.id,title:s.title,hidden:false,kind:'custom'})));if(reorder)sections.reverse();
 const data={...structuredClone(seed),texts,sections,extraSections:custom};
 const document={body,createElement:tag=>node(tag.toUpperCase()),createComment:()=>node(),querySelector:s=>s==='main'?main:s==='#cms-albums'?container:s==='[data-section-id="albums"]'?album:s==='[data-section-id="about"]'?about:null,querySelectorAll:s=>s==='[data-cms-text]'?[title]:[]};
 let endpoint;const errors=[];
 vm.runInNewContext(script,{document,location:{search:preview?'?preview=1':''},URLSearchParams,fetch:async url=>{endpoint=url;return {ok:true,json:async()=>preview?{content:data}:data}},console:{error:e=>errors.push(e)}});
 await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(errors,[]);
 return {endpoint,title,about,album,moves,body,main};
}
test('editorial draft preview loads private draft and preserves heading line spans',async()=>{
 const r=await run({preview:true,texts:{'editorial-home-2':'Þín hugmynd.\nMitt auga.\nOkkar myndataka.'}});
 assert.equal(r.endpoint,'/api/editor');assert.deepEqual(r.title.children.map(s=>s.textContent),['Þín hugmynd.','Mitt auga.','Okkar myndataka.']);assert.equal(r.title.children[2].className,'last-line');assert.equal(r.body.children[0].className,'cms-preview-banner');
});
test('editorial public content preserves custom legacy copy but ignores old default',async()=>{
 let r=await run({texts:{'home-1':'Sjáðu þig í nýju ljósi.'}});assert.equal(r.title.children.length,0);assert.equal(r.endpoint,'/api/content');
 r=await run({texts:{'home-1':'Mitt eigið orðalag'}});assert.equal(r.title.children[0].textContent,'Mitt eigið orðalag');
 r=await run({texts:{'home-1':'Gamalt','editorial-home-2':'Nýtt'}});assert.equal(r.title.children[0].textContent,'Nýtt');
});
test('CMS visibility, explicit reordering and added sections work without changing default composition',async()=>{
 let r=await run({hidden:true,custom:[{id:'custom',title:'Pæling',text:'Mitt efni'}]});assert.equal(r.about.hidden,true);assert.equal(r.album.hidden,true);assert.equal(r.moves.length,0);assert.equal(r.main.children[0].children[0].textContent,'Pæling');
 r=await run({reorder:true});assert.equal(r.moves.length,1);
});
test('new editorial text fields are accepted without removing any legacy fields',()=>{
 const ids=fields.map(f=>f.id);assert.equal(ids.length,new Set(ids).size);assert.ok(ids.includes('home-1'));assert.ok(ids.includes('editorial-home-2'));
});
