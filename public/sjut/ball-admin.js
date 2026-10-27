const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time=i=>{const m=1200+i*10;return Math.floor(m/60)+':'+String(m%60).padStart(2,'0')},slot=i=>time(i)+'-'+time(i+1);
let state;
async function api(path,body,method='POST'){
 const r=await fetch('/api/6uball/'+path,{method,headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 const d=await r.json();if(!r.ok){if(r.status===403)location.assign('/admin/login?next=/admin/ball');throw Error(d.error||'Ekki tókst að vista.');}return d;
}
function photo(e,pending){return `<article><img class="card-image" src="/api/6uball/entry/${encodeURIComponent(e.id)}" alt="Innsending eftir ${esc(e.name)}"><h3>${esc(e.name)}</h3>${pending?`<button data-approve="${esc(e.id)}">Birta mynd</button>`:''} <button class="secondary" data-delete="${esc(e.id)}">Fjarlægja mynd</button></article>`;}
async function refresh(){
 state=await api('admin-state',null,'GET');
 $('#people').innerHTML=state.people.length?state.people.map(p=>`<article class="person"><div class="person-heading">${p.portrait_mime?`<img class="portrait" src="/api/6uball/portrait/${encodeURIComponent(p.id)}" alt="Sjálfsmynd ${esc(p.name)}">`:''}<div><h3>${esc(p.name)}</h3><p>${esc(p.center)}</p></div></div><label>Myndavélatími<select data-assign="${esc(p.id)}"><option value="" ${p.slot===null?'selected':''}>Biðlisti</option>${Array.from({length:12},(_,i)=>`<option value="${i}" ${p.slot===i?'selected':''} ${state.schedule.some(x=>x.slot===i&&x.id!==p.id)?'disabled':''}>${slot(i)}</option>`).join('')}</select></label>${p.slot!==null?`<button data-handed="${esc(p.id)}" data-value="${p.handed?0:1}">${p.handed?'Vél skilað · merkja óskilað':'Merkja vél skilað'}</button>`:''}</article>`).join(''):'<p>Engar skráningar enn. Tímaval birtist við hvert nafn þegar áhugi er skráður.</p>';
 $('#pending').innerHTML=state.pending.length?state.pending.map(e=>photo(e,true)).join(''):'<p>Engar myndir bíða staðfestingar.</p>';
 $('#approved').innerHTML=state.hall.length?state.hall.map(e=>photo(e,false)).join(''):'<p>Engar birtar myndir enn.</p>';
 $('#message').textContent='Skráningar uppfærðar.';
}
async function action(button,work){button.disabled=true;try{await work();await refresh();$('#message').textContent='Breyting vistuð.';}catch(e){$('#message').textContent=e.message;}finally{button.disabled=false;}}
document.addEventListener('change',e=>{const b=e.target;if(b.dataset.assign)action(b,()=>api('assign',{id:b.dataset.assign,slot:b.value===''?null:Number(b.value)}));});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.handed)action(b,()=>api('handed',{id:b.dataset.handed,handed:Number(b.dataset.value)}));
 if(b.dataset.approve)action(b,()=>api('entry/'+b.dataset.approve,{}));
 if(b.dataset.delete&&confirm('Fjarlægja þessa mynd?'))action(b,()=>api('entry/'+b.dataset.delete,null,'DELETE'));
});
$('#refresh').onclick=()=>refresh().catch(e=>$('#message').textContent=e.message);
refresh().catch(e=>$('#message').textContent=e.message);
