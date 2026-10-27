import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeLayout} from '../app/cms-layout.mjs';
import {validateContent} from '../app/cms-validation.mjs';
const seed=JSON.parse(fs.readFileSync(new URL('../content/seed.json',import.meta.url)));
const fields=JSON.parse(fs.readFileSync(new URL('../content/fields.json',import.meta.url)));
test('homepage migration preserves albums, hidden sections and custom copy',()=>{
 const custom={id:'12345678-1234-1234-1234-123456789abc',title:'Mitt efni',text:'Halda þessu'};
 const old={...structuredClone(seed),texts:{'work-0':'Hvað ef fólkið í tímaritunum','work-1':'Gætu verið aðeins meira eins og þú?','about-3':'Mín persónulega breyting'},sections:seed.sections.filter(s=>!['invitation','sessions'].includes(s.id)).map(s=>({...s,hidden:s.id==='about'})),extraSections:[custom]};
 old.sections.push({id:custom.id,title:custom.title,kind:'custom',hidden:false});
 const next=normalizeLayout(old,seed);
 assert.equal(next.texts['work-1'],'Þú mátt taka pláss.');assert.equal(next.texts['about-3'],'Mín persónulega breyting');
 assert.equal(next.sections.find(s=>s.id==='about').hidden,true);assert.deepEqual(next.albums,old.albums);assert.deepEqual(next.extraSections,[custom]);
 const validated=validateContent(next,new Set(fields.map(f=>f.id)),new Set(seed.sections.map(s=>s.id)));
 validated.texts['work-1']='Ný fyrirsögn frá Alex';validated.sections.reverse();
 assert.deepEqual(normalizeLayout(validated,seed),validated);
});
