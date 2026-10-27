import html from '../../content/competitions.html?raw';
export const dynamic='force-dynamic';
export async function GET(request:Request){return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});}
