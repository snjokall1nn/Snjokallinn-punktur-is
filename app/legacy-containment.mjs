// Temporary containment. No legacy role cookie ever grants API access.
export const maintenance=()=>Response.json({error:'Svæðið er tímabundið lokað vegna öryggisuppfærslu.'},{status:503,headers:{'Cache-Control':'private, no-store, max-age=0','CDN-Cache-Control':'no-store','Cloudflare-CDN-Cache-Control':'no-store','Vary':'Cookie','X-Robots-Tag':'noindex','Content-Type':'application/json; charset=utf-8'}});
export async function legacyApiGate(request,path,isOwner){
 if(['may','erna'].includes(path[0]))return maintenance();
 if(path[0]!=='clients')return null;
 if(path[2]==='portal')return maintenance();
 // Includes media, which previously preceded the owner check.
 if(!await isOwner(request))return new Response('Innskráning eiganda þarf til.',{status:401,headers:{'Cache-Control':'private, no-store, max-age=0','CDN-Cache-Control':'no-store','Cloudflare-CDN-Cache-Control':'no-store','Vary':'Cookie'}});
 return null;
}

export function maintenancePage(){
 return new Response(`<!doctype html><html lang="is"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Svæðið er tímabundið lokað | Snjókallinn</title><style>body{background:#f6f1e9;color:#201c19;font:18px/1.6 system-ui;max-width:42rem;margin:10vh auto;padding:24px}h1{font:clamp(2rem,7vw,3.6rem)/1.1 Georgia,serif}a{color:inherit}</style><main><p>SNJÓKALLINN</p><h1>Smá öryggisuppfærsla.</h1><p>Undirbúningssvæðið er tímabundið lokað. Þetta breytir ekki staðfestum myndatökum.</p><p>Vantar þig upplýsingar fyrir töku? <a href="mailto:snjokallinn@snjokallinn.com">Sendu mér línu</a> og ég hjálpa þér áfram.</p><p>Ef þú ert með óvistuð svör í öðrum opnum glugga skaltu afrita þau áður en þú endurhleður eða lokar glugganum.</p><p><a href="/">Til baka á forsíðuna</a></p></main></html>`,{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store, max-age=0','CDN-Cache-Control':'no-store','Cloudflare-CDN-Cache-Control':'no-store','Vary':'Cookie','X-Robots-Tag':'noindex, nofollow, noarchive'}});
}
