import { estimateSummary } from '../public/estimate-summary.mjs';
export const RECIPIENT = 'snjokallinn@snjokallinn.com';
const limits = new Map();
const labels={idea:'Pæling',people:'Fjöldi fólks',when:'Tímasetning',location:'Staðsetning',comfort:'Stemning og leiðsögn',spotify:'Spotify',pinterest:'Pinterest',links:'Innblásturshlekkir',makeup:'Förðun',hair:'Hárgreiðsla',budget:'Budget',referral:'Hvar heyrðirðu af mér?',notes:'Annað',name:'Nafn',email:'Netfang',instagram:'Instagram'};
export function createInquiryApi({fetcher=fetch,bucket}) {
 return async function inquiry(request){
 const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
 if(request.method!=='POST')return reply({error:'Ógild aðgerð.'},405);
 const origin=new URL(request.url).origin;
 if(request.headers.get('Origin')!==origin)return reply({error:'Ógild beiðni.'},403);
 const ip=request.headers.get('CF-Connecting-IP')||'unknown';const now=Date.now();
 if(limits.size>5000)for(const [key,value]of limits)if(now-value.start>600000)limits.delete(key);
 const rate=limits.get(ip);if(rate&&now-rate.start<600000&&rate.count>=5)return reply({error:'Prófaðu aftur síðar.'},429);
 let body;try{const text=await request.text();if(text.length>20000)return reply({error:'Fyrirspurnin er of löng.'},413);body=JSON.parse(text)}catch{return reply({error:'Ógild fyrirspurn.'},400)}
 const popup=body.kind==='popup';
 const a=body.answers;
 if(!['booking','availability','popup','wedding'].includes(body.kind)||!a||typeof a.email!=='string'||a.email.length>254||!/^\S+@\S+\.\S+$/.test(a.email))return reply({error:'Netfang vantar.'},400);
 if(popup&&(typeof a.name!=='string'||!a.name.trim()||a.name.length>120||typeof a.when!=='string'||!/^21\. nóvember 2026 kl\. (11:(20|40)|1[2-4]:(00|20|40)|15:(00|20|40))$/.test(a.when)))return reply({error:'Veldu gildan óskatíma og fylltu út nafn.'},400);
 if(body.kind==='wedding'&&(typeof a.name!=='string'||!a.name.trim()||a.name.length>120))return reply({error:'Nafn vantar.'},400);
 if(body.kind==='availability'&&(typeof a.location!=='string'||!a.location.trim()||a.location.length>1500))return reply({error:'Staðsetningu vantar.'},400);
 if(body.kind==='booking'&&(typeof a.name!=='string'||typeof a.idea!=='string'||!a.name.trim()||!a.idea.trim()||!Number.isInteger(Number(a.people))||Number(a.people)<1||Number(a.people)>1000))return reply({error:'Upplýsingar vantar.'},400);
 const clean={};for(const [key,label]of Object.entries(labels)){if(a[key]!==undefined){if(typeof a[key]!=='string'||a[key].length>5000)return reply({error:'Ógild svör.'},400);clean[label]=a[key]}}
 if(rate&&now-rate.start<600000)rate.count++;else limits.set(ip,{start:now,count:1});
 const text=Object.entries(clean).map(([k,v])=>`${k}: ${v}`).join('\n');
 const estimate=body.estimate?.answers?estimateSummary(body.estimate):'Ekki valið';
 const payload={name:a.name||'Tímafyrirspurn',email:a.email,_replyto:a.email,_subject:body.kind==='wedding'?'Snjókallinn · Brúðkaupsfyrirspurn':body.kind==='booking'?'Snjókallinn · Ný sjútfyrirspurn':'Snjókallinn · Fyrirspurn um lausan tíma',_template:'table',_url:origin+'/',message:text,Myndastemning:typeof body.style?.title==='string'?body.style.title.slice(0,100):'Ekki valin',Verðmat:body.kind==='wedding'?(a.budget||'Sértilboð'):(estimate||'Ekki valið')};
 const id=crypto.randomUUID();
 const saved=()=>reply({success:true,stored:true,delivery:'pending',id},201);
 let retained=false;
 try{
 // Retain the request before delivery, including failures, so it can be recovered.
 await bucket().put(`inquiries/${id}.json`,JSON.stringify({id,createdAt:new Date().toISOString(),recipient:RECIPIENT,payload,status:'pending'}),{httpMetadata:{contentType:'application/json'}});
 retained=true;
 const cooldown=await bucket().get?.('inquiry-delivery/cooldown.json');
 const until=cooldown?(await cooldown.json()).until:0;
 if(until>Date.now())return popup?saved():reply({error:'Tímabundin bið á póstsendingu.',retrySeconds:Math.ceil((until-Date.now())/1000)},429);
 const response=await fetcher(`https://formsubmit.co/ajax/${RECIPIENT}`,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json','Referer':origin+'/'},body:JSON.stringify(payload),signal:AbortSignal.timeout(popup?2500:15000)});
 const result=await response.json();
 if(response.status===429){
 const hint=response.headers.get('Retry-After');
 const seconds=hint&&/^\d+$/.test(hint)?Math.max(60,Number(hint)):600;
 await bucket().put('inquiry-delivery/cooldown.json',JSON.stringify({until:Date.now()+seconds*1000}));
 console.error('Inquiry delivery rate limited');
 return popup?saved():reply({error:'Tímabundin bið á póstsendingu.',retrySeconds:seconds},429);
 }
 if(!response.ok||![true,'true'].includes(result.success)){console.error('Inquiry delivery rejected',JSON.stringify({status:response.status,message:String(result.message||'').slice(0,400)}));return popup?saved():reply({error:'Ekki tókst að staðfesta póstsendingu. Notaðu tölvupósthlekkinn.'},502);}
 await bucket().put(`inquiries/${id}.json`,JSON.stringify({id,createdAt:new Date().toISOString(),recipient:RECIPIENT,payload,status:'accepted'}),{httpMetadata:{contentType:'application/json'}});
 return reply({success:true,stored:true,delivery:'accepted',id});
 }catch(error){console.error('Inquiry delivery failed',error?.name||'Error');return popup&&retained?saved():reply({error:'Ekki tókst að vista eða senda fyrirspurnina.'},502)}
 };
}
