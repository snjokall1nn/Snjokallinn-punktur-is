export const colors=['#D6F54A','#355CFF','#FF7869'];
export function clubSlug(value){return String(value).toLowerCase().replaceAll('þ','th').replaceAll('ð','d').replaceAll('æ','ae').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60).replace(/-$/,'');}
export function validateClub(body){
 if(!body||typeof body!=='object')throw new Error('Fylltu út upplýsingar um klúbbinn.');
 const name=typeof body.name==='string'?body.name.trim():'';
 const description=typeof body.description==='string'?body.description.trim():'';
 const slug=clubSlug(body.slug||name);
 if(name.length<2||name.length>100)throw new Error('Nafnið þarf að vera 2-100 stafir.');
 if(description.length<5||description.length>1200)throw new Error('Lýsingin þarf að vera 5-1200 stafir.');
 if(!slug||!colors.includes(body.color))throw new Error('Veldu gilt heiti á slóð og áherslulit.');
 return {name,description,slug,color:body.color};
}
export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createClubsApi({bucket,isOwner}){
 const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
 return async(request,path=[])=>{
 try{
  if(path.length){
   if(path.length!==1||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path[0]))return json({error:'Síða fannst ekki.'},404);
   if(!await isOwner(request))return json({error:'Skráðu þig inn sem stjórnandi.'},403);
   const key='sjut/clubs/'+path[0]+'.json',obj=await bucket().get(key);
   if(!obj)return json({error:'Klúbbur fannst ekki.'},404);
   if(request.method==='GET')return json({club:await obj.json()});
   if(request.method!=='PUT')return json({error:'Aðgerð ekki studd.'},405);
   if(request.headers.get('Origin')!==new URL(request.url).origin)return json({error:'Ógild beiðni.'},403);
   const raw=await request.text();if(raw.length>8000)return json({error:'Upplýsingarnar eru of langar.'},413);
   let club;try{club=validateClub({...JSON.parse(raw),slug:path[0]});}catch(e){return json({error:e.message},400);}
   club={...await obj.json(),...club,updated:new Date().toISOString()};
   const result=await bucket().put(key,JSON.stringify(club),{onlyIf:{etagMatches:obj.etag},customMetadata:{slug:club.slug,name:club.name,description:club.description.slice(0,180),color:club.color}});
   if(!result)return json({error:'Klúbbnum var breytt annars staðar. Opnaðu hann aftur áður en þú vistar.'},409);
   return json({club,url:'/klubbar/'+club.slug});
  }
  if(request.method==='GET'){
   let cursor,clubs=[];
   do{const result=await bucket().list({prefix:'sjut/clubs/',include:['customMetadata'],...(cursor?{cursor}:{})});
    clubs.push(...result.objects.filter(o=>o.customMetadata?.slug).map(o=>o.customMetadata));cursor=result.truncated?result.cursor:undefined;
   }while(cursor);
   return json({clubs:clubs.sort((a,b)=>a.name.localeCompare(b.name,'is')),owner:await isOwner(request)});
  }
  if(request.method!=='POST')return json({error:'Aðgerð ekki studd.'},405);
  if(request.headers.get('Origin')!==new URL(request.url).origin)return json({error:'Ógild beiðni.'},403);
  if(!await isOwner(request))return json({error:'Skráðu þig inn sem stjórnandi til að búa til klúbb.'},403);
  const raw=await request.text();if(raw.length>8000)return json({error:'Upplýsingarnar eru of langar.'},413);
  let club;try{club=validateClub(JSON.parse(raw));}catch(e){return json({error:e.message},400);}
  club.created=new Date().toISOString();
  const result=await bucket().put('sjut/clubs/'+club.slug+'.json',JSON.stringify(club),{onlyIf:{etagDoesNotMatch:'*'},customMetadata:{slug:club.slug,name:club.name,description:club.description.slice(0,180),color:club.color}});
  if(!result)return json({error:'Þessi slóð er þegar í notkun. Veldu annað heiti á slóð.'},409);
  return json({club,url:'/klubbar/'+club.slug},201);
 }catch(error){console.error('Sjút clubs unavailable',error);return json({error:'Ekki tókst að tengjast klúbbunum. Reyndu aftur.'},503);}
 };
}
