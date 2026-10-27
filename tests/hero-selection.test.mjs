import test from 'node:test';
import assert from 'node:assert/strict';
import { selectHero } from '../app/hero-selection.mjs';
const photos=[{src:'a'},{src:'b'},{src:'c'}];
test('reopening excludes the previous hero throughout the random range',()=>{for(let previous=0;previous<3;previous++)for(const random of [0,.2,.5,.9999])assert.notEqual(selectHero(photos,String(previous),()=>random).index,previous)});
test('first visits and invalid cookie values select from the complete collection',()=>{for(const cookie of [undefined,'garbage','999','-1']){assert.equal(selectHero(photos,cookie,()=>0).index,0);assert.equal(selectHero(photos,cookie,()=>.9999).index,2)}});
