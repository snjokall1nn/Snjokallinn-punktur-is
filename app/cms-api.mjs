import {heroCollection,heroSource} from './editorial-hero.mjs';
import { UUID, validateContent, imageType } from './cms-validation.mjs';
export function createCmsApi({bucket,isOwner,readContent,fields,seed,json}) {
return async function api(request,path) {
  try {
    const key=path.join('/');const method=request.method;
    if (key==='content' && method==='GET') return json((await readContent()).content);
    if (key.startsWith('media/') && method==='GET') {
      const id=path[1];if (!UUID.test(id)) return json({error:'Finnst ekki.'},404);
      const pub=(await readContent()).content;
      const visible=heroCollection(pub).some(i=>i.id===id)||pub.albums.some((a)=>!a.hidden && a.images.some((i)=>i.id===id));
      if (!visible && !await isOwner(request)) return json({error:'Finnst ekki.'},404);
      const obj=await bucket().get(`media/${id}`);if (!obj) return json({error:'Finnst ekki.'},404);
      return new Response(obj.body,{headers:{'Content-Type':obj.httpMetadata?.contentType || 'image/webp','Cache-Control':'private, max-age=300','X-Content-Type-Options':'nosniff'}});
    }
    if (!await isOwner(request)) return json({error:'Skráðu þig inn í vefstjórn.'},403);
    if (method!=='GET' && request.headers.get('Origin')!==new URL(request.url).origin) return json({error:'Ógild beiðni.'},403);
    if (key==='editor' && method==='GET') {
      const draft=await readContent('draft');const published=await readContent();
      return json({...draft,content:{...draft.content,heroImages:heroCollection(draft.content)},heroCatalog:heroCollection({}).map(item=>({...item,src:heroSource(item)})),fields,publishedRevision:(published.content).revision});
    }
    if (key==='upload' && method==='POST') {
      if (Number(request.headers.get('Content-Length'))>15*1024*1024) return json({error:'Mynd má vera allt að 15 MB.'},413);
      const bytes=new Uint8Array(await request.arrayBuffer());
      if (bytes.byteLength>15*1024*1024) return json({error:'Mynd má vera allt að 15 MB.'},413);
      const type=imageType(bytes);if (!type) return json({error:'Veldu JPG, PNG eða WebP mynd.'},400);
      const id=crypto.randomUUID();await bucket().put(`media/${id}`,bytes,{httpMetadata:{contentType:type}});
      return json({id});
    }
    if (key==='editor' && method==='PUT') {
      const text=await request.text();if (text.length>2*1024*1024) return json({error:'Efnið er of stórt.'},413);
      const body=JSON.parse(text);
      const content=validateContent(body.content,new Set(fields.map(f=>f.id)),new Set(seed.sections.map(s=>s.id)));
      for (const a of content.albums) for (const i of a.images) if (!await bucket().head(`media/${i.id}`)) return json({error:'Mynd vantar í geymslu.'},400);
      if(content.heroImages)for(const image of content.heroImages)if(!image.id.startsWith('hero-')&&!await bucket().head(`media/${image.id}`))return json({error:'Forsíðumynd vantar í geymslu.'},400);
      const previous=await readContent('draft');
      if(content.heroImages===undefined&&previous.content.heroImages!==undefined)content.heroImages=previous.content.heroImages;
      if (body.etag!==previous.etag || content.revision!==(previous.content).revision) return json({error:'Drögin breyttust í öðrum glugga. Endurhlaðaðu áður en þú vistar.'},409);
      content.revision++;content.updatedAt=new Date().toISOString();
      const saved=await bucket().put('cms/draft.json',JSON.stringify(content),{onlyIf:previous.etag?{etagMatches:previous.etag}:{etagDoesNotMatch:'*'},httpMetadata:{contentType:'application/json'}});
      if (!saved) return json({error:'Drögin breyttust. Endurhlaðaðu síðunni.'},409);
      return json({content,etag:saved.etag});
    }
    if (key==='publish' && method==='POST') {
      const body=await request.json();const draft=await readContent('draft');
      if (!draft.etag || body.etag!==draft.etag) return json({error:'Vistaðu nýjustu drögin áður en þú birtir.'},409);
      await bucket().put('cms/published.json',JSON.stringify(draft.content),{httpMetadata:{contentType:'application/json'}});
      return json({revision:(draft.content).revision});
    }
    return json({error:'Finnst ekki.'},404);
  } catch(e) { console.error('CMS request failed',e);return json({error:'Ekki tókst að afgreiða beiðnina. Reyndu aftur.'},400); }
}

}
