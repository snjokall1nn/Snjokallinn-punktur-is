export const privateHeaders={
 'Cache-Control':'private, no-store, max-age=0',
 'CDN-Cache-Control':'no-store',
 'Cloudflare-CDN-Cache-Control':'no-store',
 'Vary':'Cookie',
 'X-Content-Type-Options':'nosniff',
 'X-Robots-Tag':'noindex, nofollow, noarchive',
 'Cross-Origin-Resource-Policy':'same-origin',
};
export async function servePrivateClientAsset(request, assets, isOwner){
 // Authentication precedes lookup, decoding or conditional/range processing.
 if(!await isOwner(request))return new Response('Innskráning eiganda þarf til.',{status:401,headers:privateHeaders});
 if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405,headers:{...privateHeaders,Allow:'GET, HEAD'}});
 let path;try{path=decodeURIComponent(new URL(request.url).pathname);}catch{return new Response(null,{status:404,headers:privateHeaders});}
 const data=Object.hasOwn(assets,path)?assets[path]:null;
 if(typeof data!=='string')return new Response(null,{status:404,headers:privateHeaders});
 const match=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(data);
 if(!match)return new Response(null,{status:503,headers:privateHeaders});
 const bytes=Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0));
 return new Response(request.method==='HEAD'?null:bytes,{headers:{...privateHeaders,'Content-Type':match[1],'Content-Length':String(bytes.length)}});
}
