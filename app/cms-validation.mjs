import {validateHeroImages} from './editorial-hero.mjs';
export const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
export function validateContent(input, fieldIds, sectionIds) {
  const fail = () => { throw new Error('Ógilt efni.'); };
  if (!input || input.schema !== 1 || !Number.isInteger(input.revision) || input.revision < 0) fail();
  const str = (v, max) => { if (typeof v !== 'string' || v.length > max) fail(); return v; };
  if (!Array.isArray(input.albums) || input.albums.length > 100) fail();
  const ids = new Set();
  const albums = input.albums.map(a => {
    if (!UUID.test(a.id) || ids.has(a.id)) fail(); ids.add(a.id);
    if (!Array.isArray(a.images) || a.images.length > 500) fail();
    const imageIds = new Set();
    const images = a.images.map(i => {
      if (!UUID.test(i.id) || imageIds.has(i.id)) fail(); imageIds.add(i.id);
      return {id:i.id, alt:str(i.alt,500), caption:str(i.caption,1000)};
    });
    if (a.cover && !imageIds.has(a.cover)) fail();
    return {id:a.id,title:str(a.title,150),description:str(a.description,3000),hidden:!!a.hidden,cover:a.cover || images[0]?.id || '',images};
  });
  if (!input.texts || typeof input.texts !== 'object' || Array.isArray(input.texts)) fail();
  const texts = {};
  for (const [k,v] of Object.entries(input.texts)) { if (!fieldIds.has(k)) fail(); texts[k]=str(v,5000); }
  if (!Array.isArray(input.extraSections) || input.extraSections.length > 20) fail();
  const extraSections = input.extraSections.map(s => { if (!UUID.test(s.id)) fail(); return {id:s.id,title:str(s.title,150),text:str(s.text,5000)}; });
  const allowed = new Set([...sectionIds,...extraSections.map(s=>s.id)]);
  if (!Array.isArray(input.sections) || input.sections.length !== allowed.size) fail();
  const seen = new Set();
  const sections = input.sections.map(s => {
    if (!allowed.has(s.id) || seen.has(s.id)) fail(); seen.add(s.id);
    return {id:s.id,title:str(s.title,150),hidden:!!s.hidden,kind:sectionIds.has(s.id)?(s.id==='albums'?'albums':'existing'):'custom'};
  });
  return {schema:1,revision:input.revision,albums,texts,sections,extraSections,updatedAt:input.updatedAt || null,...(input.heroImages!==undefined?{heroImages:validateHeroImages(input.heroImages)}:{})};
}
export function imageType(bytes) {
  if (bytes[0]===255 && bytes[1]===216 && bytes[2]===255) return 'image/jpeg';
  if ([137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b)) return 'image/png';
  if (String.fromCharCode(...bytes.slice(0,4))==='RIFF' && String.fromCharCode(...bytes.slice(8,12))==='WEBP') return 'image/webp';
  return null;
}
