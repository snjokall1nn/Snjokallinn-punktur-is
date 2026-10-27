(()=>{
 for(const gallery of document.querySelectorAll('.testimonial-gallery')){
  const photos=JSON.parse(gallery.dataset.photos),img=gallery.querySelector('img'),prev=gallery.querySelector('button.testimonial-prev'),next=gallery.querySelector('button.testimonial-next'),segments=[...gallery.querySelectorAll('.testimonial-progress i')],counter=gallery.querySelector('.testimonial-counter');
  let index=0,start;
  function advance(delta){
   index=(index+delta+photos.length)%photos.length;
   const p=photos[index];img.src=p.src;img.alt=p.alt;img.width=p.width;img.height=p.height;
   counter.textContent=(index+1)+' / '+photos.length;
   segments.forEach((s,i)=>s.classList.toggle('active',i<=index));
   const preload=new Image();preload.src=photos[(index+1)%photos.length].src;
  }
  prev.hidden=next.hidden=false;
  prev.onclick=()=>advance(-1);next.onclick=()=>advance(1);
  gallery.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();advance(e.key==='ArrowRight'?1:-1)}});
  gallery.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')start={x:e.clientX,y:e.clientY}});
  gallery.addEventListener('pointerup',e=>{
   if(!start)return;
   const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;
   if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)){e.preventDefault();advance(dx<0?1:-1);gallery.dataset.swiped='1';setTimeout(()=>delete gallery.dataset.swiped,400)}
  });
  gallery.addEventListener('pointercancel',()=>start=null);
  gallery.addEventListener('click',e=>{
   if(gallery.dataset.swiped){e.preventDefault();e.stopImmediatePropagation()}
  },true);
 }
})();
