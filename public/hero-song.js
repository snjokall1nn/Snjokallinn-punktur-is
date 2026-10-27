(()=>{
 const title=document.querySelector('#hero-title');
 if(!title)return;
 const audio=new Audio('/assets/audio/i-am-woman.mp3');
 audio.preload='none';audio.volume=.7;
 const player=document.createElement('div');player.className='hero-song-player';player.hidden=true;
 player.innerHTML='<div><strong>I AM WOMAN</strong><span>Emmy Meli</span></div><button type="button" class="hero-song-pause" aria-label="Setja lag á pásu">Ⅱ</button><button type="button" class="hero-song-stop" aria-label="Stöðva lag">✕</button><span class="hero-song-status" role="status"></span>';
 (document.querySelector('.music-dock')||document.body).prepend(player);
 const pause=player.querySelector('.hero-song-pause'),status=player.querySelector('.hero-song-status');
 function sync(){
  const playing=!audio.paused;
  pause.textContent=playing?'Ⅱ':'▶';
  pause.setAttribute('aria-label',playing?'Setja lag á pásu':'Halda áfram að spila');
  const button=title.querySelector('.hero-song-trigger');
  if(button){button.setAttribute('aria-pressed',String(playing));button.setAttribute('aria-label',playing?'Setja I AM WOMAN á pásu':'Spila I AM WOMAN eftir Emmy Meli')}
 }
 async function play(){
  window.dispatchEvent(new Event('snjo-song-start'));
  player.hidden=false;status.textContent='';
  try{await audio.play()}catch{status.textContent='Ekki tókst að spila lagið. Ýttu aftur til að reyna.'}
  sync();
 }
 function toggle(){if(audio.paused)play();else audio.pause()}
 function stop(){audio.pause();audio.currentTime=0;player.hidden=true;status.textContent='';sync()}
 function decorate(){
  if(title.querySelector('.hero-song-trigger'))return;
  const walker=document.createTreeWalker(title,NodeFilter.SHOW_TEXT);
  let node;
  while((node=walker.nextNode())){
   const match=node.textContent.match(/nýju ljósi\.?/);
   if(!match)continue;
   const before=node.textContent.slice(0,match.index),after=node.textContent.slice(match.index+match[0].length);
   const button=document.createElement('button');button.type='button';button.className='hero-song-trigger';button.textContent=match[0];button.addEventListener('click',toggle);
   node.replaceWith(document.createTextNode(before),button,document.createTextNode(after));sync();break;
  }
 }
 pause.addEventListener('click',toggle);player.querySelector('.hero-song-stop').addEventListener('click',stop);
 audio.addEventListener('play',sync);audio.addEventListener('pause',sync);audio.addEventListener('ended',stop);
 audio.addEventListener('error',()=>{status.textContent='Ekki tókst að hlaða laginu.';sync()});
 window.addEventListener('snjo-spotify-start',stop);
 decorate();new MutationObserver(decorate).observe(title,{childList:true,subtree:true});
})();
