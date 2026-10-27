import { robotsText } from '../seo.mjs';
export function GET() {return new Response(robotsText,{headers:{'Content-Type':'text/plain; charset=utf-8'}})}
