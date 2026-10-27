// Update approved package prices and inclusions here. No draft amount is charged.
const packages=[{name:'Litla bumban',time:'30 mínútur',price:39900,description:'Fyrir þau sem vilja nokkrar fallegar minningar.',items:['4 fullunnar myndir','Eitt umhverfi og einföld uppsetning','Persónulegt myndaval í netgalleríi']},{name:'Bumbumyndatakan',time:'60-75 mínútur',price:65000,description:'Mín uppáhaldsleið. Njóttu stundarinnar og prófaðu fleiri hugmyndir.',items:['10 fullunnar myndir','Ein staðsetning; inni og úti í nærumhverfi eftir aðstæðum','Maki, börn og gæludýr velkomin','Persónulegur undirbúningur og myndaval']},{name:'Bumban & allt hitt',time:'Allt að 120 mínútur',price:89000,description:'Fyrir þau sem vilja gera meira úr myndatökunni.',items:['20 fullunnar myndir','Fleiri uppsetningar og fataskipti','Rými til að prófa listrænar hugmyndir','Undirbúningur og persónulegt myndaval']}];
const price=p=>p.price===null?'Verð væntanlegt':`${String(p.price).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} kr.`;
let chosen=null;const answers=[];let step=0;
let generatedIntro='';
function prefillInquiry(){
 const field=document.querySelector('#inquiry textarea[name="message"]');
 const personalText=generatedIntro && field.value.startsWith(generatedIntro)?field.value.slice(generatedIntro.length).replace(/^\n+/, ''):field.value;
 const p=packages[chosen];
 generatedIntro=`Mig langar að spjalla um pakkann „${p.name}“ (${price(p)} með VSK).\n${p.time} · ${p.items[0]}\n`;
 if(answers.length===questions.length)generatedIntro+='\nPælingarnar mínar:\n'+answers.map((a,i)=>`${questions[i].title} ${questions[i].options[a]}`).join('\n')+'\n';
 field.value=generatedIntro+'\n'+personalText;
 field.rows=answers.length===questions.length?12:6;
}

const questions=[{title:'Hver kemur með í myndina?',options:['Ég ein/n','Ég og maki','Bæði sóló og saman']},{title:'Hvar sérðu þig fyrir þér?',options:['Í stúdíói','Úti í náttúrunni','Mig langar að skoða bæði']},{title:'Hvað heillar þig mest?',options:['Róleg og falleg upplifun','Mikið úrval mynda','Klassískar minningar','Listræn og editorial stemning']},{title:'Hversu mikið rými viltu?',options:['Einfalt og fallegt','Aðeins meira svigrúm','Fulla upplifun']},{title:'Hvernig viltu njóta myndanna?',options:['Í netgalleríi','Mig langar líka í prent','Mig langar að skoða albúm']}];
function recommend(a){return a[3]===2?2:a[3]===1?1:0}
const quiz=document.querySelector('#quiz');
function draw(){if(step===questions.length){chosen=recommend(answers);const p=packages[chosen];quiz.innerHTML=`<p class="eyebrow">ÞÍN PAKKATILLAGA</p><h3>${p.name}</h3><p>${p.description}</p><p class="price">${price(p)}</p><p class="small">${p.time} · Verð með VSK. Stúdíóleiga, lengri akstur og prentaðar vörur eru sér.</p><ul class="result-inclusions">${p.items.map(item=>`<li>${item}</li>`).join('')}</ul><p class="small" style="margin-top:15px">${answers[1]===2?'Þú vilt skoða bæði stúdíó og útimyndir. Við finnum útfærslu og verð fyrir það saman.':'Staðsetning og óskir þínar fylgja með fyrirspurninni.'}</p><div class="actions"><a class="button" id="quiz-inquiry" href="#fyrirspurn">Spjöllum um þennan ↗</a><button class="quiet" id="restart">Byrja aftur</button></div>`;document.querySelector('#quiz-inquiry').onclick=prefillInquiry;document.querySelector('#restart').onclick=()=>{step=0;answers.length=0;chosen=null;draw()};return}const q=questions[step];quiz.innerHTML=`<p class="eyebrow">${String(step+1).padStart(2,'0')} / 05</p><div class="progress"><span style="width:${(step+1)*20}%"></span></div><h3>${q.title}</h3><div class="options">${q.options.map((o,i)=>`<button class="option ${answers[step]===i?'selected':''}" data-answer="${i}">${o} ↗</button>`).join('')}</div><div class="quiz-bottom">${step?'<button class="quiet" id="back">← Til baka</button>':'<span></span>'}<span class="small">Engin skráning. Engin skuldbinding.</span></div>`;quiz.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{answers[step]=Number(b.dataset.answer);step++;draw()});const back=document.querySelector('#back');if(back)back.onclick=()=>{step--;draw()}}
draw();document.querySelector('#packages').innerHTML=packages.map((p,i)=>`<article class="package"><p class="eyebrow">0${i+1} · ${p.time}</p><h3>${p.name}</h3><p>${p.description}</p><div class="price">${price(p)}</div><ul>${p.items.map(x=>`<li>${x}</li>`).join('')}</ul><a href="#fyrirspurn" data-package="${i}">Spjöllum um þennan pakka ↗</a></article>`).join('');document.querySelectorAll('[data-package]').forEach(a=>a.onclick=()=>{chosen=Number(a.dataset.package);prefillInquiry()});
document.querySelector('#inquiry').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);const body=`Hæ Alex!\n\n${f.get('message')}\n\n${f.get('name')}\n${f.get('email')}`;window.location.href='mailto:snjokallinn@snjokallinn.com?subject='+encodeURIComponent('Bumbumyndataka · fyrirspurn')+'&body='+encodeURIComponent(body)};
const modal=document.querySelector('#lightbox');document.querySelectorAll('[data-photo]').forEach(b=>b.onclick=()=>{const img=modal.querySelector('img');img.src='/bumba-assets/'+b.dataset.photo+'.webp';img.alt=b.querySelector('img').alt;modal.showModal()});document.querySelector('#close-photo').onclick=()=>modal.close();modal.onclick=e=>{if(e.target===modal)modal.close()};

// Mobile package navigation: native touch scrolling, without automatic movement.
const packageTrack=document.querySelector('#packages');
const packageCards=[...packageTrack.querySelectorAll('.package')];
const dotNav=document.querySelector('.package-dots');
packageCards.forEach((card,i)=>{
 card.id='bumba-package-'+i;
 const dot=document.createElement('button');dot.type='button';dot.className='package-dot';dot.setAttribute('aria-label','Skoða '+packages[i].name);dot.setAttribute('aria-controls',card.id);dot.setAttribute('aria-current',String(i===0));
 dot.onclick=()=>packageTrack.scrollTo({left:card.offsetLeft-packageTrack.offsetLeft-(packageTrack.clientWidth-card.offsetWidth)/2,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});dotNav.append(dot);
});
let packageScrollQueued=false;
packageTrack.addEventListener('scroll',()=>{if(packageScrollQueued)return;packageScrollQueued=true;requestAnimationFrame(()=>{packageScrollQueued=false;const center=packageTrack.getBoundingClientRect().left+packageTrack.clientWidth/2;let closest=0;let distance=Infinity;packageCards.forEach((card,i)=>{const r=card.getBoundingClientRect();const d=Math.abs(r.left+r.width/2-center);if(d<distance){closest=i;distance=d}});dotNav.querySelectorAll('button').forEach((d,i)=>d.setAttribute('aria-current',String(i===closest)));})},{passive:true});
const mobileLink=document.querySelector('.mobile-package-link');
const visibility=new IntersectionObserver(entries=>{entries.forEach(entry=>{entry.target.dataset.inViewport=String(entry.isIntersecting)});mobileLink.classList.toggle('is-hidden',[document.querySelector('#verd'),document.querySelector('#fyrirspurn')].some(el=>el.dataset.inViewport==='true'));},{threshold:0});
visibility.observe(document.querySelector('#verd'));visibility.observe(document.querySelector('#fyrirspurn'));
