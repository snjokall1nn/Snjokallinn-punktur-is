(()=>{
 const menu=document.querySelector('.nav-more');
 menu?.addEventListener('click',e=>{if(e.target.closest('a'))menu.open=false});
 document.addEventListener('click',e=>{if(menu&&!menu.contains(e.target))menu.open=false});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.open){menu.open=false;menu.querySelector('summary').focus()}});
 for(const trigger of document.querySelectorAll('.person-open')){
  const dialog=document.getElementById(trigger.getAttribute('aria-controls'));
  trigger.onclick=()=>{dialog.showModal();document.body.classList.add('person-modal-open')};
  dialog.querySelector('.person-close').onclick=()=>dialog.close();
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
  dialog.addEventListener('close',()=>{document.body.classList.remove('person-modal-open');trigger.focus()});
 }

})();
