import {packages,money,recommendation} from './pricing.mjs';
export function estimateSummary(estimate){
 if(!estimate?.answers)return 'Verðmat ekki valið. Við finnum umfangið saman.';
 const result=recommendation(estimate.answers),chosen=packages[result.packageId];
 if(result.total===null)return 'Sérsniðið verkefni · Tilboð eftir umfangi, með VSK.';
 const timing=estimate.answers.timing==='evening'?'Kvöld eða helgi':'Virkur dagur fyrir kl. 17';
 const additions=result.additions.filter(x=>!x.label.startsWith('Kvöld')).map(x=>x.label);
 return [chosen.name,chosen.duration,chosen.images,"3 prent · 10 × 15 cm",timing,...additions,`${money(result.total)} með VSK`].join(' · ');
}
export function inquiryBody(payload){
 const labels={idea:'Pæling',people:'Fjöldi fólks',when:'Tímasetning',location:'Staðsetning',comfort:'Stemning og leiðsögn',spotify:'Spotify',pinterest:'Pinterest',links:'Innblásturshlekkir',makeup:'Förðun',hair:'Hárgreiðsla',budget:'Budget',referral:'Hvar heyrðirðu af mér?',notes:'Annað',name:'Nafn',email:'Netfang',instagram:'Instagram'};
 const lines=Object.entries(payload.answers||{}).filter(([k,v])=>labels[k]&&v).map(([k,v])=>`${labels[k]}: ${v==='on'?'Já':v}`);
 if(payload.style?.title)lines.push(`Myndastemning: ${payload.style.title}`);
 if(payload.kind==='booking'||payload.estimate?.answers)lines.push(`Verðmat: ${estimateSummary(payload.estimate)}`,'Förðun, hárgreiðsla, fleiri þátttakendur og rýmisleiga eru staðfest sérstaklega í tilboði.');
 return lines.join('\n');
}
