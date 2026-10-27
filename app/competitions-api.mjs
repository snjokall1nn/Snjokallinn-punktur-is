const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex','X-Content-Type-Options':'nosniff'}});
const defaults={title:'',description:'',modelMode:'named',model:'',photographer:'Alex Snær Welker Pétursson · Snjókallinn',bts:'',location:'',schedule:'',hittumst:'https://snjokorn.is/hittumst',pinterest:'',spotify:''};
export {defaults};
export function clean(input){
 const c={};for(const k of Object.keys(defaults)){c[k]=String(input[k]??defaults[k]).trim();if(c[k].length>(['description','schedule'].includes(k)?8000:500))throw Error('Textinn er of langur.');}
 if(!c.title)throw Error('Settu inn heiti keppninnar.');if(!['named','open'].includes(c.modelMode))throw Error('Veldu módel eða umsóknir.');
 for(const k of ['hittumst','pinterest','spotify'])if(c[k]){let u;try{u=new URL(c[k]);}catch{throw Error('Settu inn gildan hlekk.');}if(u.protocol!=='https:')throw Error('Hlekkir þurfa að byrja á https://.');if(k==='hittumst'&&!['snjokorn.is','www.snjokorn.is'].includes(u.hostname))throw Error('Tímaplanshlekkurinn þarf að vera á snjokorn.is.');if(k==='pinterest'&&!/(^|\.)pinterest\.[a-z.]+$/.test(u.hostname)&&u.hostname!=='pin.it')throw Error('Notaðu Pinterest-hlekk.');if(k==='spotify'&&u.hostname!=='open.spotify.com')throw Error('Notaðu Spotify-hlekk.');}
 return c;
}
const item=r=>r?{...r,config:JSON.parse(r.config),published:!!r.published}:null;
export function createCompetitionsApi({db,isOwner}){
 const get=async slug=>item(await db().prepare('SELECT * FROM photo_competitions WHERE slug=?').bind(slug).first());
 async function api(req,path){try{
  if(req.method!=='GET'&&req.headers.get('Origin')!==new URL(req.url).origin)return json({error:'Óleyfileg beiðni.'},403);
  const owner=await isOwner(req), admin=path[0]==='admin';
  if(admin&&!owner)return json({error:'Skráðu þig inn í vefstjórn.'},401);
  if(admin&&path.length===1&&req.method==='GET')return json({items:(await db().prepare('SELECT * FROM photo_competitions ORDER BY updated DESC').all()).results.map(item),defaults});
  if(!admin&&path.length===0&&req.method==='GET')return json({items:(await db().prepare('SELECT * FROM photo_competitions WHERE published=1 ORDER BY updated DESC').all()).results.map(item).map(r=>({slug:r.slug,title:r.config.title,description:r.config.description,open:r.config.modelMode==='open'&&!r.selected}))});
  const slug=path[admin?1:0];if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug||'')||slug.length>70)return json({error:'Síða fannst ekki.'},404);
  let current=await get(slug);
  if(admin&&path.length===2&&['POST','PUT'].includes(req.method)){
   const raw=await req.text();if(raw.length>25000)return json({error:'Gögn eru of stór.'},413);let data,c;try{data=JSON.parse(raw);c=clean(data.config||{});}catch(e){return json({error:e.message},400);}
   const now=new Date().toISOString();
   if(req.method==='POST'){if(current)return json({error:'Slóðin er þegar í notkun.'},409);await db().prepare('INSERT INTO photo_competitions (slug,config,published,revision,created,updated) VALUES (?,?,?,0,?,?)').bind(slug,JSON.stringify(c),data.published===true?1:0,now,now).run();}
   else {if(!current)return json({error:'Síða fannst ekki.'},404);if(!Number.isInteger(data.revision))return json({error:'Ógild útgáfa.'},400);if(current.selected&&(c.modelMode!=='named'||c.model!==current.config.model))return json({error:'Módel hefur þegar verið valið úr umsóknum.'},400);const updated=await db().prepare('UPDATE photo_competitions SET config=?,published=?,revision=revision+1,updated=? WHERE slug=? AND revision=? RETURNING slug').bind(JSON.stringify(c),data.published===true?1:0,now,slug,data.revision).first();if(!updated)return json({error:'Nýrri breytingar eru til. Endurhlaða síðunni.'},409);}
   return json({item:await get(slug)},req.method==='POST'?201:200);
  }
  if(!current||(!current.published&&!owner))return json({error:'Síða fannst ekki.'},404);
  if(admin&&path[2]==='applications'&&req.method==='GET')return json({items:(await db().prepare('SELECT * FROM photo_applications WHERE competition=? ORDER BY created DESC').bind(slug).all()).results,selected:current.selected});
  if(admin&&path[2]==='select'&&req.method==='POST'){
   const data=await req.json();const a=await db().prepare('SELECT * FROM photo_applications WHERE id=? AND competition=?').bind(String(data.id||''),slug).first();if(!a)return json({error:'Umsókn fannst ekki.'},404);
   if(current.config.modelMode!=='open'||current.selected)return json({error:'Módel hefur þegar verið valið eða umsóknir eru lokaðar.'},409);
   const c={...current.config,modelMode:'named',model:a.name};const r=await db().prepare('UPDATE photo_competitions SET selected=?,config=?,revision=revision+1,updated=? WHERE slug=? AND selected IS NULL AND revision=? RETURNING slug').bind(a.id,JSON.stringify(c),new Date().toISOString(),slug,current.revision).first();if(!r)return json({error:'Keppnin hefur breyst. Endurhlaða síðunni.'},409);return json({item:await get(slug)});
  }
  if(!admin&&path.length===1&&req.method==='GET')return json({item:{slug:current.slug,config:current.config,open:current.config.modelMode==='open'&&!current.selected}});
  if(!admin&&path[1]==='apply'&&req.method==='POST'){
   const raw=await req.text();if(raw.length>15000)return json({error:'Textinn er of langur.'},413);let d;try{d=JSON.parse(raw);}catch{return json({error:'Ógild umsókn.'},400);}if(d.website)return json({error:'Ógild umsókn.'},400);
   const name=String(d.name||'').trim(),email=String(d.email||'').trim().toLowerCase(),contact=String(d.contact||'').trim(),ideas=String(d.ideas||'').trim();
   if(!name||name.length>120||!/^\S+@\S+\.\S+$/.test(email)||email.length>254||contact.length>500||!ideas||ideas.length>8000||d.consent!==true)return json({error:'Fylltu inn nafn, netfang og hugmyndir og samþykktu að upplýsingarnar séu vistaðar.'},400);
   // Conditional insert and unique ID keep submissions durable; state is checked inside the insert.
   const id=crypto.randomUUID();const r=await db().prepare("INSERT INTO photo_applications (id,competition,name,email,contact,ideas,created) SELECT ?,slug,?,?,?,?,? FROM photo_competitions WHERE slug=? AND published=1 AND selected IS NULL AND json_extract(config,'$.modelMode')='open' RETURNING id").bind(id,name,email,contact,ideas,new Date().toISOString(),slug).first();if(!r)return json({error:'Umsóknir eru lokaðar.'},409);return json({ok:true},201);
  }
  return json({error:'Beiðni fannst ekki.'},404);
 }catch(e){console.error('Competitions API',e.message);return json({error:'Ekki tókst að sækja eða vista. Reyndu aftur.'},503);}}
 return {api,get};
}
