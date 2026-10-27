import {monthlyPinterest, inquiryEndpoint, inquiryRecipient} from './booking-config.mjs';
import {estimateSummary,inquiryBody} from './estimate-summary.mjs';
import { packageEstimate } from './package-inquiry.mjs';
const form=document.querySelector('#inquiry-form');
const steps=[...form.querySelectorAll('[data-booking-step]')];
let step=0;
const section=document.querySelector('#undirbuningslisti');
function summary(){
 const estimate=window.shootEstimate;
 document.querySelector('#booking-summary').textContent=`Myndastemning: ${window.shootStyle?.title||'Ekki valin'}. ${estimateSummary(estimate)} Endanlegt verð og tími eru staðfest í samtali við Alex.`;
}
function showStep(index){
 step=index;
 steps.forEach((el,i)=>el.hidden=i!==step);
 document.querySelector('#booking-progress').textContent=`Skref ${step+1} af ${steps.length}`;
 document.querySelector('#booking-back').disabled=step===0;
 document.querySelector('#booking-next').hidden=step===steps.length-1;
 document.querySelector('#booking-send').hidden=step!==steps.length-1;
 summary();
 steps[step].querySelector('input,textarea')?.focus({preventScroll:true});
}
function validateStep(){
 const fields=[...steps[step].querySelectorAll('input,textarea')];
 const other=document.querySelector('#other-links');
 other.setCustomValidity('');
 if(step===2 && other.value.trim().split(/\n/).filter(Boolean).some(s=>{try{return !['https:','http:'].includes(new URL(s.trim()).protocol)}catch{return true}}))other.setCustomValidity('Settu einn heilan http- eða https-hlekk í hverja línu.');
 for(const field of fields){if(field.required&&!field.value.trim()){field.setCustomValidity('Vinsamlegast fylltu þennan reit út.')}else if(field!==other){field.setCustomValidity('')};if(!field.reportValidity())return false;}
 return true;
}
document.querySelector('#booking-next').addEventListener('click',()=>{if(validateStep())showStep(step+1)});
document.querySelector('#booking-back').addEventListener('click',()=>showStep(Math.max(0,step-1)));
form.noValidate=true;
form.addEventListener('input',e=>e.target.setCustomValidity?.(''));
window.addEventListener('shoot-estimate',summary);
function openBooking(){
 section.hidden=false;summary();
 section.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 steps[step].querySelector('input,textarea')?.focus({preventScroll:true});
}
document.querySelectorAll('a[href="#undirbuningslisti"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();history.replaceState(null,'','#undirbuningslisti');openBooking()}));
window.addEventListener('open-booking-draft',openBooking);
function openHash(){if(location.hash==='#undirbuningslisti')openBooking();if(location.hash==='#leidari'){document.querySelector('#leidari').hidden=false;document.querySelector('#leidari').scrollIntoView()}}
window.addEventListener('hashchange',openHash);
openHash();
export async function sendInquiry(payload, status, button, fallbackSelector){
 if(!inquiryEndpoint){status.textContent='Bein sending er ekki virk í þessari vinnuútgáfu. Ekkert hefur verið sent; svörin þín eru enn hér.';return false;}
 const fallback=document.querySelector(fallbackSelector || (payload.kind==='booking'?'#booking-email-fallback':'#availability-email-fallback'));
 const body=inquiryBody(payload);
 const options=fallback.parentElement;
 fallback.href=`mailto:${inquiryRecipient}?subject=${encodeURIComponent('Fyrirspurn frá Snjókallinn-vefnum')}&body=${encodeURIComponent(body)}`;
 options.hidden=true;
 options.querySelector('.copy-inquiry-answers').onclick=async()=>{try{await navigator.clipboard.writeText(body);status.textContent='Svörin eru afrituð. Límdu þau í tölvupóst til snjokallinn@snjokallinn.com.'}catch{status.textContent='Ekki tókst að afrita. Notaðu tölvupósthnappinn hér að neðan.'}};
 let sent=false, retrySeconds=0;
 button.disabled=true;status.textContent='Sendi fyrirspurnina…';
 try{
  const response=await fetch(inquiryEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,recipient:inquiryRecipient}),signal:AbortSignal.timeout(20000)});
  const result=await response.json();
  if(!response.ok||result.success!==true){const error=new Error('Rejected');error.retrySeconds=result.retrySeconds;throw error;}
  sent=true;status.dataset.state='success';status.textContent=`Takk fyrir! Fyrirspurnin er send til Alex. Hann fer yfir ${payload.kind==='booking'?'pælinguna þína':'tímana sem gætu hentað'} og svarar á ${payload.answers.email}. Þú þarft ekki að senda aftur. Bókun er staðfest þegar þið hafið samið um tíma.`;button.textContent='Fyrirspurn send ✓';
  return true;
 }catch(error){options.hidden=false;status.dataset.state='error';status.textContent='Ekki tókst að senda sjálfvirkt. Svörin þín eru enn hér. Sendu þau til Alex með tölvupósthnappnum hér að neðan eða afritaðu þau.';if(error.retrySeconds){retrySeconds=error.retrySeconds;button.disabled=true;setTimeout(()=>{button.disabled=false},error.retrySeconds*1000)}return false;}
 finally{if(sent)button.disabled=true;else if(!retrySeconds)button.disabled=false;}

}
form.addEventListener('submit',async e=>{
 e.preventDefault();if(step<steps.length-1){if(validateStep())showStep(step+1);return;}
 for(let i=0;i<steps.length;i++){for(const field of steps[i].querySelectorAll('input,textarea')){if(field.required&&!field.value.trim())field.setCustomValidity('Vinsamlegast fylltu þennan reit út.');if(!field.checkValidity()){showStep(i);field.reportValidity();return;}}}
 showStep(steps.length-1);
 await sendInquiry({kind:'booking',answers:Object.fromEntries(new FormData(form)),style:window.shootStyle,estimate:window.shootEstimate},document.querySelector('#form-status'),document.querySelector('#booking-send'));
});
const dialog=document.querySelector('#availability-dialog');let opener;
const shortForms=[document.querySelector('#quick-form'),document.querySelector('#availability-form')];
let shortEstimate=null;
function syncShortForms(){
 for(const short of shortForms){
  const prefix=short.id.replace('-form','');
  short.elements.package.value=shortEstimate?.packageId==='custom'?'':shortEstimate?.packageId || '';
  document.querySelector('#'+prefix+'-summary').textContent=shortEstimate ? estimateSummary(shortEstimate) : 'Þú mátt vera óákveðin/n um pakkann.';
 }
}
function resetShortStatus(){
 for(const short of shortForms){
  const button=short.querySelector('[type="submit"]');button.disabled=false;button.textContent='Spyrja Alex um tíma';
  short.querySelector('.form-status').textContent='';short.querySelector('.delivery-alternatives').hidden=true;
 }
}
function openShort(button,packageId){
 opener=button;
 if(packageId){shortEstimate=packageEstimate(packageId);resetShortStatus();}
 else if(!shortEstimate && window.shootEstimateSelected){shortEstimate=window.shootEstimate;}
 syncShortForms();dialog.showModal();
}
document.addEventListener('click',event=>{
 const button=event.target.closest('.availability-open,.package-inquiry');
 if(button){openShort(button,button.dataset.packageId);}
});
document.querySelector('.availability-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>opener?.focus());
for(const short of shortForms){
 short.elements.package.addEventListener('change',()=>{shortEstimate=packageEstimate(short.elements.package.value);resetShortStatus();syncShortForms();});
 short.addEventListener('submit',async event=>{
  event.preventDefault();if(!short.reportValidity())return;
  const prefix=short.id.replace('-form','');
  await sendInquiry({kind:'availability',answers:Object.fromEntries(new FormData(short)),style:window.shootStyle,estimate:shortEstimate},document.querySelector('#'+prefix+'-status'),short.querySelector('[type="submit"]'),'#'+prefix+'-email-fallback');
 });
}
window.addEventListener('shoot-estimate',()=>{shortEstimate=window.shootEstimate;syncShortForms();});
const initialPackage=new URLSearchParams(location.search).get('pakki');
if(initialPackage)shortEstimate=packageEstimate(initialPackage);
syncShortForms();
if(monthlyPinterest){
 try { const url=new URL(monthlyPinterest);if(url.protocol==='https:'){
  const link=document.querySelector('#monthly-pinterest');link.href=url.href;link.target='_blank';link.rel='noopener';link.removeAttribute('aria-disabled');document.querySelector('#monthly-note').hidden=true;
 }}catch{}
}
summary();
