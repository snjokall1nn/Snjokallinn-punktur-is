const visualOverrides=document.createElement('link');visualOverrides.rel='stylesheet';visualOverrides.href='overrides.css';document.head.appendChild(visualOverrides);const cropV2=document.createElement('link');cropV2.rel='stylesheet';cropV2.href='crop-v2.css';document.head.appendChild(cropV2);
const nav=document.querySelector('.nav');
addEventListener('scroll',()=>nav?.classList.toggle('scrolled',scrollY>40));
const menu=document.querySelector('.menu');
const navlinks=document.querySelector('.navlinks');
function closeMenu(){navlinks?.classList.remove('open');menu?.setAttribute('aria-expanded','false');menu?.setAttribute('aria-label','Opna valmynd')}
menu?.addEventListener('click',()=>{const open=navlinks?.classList.toggle('open');menu.setAttribute('aria-expanded',String(Boolean(open)));menu.setAttribute('aria-label',open?'Loka valmynd':'Opna valmynd')});
navlinks?.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu()});
document.querySelectorAll('form.waitlist-form').forEach(form=>form.addEventListener('submit',event=>{
  event.preventDefault();
  if(!form.reportValidity())return;
  const data=new FormData(form);
  const email=String(data.get('email')||'').trim();
  const name=String(data.get('name')||'').trim();
  const future=data.get('future')?'Já':'Nei';
  const destination=form.dataset.mailto||'snjokallinn@snjokallinn.com';
  const subject=encodeURIComponent('Biðlisti: Myndir fyrir Ömmu');
  const body=encodeURIComponent(`Sæl\n\nMig langar að fá að vita þegar bókun opnar í næsta Myndir fyrir Ömmu pop-up.\n\nNafn: ${name||'Ekki gefið upp'}\nNetfang: ${email}\nLáta vita af fleiri pop-upum: ${future}\n`);
  const status=form.querySelector('.form-status');
  if(status)status.textContent='Póstforritið þitt opnast núna. Sendu póstinn til að klára skráninguna.';
  window.location.href=`mailto:${destination}?subject=${subject}&body=${body}`;
}));
document.querySelectorAll('.popup-request-form').forEach(form=>form.addEventListener('submit',async event=>{
 event.preventDefault();if(!form.reportValidity()||form.dataset.sent==='true')return;
 const d=new FormData(form),name=String(d.get('name')||'').trim(),email=String(d.get('email')||'').trim(),time=String(d.get('time')||''),payment=String(d.get('payment')||''),kennitala=String(d.get('kennitala')||'').trim();
 const text=`Myndir fyrir Ömmu · Spöngin · 21. nóvember 2026\nÓskatími: ${time}\nGreiðsluósk: ${payment}${kennitala?'\nKennitala fyrir reikning: '+kennitala:''}\nVerð: 15.000 kr.\nTímaósk sem Alex staðfestir handvirkt.`,button=form.querySelector('button[type="submit"]'),status=form.querySelector('.form-status'),fallback=form.querySelector('.request-fallback');
 fallback.href=`mailto:snjokallinn@snjokallinn.com?subject=${encodeURIComponent('Tímaósk · Myndir fyrir Ömmu · '+time)}&body=${encodeURIComponent(text+'\nNafn: '+name+'\nNetfang: '+email)}`;
 button.disabled=true;status.textContent='Sendi tímaóskina þína…';fallback.hidden=true;
 try{const response=await fetch('/api/inquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'popup',answers:{name,email,when:'21. nóvember 2026 kl. '+time,location:'Borgarbókasafnið Spönginni',notes:text},style:{title:'Myndir fyrir Ömmu · tímaósk'}}),signal:AbortSignal.timeout(20000)});const result=await response.json();if(!response.ok||result.success!==true)throw Error('delivery');form.dataset.sent='true';status.textContent=`Takk, ${name}! Tímaóskin þín er móttekin og vistuð. Alex hefur samband á ${email} og staðfestir tímann. Engin greiðsla hefur farið fram.`;button.textContent='Tímaósk móttekin ✓';form.querySelectorAll('input,select').forEach(el=>el.disabled=true);
 }catch{status.textContent='Ekki tókst að staðfesta sendingu. Upplýsingarnar þínar eru enn hér. Sendu tímaóskina með tölvupósthlekknum hér að neðan.';fallback.hidden=false;button.disabled=false;}
}));
