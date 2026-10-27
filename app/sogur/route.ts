import html from '../../content/story-archive.html?raw';
import {seoHead} from '../seo.mjs';
export const dynamic='force-dynamic';
export function GET(){return new Response(html.replace('<!--seo-head-->',seoHead().replace(/<title>[^<]*<\/title>/, '<title>Sögur og pælingar | Snjókallinn</title>').replace('rel="canonical" href="https://snjokallinn.com/"','rel="canonical" href="https://snjokallinn.com/sogur"')),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});}
