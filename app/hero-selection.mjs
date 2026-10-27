export function selectHero(images,last,random=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296){
  const previous=/^\d+$/.test(last||'')?Number(last):-1;
  const candidates=images.map((image,index)=>({image,index})).filter(item=>images.length<2||item.index!==previous);
  if(!candidates.length)throw new Error('No hero images');
  return candidates[Math.floor(random()*candidates.length)];
}
