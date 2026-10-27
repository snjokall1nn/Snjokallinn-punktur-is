import { sitemapXml } from '../seo.mjs';
export function GET() {return new Response(sitemapXml(),{headers:{'Content-Type':'application/xml; charset=utf-8'}})}
