(()=>{'use strict';
// Keep existing links from service pages and bookmarks connected to the same forms.
const legacy=new Set(['#verd','#prent','#algengar-spurningar','#fyrirspurn','#myndakviss','#reiknivel','#undirbuningur','#undirbuningslisti','#leidari']);
if(legacy.has(location.hash)){location.replace('/sjut-og-verd'+location.hash);return;}
const dialog=document.querySelector('.photo-dialog'),photo=dialog.querySelector('img'),caption=dialog.querySelector('.photo-caption'),count=dialog.querySelector('.photo-count');
const buttons=[...document.querySelectorAll('.photo-open')];let index=0,trigger,activeButtons=buttons;
function paint(){const im=activeButtons[index].querySelector('img');photo.src=im.src;photo.alt=im.alt;caption.textContent=im.alt;count.textContent=`${index+1} / ${activeButtons.length}`;}
function advance(step){index=(index+step+activeButtons.length)%activeButtons.length;paint();}
buttons.forEach((button,i)=>button.addEventListener('click',()=>{trigger=button;activeButtons=buttons.filter(item=>(item.dataset.gallery||'portfolio')===(button.dataset.gallery||'portfolio'));index=activeButtons.indexOf(button);paint();dialog.showModal();document.body.classList.add('modal-open');}));
dialog.querySelector('.photo-prev').onclick=()=>advance(-1);dialog.querySelector('.photo-next').onclick=()=>advance(1);
dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();advance(-1);}if(event.key==='ArrowRight'){event.preventDefault();advance(1);}});
const videoDialog=document.querySelector('.video-dialog'),video=videoDialog.querySelector('video');
document.querySelector('.video-open').onclick=event=>{trigger=event.currentTarget;video.src='/assets/draw.mp4';videoDialog.showModal();document.body.classList.add('modal-open');video.play().catch(()=>{});};
for(const modal of [dialog,videoDialog]){modal.querySelector('.dialog-close').onclick=()=>modal.close();modal.addEventListener('click',event=>{if(event.target===modal){const r=modal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)modal.close();}});modal.addEventListener('close',()=>{if(modal===videoDialog){video.pause();video.removeAttribute('src');video.load();}document.body.classList.remove('modal-open');trigger?.focus();});}
})();
