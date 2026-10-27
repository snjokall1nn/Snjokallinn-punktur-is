import images from '../content/hero-images.json' with {type:'json'};
import {selectHero} from './hero-selection.mjs';
export const heroDefaults=images.map((image,i)=>({id:'hero-'+String(i+1).padStart(2,'0'),alt:image.alt}));
const catalog=new Map(heroDefaults.map((item,i)=>[item.id,images[i]]));
export const heroSource=item=>catalog.has(item.id)?catalog.get(item.id).src:'/api/media/'+item.id;
export function heroCollection(content){return content.heroImages??heroDefaults;}
export function validateHeroImages(value){
 if(!Array.isArray(value)||value.length<1||value.length>60)throw Error('Veldu 1 til 60 forsíðumyndir.');
 const seen=new Set();return value.map(item=>{
  if(!item||typeof item.id!=='string'||(!catalog.has(item.id)&&!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(item.id))||seen.has(item.id)||typeof item.alt!=='string'||item.alt.length>500)throw Error('Ógild forsíðumynd.');
  seen.add(item.id);if(catalog.has(item.id))return {id:item.id,alt:item.alt};
  if(!Number.isInteger(item.width)||!Number.isInteger(item.height)||item.width<1||item.height<1||item.width>2200||item.height>2200)throw Error('Ógild myndstærð.');
  return {id:item.id,alt:item.alt,width:item.width,height:item.height};
 });
}
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderEditorialHero(content,last,random){
 const collection=heroCollection(content);const previous=collection.findIndex(item=>item.id===last);
 const {image:item}=selectHero(collection,previous<0?undefined:String(previous),random);
 const builtin=catalog.get(item.id);const image=builtin||item;const src=heroSource(item);
 const candidates=builtin?[
  [`/assets/hero/${item.id.slice(5)}-small.webp`,Math.min(640,image.width)],
  ...(image.width>640?[[`/assets/hero/${item.id.slice(5)}-medium.webp`,Math.min(1200,image.width)]]:[]),
  ...(image.width>1200?[[src,image.width]]:[])
 ]:[];
 const srcset=builtin?` srcset="${candidates.map(([url,width])=>escape(url)+' '+width+'w').join(', ')}" sizes="(max-width: 650px) 94vw, 50vw"`:'';
 return {id:item.id,html:`<img src="${escape(src)}"${srcset} alt="${escape(item.alt)}" width="${image.width}" height="${image.height}" fetchpriority="high" decoding="async">`};
}
